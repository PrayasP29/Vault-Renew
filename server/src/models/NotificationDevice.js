import mongoose from "mongoose";

const notificationDeviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    installationId: { type: String, required: true, trim: true, index: true },
    platform: { type: String, required: true, enum: ["web", "android", "ios"], trim: true },
    deviceId: { type: String, trim: true, maxlength: 200 },
    enabled: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationDeviceSchema.index({ userId: 1, installationId: 1 }, { unique: true });

const NotificationDevice = mongoose.model("NotificationDevice", notificationDeviceSchema);
export default NotificationDevice;
