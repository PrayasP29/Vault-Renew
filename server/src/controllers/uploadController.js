import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Upload from "../models/Upload.js";
import {
  reserveUploadQuota,
  releaseUploadQuota,
  UploadQuotaError,
} from "../services/uploadQuota.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const sanitize = (doc) => ({
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

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required" });
    }

    try {
      await reserveUploadQuota(req.user.userId, req.file.size);
    } catch (quotaErr) {
      if (req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      if (quotaErr instanceof UploadQuotaError) {
        return res.status(400).json({
          success: false,
          code: quotaErr.code,
          message: quotaErr.message,
        });
      }
      throw quotaErr;
    }

    const doc = await Upload.create({
      userId: req.user.userId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      status: "uploaded",
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      upload: sanitize(doc),
    });
  } catch (err) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error("uploadFile:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUploads = async (req, res) => {
  try {
    const uploads = await Upload.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, uploads: uploads.map(sanitize) });
  } catch (err) {
    console.error("getUploads:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUpload = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid upload ID" });
    const doc = await Upload.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!doc) return res.status(404).json({ success: false, message: "Upload not found" });
    return res.status(200).json({ success: true, upload: sanitize(doc) });
  } catch (err) {
    console.error("getUpload:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const downloadFile = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid upload ID" });
    const doc = await Upload.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!doc) return res.status(404).json({ success: false, message: "Upload not found" });
    const abs = path.resolve(doc.path);
    if (!fs.existsSync(abs)) return res.status(404).json({ success: false, message: "File not found" });
    return res.sendFile(abs);
  } catch (err) {
    console.error("downloadFile:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteUpload = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid upload ID" });
    const doc = await Upload.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!doc) return res.status(404).json({ success: false, message: "Upload not found" });

    const abs = path.resolve(doc.path);
    try {
      await fs.promises.unlink(abs);
    } catch (e) {
      if (e.code !== "ENOENT") console.warn("Failed to delete file on disk:", e.message);
    }

    await Upload.deleteOne({ _id: doc._id });
    await releaseUploadQuota(doc.userId, doc.size);

    return res.status(200).json({ success: true, message: "Upload deleted" });
  } catch (err) {
    console.error("deleteUpload:", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
