import Reminder from "../models/Reminder.js";

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function calculateReminderDates(renewalDate) {
  const d = new Date(renewalDate);
  return [
    { type: "renewal_2_day", scheduledFor: addDays(d, -2) },
    { type: "renewal_1_day", scheduledFor: addDays(d, -1) },
  ];
}

// ponytail: single upsert per type, no bulk; add bulkWrite if 1000s of subs matter
export async function syncRemindersForSubscription(subscription) {
  const { _id, userId, renewalDate, status } = subscription;

  // if cancelled, do not create new reminders; keep existing pending but scheduler will ignore (option B)
  // For update where status becomes cancelled, we leave existing as pending but scheduler will skip
  if (status === "cancelled") {
    return;
  }

  const now = new Date();
  const dates = calculateReminderDates(renewalDate);

  for (const { type, scheduledFor } of dates) {
    if (scheduledFor.getTime() <= now.getTime()) {
      // past — remove existing pending for this type to avoid spam
      await Reminder.deleteOne({ subscriptionId: _id, type, status: "pending" });
      continue;
    }

    // upsert pending reminder, reset if already sent/failed but renewal changed — treat as new schedule
    await Reminder.findOneAndUpdate(
      { subscriptionId: _id, type },
      {
        $set: {
          userId,
          subscriptionId: _id,
          type,
          scheduledFor,
          status: "pending",
          attempts: 0,
          nextRetryAt: null,
          lastAttemptAt: null,
          sentAt: null,
          failedAt: null,
          failureReason: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // cleanup: any reminder for this subscription with type not in expected (should not happen) — keep as is
}

export async function createRemindersForSubscription(subscription) {
  await syncRemindersForSubscription(subscription);
}

export async function deleteRemindersForSubscription(subscriptionId) {
  await Reminder.deleteMany({ subscriptionId });
}
