import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true, index: true },
    type: { type: String, enum: ["renewal_2_day", "renewal_1_day"], required: true },
    scheduledFor: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "processing", "sent", "failed"], default: "pending" },
    attempts: { type: Number, default: 0 },
    nextRetryAt: { type: Date, default: null },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    failureReason: { type: String, default: null, maxlength: 500 },
  },
  { timestamps: true }
);

reminderSchema.index({ subscriptionId: 1, type: 1 }, { unique: true });
reminderSchema.index({ status: 1, scheduledFor: 1, nextRetryAt: 1 });

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;
