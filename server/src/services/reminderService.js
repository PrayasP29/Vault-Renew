import Reminder from "../models/Reminder.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";
import {
  DEFAULT_TIMEZONE,
  parseCalendarDate,
  addCalendarDays,
  addMonthsClamped,
  zonedTimeToUtc,
  utcCalendarParts,
  calendarKeyUtc,
  calendarKeyInTimeZone,
  isCalendarDateBeforeToday,
} from "../utils/dates.js";

export function advanceRenewalDate(baseDate, billingCycle) {
  const d = parseCalendarDate(baseDate);
  if (!d) return null;
  switch (billingCycle) {
    case "monthly":
      return addMonthsClamped(d, 1);
    case "quarterly":
      return addMonthsClamped(d, 3);
    case "yearly":
      return addMonthsClamped(d, 12);
    case "custom":
    default:
      return null;
  }
}

export function calculateReminderDates(renewalDate, timeZone = DEFAULT_TIMEZONE) {
  const parsed = parseCalendarDate(renewalDate);
  if (!parsed) return [];

  const twoDayDate = addCalendarDays(parsed, -2);
  const oneDayDate = addCalendarDays(parsed, -1);

  const p2 = utcCalendarParts(twoDayDate);
  const p1 = utcCalendarParts(oneDayDate);

  return [
    {
      type: "renewal_2_day",
      scheduledFor: zonedTimeToUtc(p2.year, p2.month, p2.day, 9, 0, timeZone),
    },
    {
      type: "renewal_1_day",
      scheduledFor: zonedTimeToUtc(p1.year, p1.month, p1.day, 9, 0, timeZone),
    },
  ];
}

export async function syncRemindersForSubscription(subscription) {
  const { _id, userId, renewalDate, status } = subscription;

  if (status === "cancelled") {
    await Reminder.deleteMany({ subscriptionId: _id, status: "pending" });
    return;
  }

  const parsedRenewal = parseCalendarDate(renewalDate);
  if (!parsedRenewal) return;

  const cycleKey = parsedRenewal.toISOString().slice(0, 10);

  const user = await User.findById(userId).select("timezone");
  const timeZone = user?.timezone || DEFAULT_TIMEZONE;

  const dates = calculateReminderDates(parsedRenewal, timeZone);

  // Clean up any stale pending reminders from a different cycle
  await Reminder.deleteMany({
    subscriptionId: _id,
    status: "pending",
    cycleKey: { $ne: cycleKey },
  });

  for (const { type, scheduledFor } of dates) {
    const existing = await Reminder.findOne({ subscriptionId: _id, type, cycleKey });
    if (!existing) {
      await Reminder.create({
        userId,
        subscriptionId: _id,
        type,
        scheduledFor,
        cycleKey,
        status: "pending",
        attempts: 0,
      });
    } else if (existing.status === "pending") {
      existing.scheduledFor = scheduledFor;
      await existing.save();
    }
  }
}

export async function createRemindersForSubscription(subscription) {
  await syncRemindersForSubscription(subscription);
}

export async function deleteRemindersForSubscription(subscriptionId) {
  await Reminder.deleteMany({ subscriptionId });
}

export async function rolloverDueSubscriptions() {
  const now = new Date();
  const candidates = await Subscription.find({
    status: "active",
    billingCycle: { $in: ["monthly", "quarterly", "yearly"] },
  }).populate("userId", "timezone");

  let rolledCount = 0;

  for (const sub of candidates) {
    const timeZone = sub.userId?.timezone || DEFAULT_TIMEZONE;
    if (isCalendarDateBeforeToday(sub.renewalDate, now, timeZone)) {
      let nextDate = advanceRenewalDate(sub.renewalDate, sub.billingCycle);
      while (
        nextDate &&
        calendarKeyUtc(nextDate) < calendarKeyInTimeZone(now, timeZone)
      ) {
        nextDate = advanceRenewalDate(nextDate, sub.billingCycle);
      }

      if (nextDate) {
        sub.renewalDate = nextDate;
        await sub.save();
        await syncRemindersForSubscription(sub);
        rolledCount++;
      }
    }
  }

  return rolledCount;
}

export async function ensureReminderIndexes() {
  const analysis = await analyzeReminderCycleKeys();
  if (analysis.nullCycleKeyCount > 0 || analysis.duplicateGroups.length > 0) {
    console.warn(
      `[ReminderIndexes] migration required; skipped index sync ` +
      `(${analysis.nullCycleKeyCount} null cycleKey, ${analysis.duplicateGroups.length} duplicate group(s))`
    );
    return { synced: false, analysis };
  }

  try {
    const coll = Reminder.collection;
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      if (idx.name === "subscriptionId_1_type_1" && idx.unique) {
        await coll.dropIndex("subscriptionId_1_type_1");
      }
    }
  } catch (err) {
    // collection may not exist yet
  }
  await Reminder.syncIndexes();
  return { synced: true, analysis };
}

const reminderStatePriority = {
  sent: 0,
  processing: 1,
  pending: 2,
  failed: 3,
};

function dateKey(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toISOString().slice(0, 10) : null;
}

export async function analyzeReminderCycleKeys() {
  const reminders = await Reminder.collection
    .find({})
    .project({
      _id: 1,
      userId: 1,
      subscriptionId: 1,
      type: 1,
      cycleKey: 1,
      scheduledFor: 1,
      status: 1,
      attempts: 1,
      failureReason: 1,
      sentAt: 1,
      updatedAt: 1,
      createdAt: 1,
    })
    .sort({ subscriptionId: 1, type: 1, updatedAt: -1, _id: 1 })
    .toArray();
  const subscriptionIds = [...new Set(reminders.map((reminder) => String(reminder.subscriptionId)))];
  const subscriptions = await Subscription.find({ _id: { $in: subscriptionIds } })
    .select("_id renewalDate")
    .lean();
  const renewalDates = new Map(subscriptions.map((sub) => [String(sub._id), dateKey(sub.renewalDate)]));
  const groups = new Map();

  for (const reminder of reminders) {
    const key = `${reminder.subscriptionId}:${reminder.type}:${reminder.cycleKey ?? "null"}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(reminder);
  }

  const duplicateGroups = [];
  const records = [];
  for (const [groupKey, group] of groups) {
    const sorted = [...group].sort((a, b) => {
      const state = (reminderStatePriority[a.status] ?? 9) - (reminderStatePriority[b.status] ?? 9);
      if (state !== 0) return state;
      const updated = new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      return updated || String(a._id).localeCompare(String(b._id));
    });
    const baseKey =
      (group[0].cycleKey && String(group[0].cycleKey)) ||
      renewalDates.get(String(group[0].subscriptionId)) ||
      dateKey(group[0].scheduledFor) ||
      dateKey(group[0].createdAt) ||
      `legacy-${String(group[0]._id)}`;

    if (group.length > 1) {
      duplicateGroups.push({
        groupKey,
        count: group.length,
        records: group.map((reminder) => ({
          id: String(reminder._id),
          status: reminder.status,
          scheduledFor: reminder.scheduledFor,
          sentAt: reminder.sentAt || null,
        })),
      });
    }

    sorted.forEach((reminder, index) => {
      const shouldFail = group.length > 1 && index > 0 && reminder.status === "pending";
      if (group[0].cycleKey !== null && group[0].cycleKey !== undefined && group.length === 1) return;
      records.push({
        id: String(reminder._id),
        currentCycleKey: reminder.cycleKey ?? null,
        currentStatus: reminder.status,
        proposedCycleKey: index === 0 ? baseKey : `${baseKey}-legacy-${String(reminder._id)}`,
        proposedStatus: shouldFail ? "failed" : reminder.status,
        proposedFailureReason: shouldFail
          ? "legacy duplicate reminder reconciled; canonical reminder retained"
          : reminder.failureReason || null,
      });
    });
  }

  return {
    nullCycleKeyCount: reminders.filter((reminder) => reminder.cycleKey == null).length,
    duplicateGroups,
    records,
  };
}

export async function migrateReminderCycleKeys() {
  const analysis = await analyzeReminderCycleKeys();
  const results = [];
  for (const record of analysis.records) {
    const set = { cycleKey: record.proposedCycleKey };
    if (record.proposedStatus === "failed" && record.currentStatus === "pending") {
      set.status = "failed";
      set.failedAt = new Date();
      set.lastAttemptAt = new Date();
      set.nextRetryAt = null;
      set.claimedAt = null;
      set.failureReason = record.proposedFailureReason;
    }
    const cycleFilter = record.currentCycleKey === null
      ? { cycleKey: null }
      : { cycleKey: record.currentCycleKey };
    const result = await Reminder.updateOne({ _id: record.id, ...cycleFilter }, { $set: set });
    results.push({ id: record.id, modified: result.modifiedCount === 1, ...set });
  }
  await Reminder.syncIndexes();
  return { analysis, results };
}
