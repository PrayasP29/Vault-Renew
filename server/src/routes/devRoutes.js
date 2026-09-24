import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import NotificationDevice from "../models/NotificationDevice.js";
import { sendPushNotification } from "../services/pushNotificationService.js";
import { generateAccessToken } from "../utils/jwt.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

function isDevEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ENABLE_DEV_TEST_AUTH === "false") return false;
  return process.env.ENABLE_DEV_TEST_AUTH === "true";
}

router.post("/test-login", async (req, res) => {
  if (!isDevEnabled()) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  try {
    const email = "fcm-test@vault-renew.local";
    let user = await User.findOne({ email });
    if (!user) {
      const hashed = await bcrypt.hash("TestPassword123!", 10);
      user = await User.create({
        name: "FCM Test User",
        email,
        password: hashed,
        emailVerified: true,
      });
    } else if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    const accessToken = generateAccessToken(user._id);
    return res.json({
      success: true,
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error("dev test-login:", e.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/test-notification", authMiddleware, async (req, res) => {
  if (!isDevEnabled()) {
    return res.status(404).json({ success: false, message: "Not found" });
  }
  try {
    const userId = req.user.userId;
    const { title, body } = req.body || {};
    const cleanTitle = typeof title === "string" ? title.trim() : "";
    const cleanBody = typeof body === "string" ? body.trim() : "";
    const finalTitle = cleanTitle || "Vault-Renew Test";
    const finalBody = cleanBody || "This is a real FCM notification.";

    if (!finalTitle || !finalBody) {
      return res.status(400).json({ success: false, message: "title and body required" });
    }

    const devices = await NotificationDevice.find({ userId, enabled: true });
    if (!devices.length) {
      return res.status(404).json({ success: false, message: "No enabled devices", devicesAttempted: 0, devicesSucceeded: 0 });
    }

    let succeeded = 0;
    for (const dev of devices) {
      const result = await sendPushNotification({
        userId,
        installationId: dev.installationId,
        title: finalTitle,
        body: finalBody,
        data: { type: "dev_test", timestamp: String(Date.now()) },
      });
      if (result.success) succeeded++;
    }

    return res.json({
      success: succeeded > 0,
      message: succeeded > 0 ? "Test notification sent" : "Test notification failed",
      devicesAttempted: devices.length,
      devicesSucceeded: succeeded,
    });
  } catch (e) {
    console.error("dev test-notification:", e.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
