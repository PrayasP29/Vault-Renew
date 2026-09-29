import Reminder from "../models/Reminder.js";

const isValidId = (id) => /^[a-f\d]{24}$/i.test(String(id));

// ponytail: returns the reminder's own status only. per-subscription reminder mutation
// stays behind the subscription routes so there is one write path for scheduling
export const getReminders = async (req, res) => {
  try {
    const query = { userId: req.user.userId };
    const { subscriptionId, status } = req.query;
    if (isValidId(subscriptionId)) query.subscriptionId = subscriptionId;
    if (status) query.status = String(status);

    const docs = await Reminder.find(query)
      .populate("subscriptionId", "name amount currency renewalDate status")
      .sort({ scheduledFor: 1 })
      .limit(200);

    // the UI reads `subscription`, the schema stores `subscriptionId`:
    // alias it here and drop userId instead of adding a virtual + a new schema field
    const reminders = docs.map((d) => {
      const { userId, subscriptionId, ...rest } = d.toObject();
      return { ...rest, subscription: subscriptionId };
    });

    return res.status(200).json({ success: true, reminders });
  } catch (err) {
    console.error("getReminders:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
