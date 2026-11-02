import Reminder from "../models/Reminder.js";
import Subscription from "../models/Subscription.js";
import NotificationDevice from "../models/NotificationDevice.js";
import { sendPushNotification } from "./pushNotificationService.js";
import { rolloverDueSubscriptions } from "./reminderService.js";

const LEASE_MS = 5 * 60 * 1000;

let intervalHandle = null;
let running = false;

function buildContent(subscription, type) {
  const name = subscription.name;
  const amount = subscription.amount;
  const currency = subscription.currency || "INR";
  const price = `${currency} ${amount}`;
  if (type === "renewal_2_day") {
    return {
      title: "Subscription Renewal in 2 Days",
      body: `${name} renews in 2 days for ${price}.`,
    };
  }
  return {
    title: "Subscription Renewal Tomorrow",
    body: `${name} renews tomorrow for ${price}.`,
  };
}

async function processReminder(reminder) {
  console.log(`[ReminderScheduler] Processing reminder ${reminder._id}`);
  const now = new Date();

  // Load subscription with user isolation
  const subscription = await Subscription.findOne({
    _id: reminder.subscriptionId,
    userId: reminder.userId,
  });

  if (!subscription) {
    await Reminder.findByIdAndUpdate(reminder._id, {
      $set: {
        status: "failed",
        failedAt: now,
        lastAttemptAt: now,
        nextRetryAt: null,
        failureReason: "subscription not found",
        claimedAt: null,
      },
      $inc: { attempts: 1 },
    });
    console.log(`[ReminderScheduler] Reminder ${reminder._id} permanently failed (subscription not found)`);
    return;
  }

  if (subscription.status !== "active") {
    await Reminder.findByIdAndUpdate(reminder._id, {
      $set: {
        status: "failed",
        failedAt: now,
        lastAttemptAt: now,
        nextRetryAt: null,
        failureReason: "subscription cancelled",
        claimedAt: null,
      },
      $inc: { attempts: 1 },
    });
    console.log(`[ReminderScheduler] Reminder ${reminder._id} skipped (subscription cancelled)`);
    return;
  }

  const devices = await NotificationDevice.find({ userId: reminder.userId, enabled: true });

  if (!devices.length) {
    const newAttempts = (reminder.attempts || 0) + 1;
    if (newAttempts === 1) {
      await Reminder.findByIdAndUpdate(reminder._id, {
        $set: {
          status: "pending",
          lastAttemptAt: now,
          nextRetryAt: new Date(now.getTime() + 60 * 60 * 1000),
          failureReason: "no enabled devices",
          claimedAt: null,
        },
        $inc: { attempts: 1 },
      });
      console.log(`[ReminderScheduler] Retry scheduled for ${reminder._id} (no devices)`);
    } else {
      await Reminder.findByIdAndUpdate(reminder._id, {
        $set: {
          status: "failed",
          failedAt: now,
          lastAttemptAt: now,
          nextRetryAt: null,
          failureReason: "no enabled devices",
          claimedAt: null,
        },
        $inc: { attempts: 1 },
      });
      console.log(`[ReminderScheduler] Reminder ${reminder._id} permanently failed (no devices)`);
    }
    return;
  }

  const { title, body } = buildContent(subscription, reminder.type);
  const data = {
    type: "subscription_reminder",
    reminderType: reminder.type,
    reminderId: reminder._id.toString(),
    subscriptionId: subscription._id.toString(),
  };

  let successCount = 0;
  const acceptedMessageIds = [];
  let lastError = null;

  for (const dev of devices) {
    try {
      const result = await sendPushNotification({
        userId: reminder.userId,
        installationId: dev.installationId,
        title,
        body,
        data,
      });
      if (result.success) {
        successCount++;
        if (result.messageId) acceptedMessageIds.push(result.messageId);
      }
      else lastError = result.reason || "firebase-error";
    } catch (e) {
      lastError = e.message || "firebase-error";
    }
  }

  if (successCount > 0) {
    await Reminder.findByIdAndUpdate(reminder._id, {
      $set: {
        status: "sent",
        sentAt: now,
        lastAttemptAt: now,
        nextRetryAt: null,
        failureReason: null,
        claimedAt: null,
      },
      $inc: { attempts: 1 },
    });
    console.log(
      `[ReminderScheduler] Accepted by FCM reminder ${reminder._id} for ${successCount} device(s) ` +
      `(messageIds: ${acceptedMessageIds.length})`
    );
  } else {
    const reason = lastError || "all devices failed";
    const newAttempts = (reminder.attempts || 0) + 1;
    if (newAttempts === 1) {
      await Reminder.findByIdAndUpdate(reminder._id, {
        $set: {
          status: "pending",
          lastAttemptAt: now,
          nextRetryAt: new Date(now.getTime() + 60 * 60 * 1000),
          failureReason: String(reason).slice(0, 500),
          claimedAt: null,
        },
        $inc: { attempts: 1 },
      });
      console.log(`[ReminderScheduler] Retry scheduled for ${reminder._id}`);
    } else {
      await Reminder.findByIdAndUpdate(reminder._id, {
        $set: {
          status: "failed",
          failedAt: now,
          lastAttemptAt: now,
          nextRetryAt: null,
          failureReason: String(reason).slice(0, 500),
          claimedAt: null,
        },
        $inc: { attempts: 1 },
      });
      console.log(`[ReminderScheduler] Reminder ${reminder._id} permanently failed`);
    }
  }
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const now = new Date();

    // 1. Reclaim stale leases
    const staleCutoff = new Date(now.getTime() - LEASE_MS);
    const staleList = await Reminder.find({
      status: "processing",
      claimedAt: { $lt: staleCutoff },
    });

    for (const stale of staleList) {
      const newAttempts = (stale.attempts || 0) + 1;
      await Reminder.findByIdAndUpdate(stale._id, {
        $set: {
          status: newAttempts >= 2 ? "failed" : "pending",
          claimedAt: null,
          lastAttemptAt: now,
          ...(newAttempts >= 2
            ? { failedAt: now, failureReason: "lease expired", nextRetryAt: null }
            : { nextRetryAt: new Date(now.getTime() + 60 * 1000) }),
        },
        $inc: { attempts: 1 },
      });
    }

    // 2. Rollover due subscriptions to next cycle
    try {
      await rolloverDueSubscriptions();
    } catch (rollErr) {
      console.error("[ReminderScheduler] rollover error:", rollErr.message);
    }

    // 3. Process eligible pending reminders
    const eligible = await Reminder.find({
      status: "pending",
      scheduledFor: { $lte: now },
      $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
    }).limit(50);

    for (const rem of eligible) {
      try {
        const claimed = await Reminder.findOneAndUpdate(
          { _id: rem._id, status: "pending" },
          { $set: { status: "processing", claimedAt: new Date() } },
          { new: true }
        );
        if (!claimed) continue;
        await processReminder(claimed);
      } catch (e) {
        console.error(`[ReminderScheduler] error processing ${rem._id}:`, e.message);
        try {
          await Reminder.findOneAndUpdate(
            { _id: rem._id, status: "processing" },
            { $set: { status: "pending", claimedAt: null } }
          );
        } catch {}
      }
    }
  } catch (e) {
    console.error("[ReminderScheduler] tick error:", e.message);
  } finally {
    running = false;
  }
}

export function startReminderScheduler() {
  if (intervalHandle) return intervalHandle;
  console.log("[ReminderScheduler] starting (interval 60s)");
  setTimeout(tick, 2000);
  intervalHandle = setInterval(tick, 60 * 1000);
  return intervalHandle;
}

export function stopReminderScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log("[ReminderScheduler] stopped");
  }
}

export const _internal = { tick, processReminder, buildContent, LEASE_MS };
