import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Upload from "../models/Upload.js";
import Subscription from "../models/Subscription.js";
import { extractSubscriptionFromFile } from "../services/documentExtractionService.js";
import { createRemindersForSubscription } from "../services/reminderService.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitizeUpload = (doc) => ({
  id: doc._id,
  _id: doc._id,
  originalName: doc.originalName,
  storedName: doc.storedName,
  mimeType: doc.mimeType,
  size: doc.size,
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const extractSubscription = async (req, res) => {
  const uploadId = req.params.id;

  if (!isValidId(uploadId)) {
    return res.status(400).json({ success: false, message: "Invalid upload ID" });
  }

  let upload;
  try {
    upload = await Upload.findOne({ _id: uploadId, userId: req.user.userId });
    if (!upload) {
      return res.status(404).json({ success: false, message: "Upload not found" });
    }

    if (upload.status === "processing") {
      return res.status(409).json({ success: false, message: "Extraction already in progress" });
    }
    if (upload.status === "processed") {
      return res.status(409).json({ success: false, message: "Extraction already completed", upload: sanitizeUpload(upload) });
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(upload.mimeType)) {
      return res.status(400).json({ success: false, message: "Unsupported file type. Only JPEG, PNG and WEBP images are supported for extraction" });
    }

    const abs = path.resolve(upload.path);
    if (!fs.existsSync(abs)) {
      upload.status = "failed";
      await upload.save();
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Atomic lease: move to processing status
    const processingDoc = await Upload.findOneAndUpdate(
      { _id: upload._id, userId: req.user.userId, status: { $in: ["uploaded", "failed"] } },
      { $set: { status: "processing" } },
      { new: true }
    );
    if (!processingDoc) {
      const fresh = await Upload.findOne({ _id: upload._id, userId: req.user.userId });
      if (fresh?.status === "processing") return res.status(409).json({ success: false, message: "Extraction already in progress" });
      if (fresh?.status === "processed") return res.status(409).json({ success: false, message: "Extraction already completed", upload: sanitizeUpload(fresh) });
      return res.status(409).json({ success: false, message: "Upload not available for extraction" });
    }
    upload = processingDoc;
    console.log(`[extraction] started upload=${upload._id} user=${req.user.userId}`);

    let extracted;
    try {
      extracted = await extractSubscriptionFromFile(abs, upload.mimeType);
    } catch (extErr) {
      try {
        upload.status = "failed";
        await upload.save();
      } catch {}
      console.log(`[extraction] failed upload=${upload._id} reason=${extErr.message}`);

      if (extErr.statusCode === 422) {
        return res.status(422).json({ success: false, message: extErr.message || "Document could not be reliably extracted", upload: sanitizeUpload(upload) });
      }
      if (extErr.statusCode === 400) {
        return res.status(400).json({ success: false, message: extErr.message, upload: sanitizeUpload(upload) });
      }
      if (extErr.isProviderError || extErr.name === "AbortError") {
        return res.status(500).json({ success: false, message: "AI provider failure", upload: sanitizeUpload(upload) });
      }
      const isValidation = extErr.message && /Invalid|ambiguous|required|Amount|Name/i.test(extErr.message);
      if (isValidation) {
        return res.status(422).json({ success: false, message: extErr.message, upload: sanitizeUpload(upload) });
      }
      return res.status(500).json({ success: false, message: "Extraction failed", upload: sanitizeUpload(upload) });
    }

    // Check duplicate active subscription
    const existingSub = await Subscription.findOne({
      userId: req.user.userId,
      name: new RegExp(`^${extracted.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      status: "active",
    });

    if (existingSub) {
      upload.status = "processed";
      await upload.save();
      return res.status(200).json({
        success: true,
        message: "Subscription already exists in vault",
        subscription: existingSub,
        isExisting: true,
        upload: sanitizeUpload(upload),
      });
    }

    let subscription;
    try {
      subscription = await Subscription.create({
        userId: req.user.userId,
        name: extracted.name,
        amount: extracted.amount,
        currency: extracted.currency || "INR",
        renewalDate: extracted.renewalDate,
        billingCycle: extracted.billingCycle,
        category: extracted.category || "General",
        status: "active",
      });
      await createRemindersForSubscription(subscription);
    } catch (dbErr) {
      console.log(`[extraction] failed upload=${upload._id} reason=subscription create failed: ${dbErr.message}`);
      try {
        upload.status = "failed";
        await upload.save();
      } catch {}
      return res.status(500).json({ success: false, message: "Failed to create subscription", upload: sanitizeUpload(upload) });
    }

    upload.status = "processed";
    await upload.save();
    console.log(`[extraction] succeeded upload=${upload._id} subscription=${subscription._id}`);

    return res.status(200).json({
      success: true,
      message: "Subscription extracted successfully",
      subscription,
      upload: sanitizeUpload(upload),
    });
  } catch (err) {
    console.error("extractSubscription:", err.message);
    try {
      if (upload && upload.status === "processing") {
        upload.status = "failed";
        await upload.save();
      }
    } catch {}
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
