// DB-backed checks for refresh rotation, upload quotas and reminder workers.
// Skipped unless MONGO_URI_TEST points at a disposable database.
import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../src/models/User.js";
import Upload from "../src/models/Upload.js";
import Subscription from "../src/models/Subscription.js";
import Reminder from "../src/models/Reminder.js";
import { generateRefreshToken } from "../src/utils/jwt.js";
import { hashRefreshToken } from "../src/utils/tokenHash.js";
import { refresh, logout, changePassword } from "../src/controllers/authController.js";
import { clearSentReminders } from "../src/controllers/reminderController.js";
import {
  MAX_STORAGE_BYTES,
  MAX_UPLOADS_PER_USER,
  UploadQuotaError,
  reconcileUploadUsage,
  releaseUploadQuota,
  reserveUploadQuota,
} from "../src/services/uploadQuota.js";
import {
  addCalendarDays,
  addMonthsClamped,
  calendarKeyInTimeZone,
  calendarKeyUtc,
  parseCalendarDate,
} from "../src/utils/dates.js";
import {
  ensureReminderIndexes,
  rolloverDueSubscriptions,
  syncRemindersForSubscription,
} from "../src/services/reminderService.js";
import { _internal } from "../src/services/reminderScheduler.js";

const TEST_URI = process.env.MONGO_URI_TEST;
const dbTest = TEST_URI ? test : test.skip;

process.env.JWT_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";

const createRes = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
  return res;
};

const makeUser = async (prefix = "user") => {
  const email = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  return User.create({
    name: "Test User",
    email,
    password: await bcrypt.hash("Str0ng!Pass", 4),
    emailVerified: true,
    uploadUsageInitialized: true,
  });
};

const issueRefresh = async (user) => {
  const token = generateRefreshToken(user._id);
  await User.updateOne(
    { _id: user._id },
    { $set: { refreshToken: hashRefreshToken(token), refreshTokenHistory: [] } }
  );
  return token;
};

const callRefresh = async (token) => {
  const res = createRes();
  await refresh({ body: { refreshToken: token } }, res);
  return res;
};

const todayUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

if (TEST_URI) {
  before(async () => {
    await mongoose.connect(TEST_URI);
    await Promise.all([
      User.init(),
      Upload.init(),
      Subscription.init(),
      Reminder.init(),
    ]);
    await ensureReminderIndexes();
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Upload.deleteMany({}),
      Subscription.deleteMany({}),
      Reminder.deleteMany({}),
    ]);
  });
}

dbTest("refresh rotation returns a new pair and keeps only one winner", async () => {
  const user = await makeUser("rotate");
  const first = await issueRefresh(user);

  const [a, b] = await Promise.all([callRefresh(first), callRefresh(first)]);
  const statuses = [a.statusCode, b.statusCode].sort();
  assert.deepEqual(statuses, [200, 401]);

  const winner = a.statusCode === 200 ? a : b;
  assert.ok(winner.body.accessToken);
  assert.ok(winner.body.refreshToken);
  assert.notEqual(winner.body.refreshToken, first);

  const stored = await User.findById(user._id).select("refreshToken");
  assert.equal(stored.refreshToken, hashRefreshToken(winner.body.refreshToken));

  // The winning token is still usable, so the loser didn't revoke the session.
  const next = await callRefresh(winner.body.refreshToken);
  assert.equal(next.statusCode, 200);
});

dbTest("a rotated token replayed inside the grace window is rejected without revoking", async () => {
  const user = await makeUser("grace");
  const first = await issueRefresh(user);

  const rotated = await callRefresh(first);
  assert.equal(rotated.statusCode, 200);

  const replay = await callRefresh(first);
  assert.equal(replay.statusCode, 401);
  assert.match(replay.body.message, /already used/);

  const stillValid = await callRefresh(rotated.body.refreshToken);
  assert.equal(stillValid.statusCode, 200);
});

dbTest("replay after the grace window revokes the current session", async () => {
  const user = await makeUser("reuse");
  const first = await issueRefresh(user);

  const rotated = await callRefresh(first);
  assert.equal(rotated.statusCode, 200);

  await User.updateOne(
    { _id: user._id, "refreshTokenHistory.hash": hashRefreshToken(first) },
    { $set: { "refreshTokenHistory.$.rotatedAt": new Date(Date.now() - 60_000) } }
  );

  const replay = await callRefresh(first);
  assert.equal(replay.statusCode, 401);
  assert.match(replay.body.message, /reuse/);

  const revoked = await callRefresh(rotated.body.refreshToken);
  assert.equal(revoked.statusCode, 401);
});

dbTest("logout invalidates the stored refresh session", async () => {
  const user = await makeUser("logout");
  const token = await issueRefresh(user);

  const res = createRes();
  await logout({ body: { refreshToken: token } }, res);
  assert.equal(res.statusCode, 200);

  const afterLogout = await callRefresh(token);
  assert.equal(afterLogout.statusCode, 401);
});

dbTest("changing a password revokes refresh tokens and updates the hash", async () => {
  const user = await makeUser("password");
  const token = await issueRefresh(user);

  const res = createRes();
  await changePassword(
    {
      user: { userId: user._id.toString() },
      body: { currentPassword: "Str0ng!Pass", newPassword: "N3w!Passw0rd" },
    },
    res
  );
  assert.equal(res.statusCode, 200);

  const afterChange = await callRefresh(token);
  assert.equal(afterChange.statusCode, 401);

  const stored = await User.findById(user._id).select("password");
  assert.equal(await bcrypt.compare("N3w!Passw0rd", stored.password), true);
});

dbTest("concurrent upload reservations never exceed the file cap", async () => {
  const user = await makeUser("quota");

  const attempts = await Promise.allSettled(
    Array.from({ length: MAX_UPLOADS_PER_USER + 10 }, () => reserveUploadQuota(user._id, 1))
  );
  const granted = attempts.filter((r) => r.status === "fulfilled").length;
  assert.equal(granted, MAX_UPLOADS_PER_USER);

  const counters = await User.findById(user._id).select("uploadCount uploadBytes");
  assert.equal(counters.uploadCount, MAX_UPLOADS_PER_USER);
  assert.equal(counters.uploadBytes, MAX_UPLOADS_PER_USER);

  await releaseUploadQuota(user._id, 1);
  const released = await User.findById(user._id).select("uploadCount uploadBytes");
  assert.equal(released.uploadCount, MAX_UPLOADS_PER_USER - 1);
  assert.equal(released.uploadBytes, MAX_UPLOADS_PER_USER - 1);
});

dbTest("storage quota is enforced atomically and released on delete", async () => {
  const user = await makeUser("storage");

  await assert.rejects(
    () => reserveUploadQuota(user._id, MAX_STORAGE_BYTES + 1),
    (err) => err instanceof UploadQuotaError && err.code === "UPLOAD_STORAGE_LIMIT"
  );

  await reserveUploadQuota(user._id, MAX_STORAGE_BYTES);
  await assert.rejects(
    () => reserveUploadQuota(user._id, 1),
    (err) => err instanceof UploadQuotaError && err.code === "UPLOAD_STORAGE_LIMIT"
  );

  await releaseUploadQuota(user._id, MAX_STORAGE_BYTES);
  const counters = await User.findById(user._id).select("uploadCount uploadBytes");
  assert.equal(counters.uploadCount, 0);
  assert.equal(counters.uploadBytes, 0);
});

dbTest("reconcile rebuilds counters from the Upload collection", async () => {
  const user = await makeUser("reconcile");
  await Upload.create([
    {
      userId: user._id,
      originalName: "a.png",
      storedName: "a.png",
      mimeType: "image/png",
      size: 10,
      path: "/tmp/a.png",
    },
    {
      userId: user._id,
      originalName: "b.png",
      storedName: "b.png",
      mimeType: "image/png",
      size: 15,
      path: "/tmp/b.png",
    },
  ]);

  await reconcileUploadUsage({ userId: user._id });
  const counters = await User.findById(user._id).select("uploadCount uploadBytes");
  assert.equal(counters.uploadCount, 2);
  assert.equal(counters.uploadBytes, 25);
});

const makeSubscription = (userId, renewalDate, overrides = {}) =>
  Subscription.create({
    userId,
    name: "Test Plan",
    amount: 199,
    currency: "INR",
    renewalDate,
    billingCycle: "monthly",
    ...overrides,
  });

dbTest("reminder sync is idempotent and keeps sent history per cycle", async () => {
  const user = await makeUser("sync");
  const renewal = addCalendarDays(todayUtc(), 2);
  const sub = await makeSubscription(user._id, renewal);

  await syncRemindersForSubscription(sub);
  const firstCycle = await Reminder.find({ subscriptionId: sub._id });
  assert.equal(firstCycle.length, 2);
  assert.ok(firstCycle.every((r) => r.status === "pending"));

  await Reminder.updateMany({ subscriptionId: sub._id }, { $set: { status: "sent" } });
  await syncRemindersForSubscription(await Subscription.findById(sub._id));
  assert.equal(await Reminder.countDocuments({ subscriptionId: sub._id }), 2);

  const nextDate = addMonthsClamped(renewal, 1);
  await Subscription.updateOne({ _id: sub._id }, { $set: { renewalDate: nextDate } });
  await syncRemindersForSubscription(await Subscription.findById(sub._id));

  const all = await Reminder.find({ subscriptionId: sub._id });
  assert.equal(all.length, 4);
  assert.equal(all.filter((r) => r.status === "pending").length, 2);

  await Subscription.updateOne({ _id: sub._id }, { $set: { status: "cancelled" } });
  await syncRemindersForSubscription(await Subscription.findById(sub._id));
  assert.equal(await Reminder.countDocuments({ subscriptionId: sub._id, status: "pending" }), 0);
});

dbTest("rollover advances overdue subscriptions and creates the next cycle", async () => {
  const user = await makeUser("rollover");
  const oldDate = addCalendarDays(todayUtc(), -2);
  const sub = await makeSubscription(user._id, oldDate);

  const rolled = await rolloverDueSubscriptions();
  assert.equal(rolled, 1);

  const updated = await Subscription.findById(sub._id);
  assert.ok(calendarKeyUtc(updated.renewalDate) > calendarKeyUtc(oldDate));
  assert.ok(
    calendarKeyUtc(updated.renewalDate) >= calendarKeyInTimeZone(new Date(), user.timezone)
  );

  const reminders = await Reminder.find({ subscriptionId: sub._id, status: "pending" });
  assert.equal(reminders.length, 2);
  assert.equal(reminders[0].userId.toString(), user._id.toString());
});

dbTest("custom cycles are never rolled over", async () => {
  const user = await makeUser("custom");
  const oldDate = addCalendarDays(todayUtc(), -2);
  const sub = await makeSubscription(user._id, oldDate, { billingCycle: "custom" });

  assert.equal(await rolloverDueSubscriptions(), 0);
  assert.equal(parseCalendarDate((await Subscription.findById(sub._id)).renewalDate).getTime(), oldDate.getTime());
});

dbTest("scheduler reclaims stale leases but leaves a live claim alone", async () => {
  const user = await makeUser("lease");
  const sub = await makeSubscription(user._id, addCalendarDays(todayUtc(), 3));
  const past = new Date(Date.now() - 60_000);

  const stale = await Reminder.create({
    userId: user._id,
    subscriptionId: sub._id,
    type: "renewal_2_day",
    scheduledFor: past,
    status: "processing",
    attempts: 1,
    claimedAt: new Date(Date.now() - _internal.LEASE_MS - 60_000),
  });
  const live = await Reminder.create({
    userId: user._id,
    subscriptionId: sub._id,
    type: "renewal_1_day",
    scheduledFor: past,
    status: "processing",
    attempts: 1,
    claimedAt: new Date(),
  });

  await _internal.tick();

  const afterStale = await Reminder.findById(stale._id);
  assert.equal(afterStale.status, "failed");
  assert.equal(afterStale.attempts, 2);
  assert.equal(afterStale.claimedAt, null);

  const afterLive = await Reminder.findById(live._id);
  assert.equal(afterLive.status, "processing");
  assert.equal(afterLive.attempts, 1);
});

dbTest("clearSentReminders deletes only sent reminders for the authenticated user", async () => {
  const user1 = await makeUser("clear1");
  const user2 = await makeUser("clear2");
  const sub1 = await makeSubscription(user1._id, addCalendarDays(todayUtc(), 5));
  const sub2 = await makeSubscription(user2._id, addCalendarDays(todayUtc(), 5));

  // User 1 reminders: 2 sent, 1 pending, 1 failed, 1 processing
  const u1Sent1 = await Reminder.create({
    userId: user1._id,
    subscriptionId: sub1._id,
    type: "renewal_2_day",
    scheduledFor: new Date(),
    status: "sent",
    cycleKey: "2026-01-01",
  });
  const u1Sent2 = await Reminder.create({
    userId: user1._id,
    subscriptionId: sub1._id,
    type: "renewal_1_day",
    scheduledFor: new Date(),
    status: "sent",
    cycleKey: "2026-01-01",
  });
  const u1Pending = await Reminder.create({
    userId: user1._id,
    subscriptionId: sub1._id,
    type: "renewal_2_day",
    scheduledFor: new Date(),
    status: "pending",
    cycleKey: "2026-02-01",
  });
  const u1Failed = await Reminder.create({
    userId: user1._id,
    subscriptionId: sub1._id,
    type: "renewal_1_day",
    scheduledFor: new Date(),
    status: "failed",
    cycleKey: "2026-02-01",
  });
  const u1Processing = await Reminder.create({
    userId: user1._id,
    subscriptionId: sub1._id,
    type: "renewal_2_day",
    scheduledFor: new Date(),
    status: "processing",
    cycleKey: "2026-03-01",
  });

  // User 2 reminders: 1 sent, 1 pending
  const u2Sent = await Reminder.create({
    userId: user2._id,
    subscriptionId: sub2._id,
    type: "renewal_2_day",
    scheduledFor: new Date(),
    status: "sent",
    cycleKey: "2026-01-01",
  });
  const u2Pending = await Reminder.create({
    userId: user2._id,
    subscriptionId: sub2._id,
    type: "renewal_1_day",
    scheduledFor: new Date(),
    status: "pending",
    cycleKey: "2026-01-01",
  });

  // Call clearSentReminders as user1
  const req = { user: { userId: user1._id.toString() } };
  const res = createRes();
  await clearSentReminders(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.deletedCount, 2);

  // Check user1 reminders: sent are deleted, pending/failed/processing still exist
  assert.equal(await Reminder.findById(u1Sent1._id), null);
  assert.equal(await Reminder.findById(u1Sent2._id), null);
  assert.notEqual(await Reminder.findById(u1Pending._id), null);
  assert.notEqual(await Reminder.findById(u1Failed._id), null);
  assert.notEqual(await Reminder.findById(u1Processing._id), null);

  // Check user2 reminders: sent and pending remain completely untouched
  assert.notEqual(await Reminder.findById(u2Sent._id), null);
  assert.notEqual(await Reminder.findById(u2Pending._id), null);

  // Check subscriptions remain untouched
  assert.notEqual(await Subscription.findById(sub1._id), null);
  assert.notEqual(await Subscription.findById(sub2._id), null);
});

dbTest("clearSentReminders rejects unauthenticated request", async () => {
  const req = { user: {} };
  const res = createRes();
  await clearSentReminders(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
});
