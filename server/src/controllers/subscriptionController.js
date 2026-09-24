import { z } from "zod";
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import { createRemindersForSubscription, syncRemindersForSubscription, deleteRemindersForSubscription } from "../services/reminderService.js";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().trim().min(1).max(10).optional().default("INR"),
  renewalDate: z.coerce.date({ invalid_type_error: "Invalid renewalDate" }),
  billingCycle: z.enum(["monthly", "quarterly", "yearly", "custom"]),
  category: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(["active", "cancelled"]).optional().default("active"),
}).strict();

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  amount: z.number().positive("Amount must be greater than 0").optional(),
  currency: z.string().trim().min(1).max(10).optional(),
  renewalDate: z.coerce.date({ invalid_type_error: "Invalid renewalDate" }).optional(),
  billingCycle: z.enum(["monthly", "quarterly", "yearly", "custom"]).optional(),
  category: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(500).optional(),
  status: z.enum(["active", "cancelled"]).optional(),
}).strict();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const zodError = (res, err) =>
  res.status(400).json({ success: false, message: err.issues[0].message, errors: err.issues });

export const createSubscription = async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const sub = await Subscription.create({ ...data, userId: req.user.userId });
    try {
      await createRemindersForSubscription(sub);
    } catch (e) {
      console.error("createReminders:", e.message);
    }
    return res.status(201).json({ success: true, subscription: sub });
  } catch (err) {
    if (err instanceof z.ZodError) return zodError(res, err);
    console.error("createSubscription:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user.userId }).sort({ renewalDate: 1 });
    return res.status(200).json({ success: true, subscriptions: subs });
  } catch (err) {
    console.error("getSubscriptions:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getSubscription = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    const sub = await Subscription.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
    return res.status(200).json({ success: true, subscription: sub });
  } catch (err) {
    console.error("getSubscription:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    const data = updateSchema.parse(req.body);
    if (Object.keys(data).length === 0) return res.status(400).json({ success: false, message: "No fields to update" });
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
    if (data.renewalDate !== undefined || data.status !== undefined) {
      try {
        if (data.status === "cancelled") {
          // scheduler will ignore, but clean up past pending to avoid spam on re-activate
        }
        await syncRemindersForSubscription(sub);
      } catch (e) {
        console.error("syncReminders:", e.message);
      }
    }
    return res.status(200).json({ success: true, subscription: sub });
  } catch (err) {
    if (err instanceof z.ZodError) return zodError(res, err);
    console.error("updateSubscription:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteSubscription = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid subscription ID" });
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
    try {
      await deleteRemindersForSubscription(sub._id);
    } catch (e) {
      console.error("deleteReminders:", e.message);
    }
    return res.status(200).json({ success: true, message: "Subscription deleted" });
  } catch (err) {
    console.error("deleteSubscription:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
