import { z } from "zod";
import mongoose from "mongoose";
import NotificationDevice from "../models/NotificationDevice.js";

const registerSchema = z
  .object({
    installationId: z.string().trim().min(1, "installationId is required").max(500),
    platform: z.enum(["web", "android", "ios"]),
    deviceId: z.string().trim().max(200).optional(),
  })
  .strict();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const zodError = (res, err) =>
  res.status(400).json({ success: false, message: err.issues[0].message, errors: err.issues });

const formatDevice = (d) => ({
  id: d._id,
  installationId: d.installationId,
  platform: d.platform,
  deviceId: d.deviceId,
  enabled: d.enabled,
  lastSeenAt: d.lastSeenAt,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

export const registerDevice = async (req, res) => {
  try {
    const { installationId, platform, deviceId } = registerSchema.parse(req.body);
    const userId = req.user.userId;

    let device = await NotificationDevice.findOne({ userId, installationId });

    if (device) {
      device.platform = platform;
      if (deviceId !== undefined) device.deviceId = deviceId;
      device.enabled = true;
      device.lastSeenAt = new Date();
      await device.save();
      return res.status(200).json({ success: true, message: "Notification device registered", device: formatDevice(device) });
    }

    try {
      device = await NotificationDevice.create({
        userId,
        installationId,
        platform,
        deviceId,
        enabled: true,
        lastSeenAt: new Date(),
      });
      return res.status(201).json({ success: true, message: "Notification device registered", device: formatDevice(device) });
    } catch (createErr) {
      // ponytail: race on unique index (userId+installationId) — treat as update, add retry if concurrency warrants
      if (createErr.code === 11000) {
        device = await NotificationDevice.findOne({ userId, installationId });
        if (device) {
          device.platform = platform;
          if (deviceId !== undefined) device.deviceId = deviceId;
          device.enabled = true;
          device.lastSeenAt = new Date();
          await device.save();
          return res.status(200).json({ success: true, message: "Notification device registered", device: formatDevice(device) });
        }
      }
      throw createErr;
    }
  } catch (err) {
    if (err instanceof z.ZodError) return zodError(res, err);
    console.error("registerDevice:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getDevices = async (req, res) => {
  try {
    const devices = await NotificationDevice.find({ userId: req.user.userId }).sort({ lastSeenAt: -1 });
    return res.status(200).json({ success: true, devices: devices.map(formatDevice) });
  } catch (err) {
    console.error("getDevices:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ success: false, message: "Invalid device ID" });

    const device = await NotificationDevice.findOne({ _id: id, userId: req.user.userId });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });

    device.enabled = false;
    device.lastSeenAt = new Date();
    await device.save();

    return res.status(200).json({ success: true, message: "Notification device disabled" });
  } catch (err) {
    console.error("deleteDevice:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
