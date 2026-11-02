import mongoose from "mongoose";
import User from "../models/User.js";
import Upload from "../models/Upload.js";

export const MAX_UPLOADS_PER_USER = 30;

const configuredStorage = Number(process.env.MAX_UPLOAD_STORAGE_BYTES);
export const MAX_STORAGE_BYTES =
  Number.isFinite(configuredStorage) && configuredStorage > 0
    ? configuredStorage
    : 100 * 1024 * 1024;

export class UploadQuotaError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "UploadQuotaError";
    this.code = code;
  }
}

function userIdFilter(userId) {
  return new mongoose.Types.ObjectId(String(userId));
}

// Counters can be missing on users created before this feature. Seed them from
// the Upload collection once, atomically, so two first-time uploads agree.
export async function ensureUploadUsageInitialized(userId) {
  const user = await User.findById(userId).select("uploadUsageInitialized");
  if (!user || user.uploadUsageInitialized) return;

  const [usage] = await Upload.aggregate([
    { $match: { userId: userIdFilter(userId) } },
    { $group: { _id: null, count: { $sum: 1 }, bytes: { $sum: "$size" } } },
  ]);

  await User.updateOne(
    { _id: userId, uploadUsageInitialized: { $ne: true } },
    {
      $set: {
        uploadCount: usage?.count || 0,
        uploadBytes: usage?.bytes || 0,
        uploadUsageInitialized: true,
      },
    }
  );
}

// Atomic reservation. The filter is the quota check, so simultaneous uploads
// cannot both observe "29 files" and both insert.
export async function reserveUploadQuota(userId, size) {
  await ensureUploadUsageInitialized(userId);

  const reserved = await User.findOneAndUpdate(
    {
      _id: userId,
      uploadCount: { $lt: MAX_UPLOADS_PER_USER },
      uploadBytes: { $lte: MAX_STORAGE_BYTES - size },
    },
    { $inc: { uploadCount: 1, uploadBytes: size } },
    { new: true }
  );

  if (reserved) return;

  const current = await User.findById(userId).select("uploadCount uploadBytes");
  if (!current) {
    throw new UploadQuotaError("USER_NOT_FOUND", "User not found");
  }
  if ((current.uploadCount || 0) >= MAX_UPLOADS_PER_USER) {
    throw new UploadQuotaError(
      "UPLOAD_COUNT_LIMIT",
      `Upload limit reached. You can store up to ${MAX_UPLOADS_PER_USER} files. Delete an upload to free a slot.`
    );
  }
  throw new UploadQuotaError(
    "UPLOAD_STORAGE_LIMIT",
    `Storage limit reached. Your uploads can use up to ${Math.round(
      MAX_STORAGE_BYTES / (1024 * 1024)
    )}MB in total.`
  );
}

// Guarded decrement: a duplicate delete cannot push counters negative. If the
// guard fails the counters have already drifted, so reconcile just this user.
export async function releaseUploadQuota(userId, size) {
  const released = await User.updateOne(
    {
      _id: userId,
      uploadCount: { $gt: 0 },
      uploadBytes: { $gte: size },
    },
    { $inc: { uploadCount: -1, uploadBytes: -size } }
  );

  if (released.modifiedCount === 0) {
    await reconcileUploadUsage({ userId });
  }
}

// Recompute counters from the Upload collection. Safe to run at startup because
// it writes only derived quota fields, never user data.
export async function reconcileUploadUsage({ userId } = {}) {
  const match = userId ? { userId: userIdFilter(userId) } : {};
  const rows = await Upload.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$userId",
        count: { $sum: 1 },
        bytes: { $sum: "$size" },
      },
    },
  ]);

  const ops = rows.map((row) => ({
    updateOne: {
      filter: { _id: row._id },
      update: {
        $set: {
          uploadCount: row.count,
          uploadBytes: row.bytes,
          uploadUsageInitialized: true,
        },
      },
    },
  }));

  if (userId && ops.length === 0) {
    ops.push({
      updateOne: {
        filter: { _id: userIdFilter(userId) },
        update: {
          $set: { uploadCount: 0, uploadBytes: 0, uploadUsageInitialized: true },
        },
      },
    });
  }

  if (ops.length) await User.bulkWrite(ops, { ordered: false });

  if (!userId) {
    // Users with no uploads at all are absent from the aggregation above.
    await User.updateMany(
      { _id: { $nin: rows.map((r) => r._id) } },
      { $set: { uploadCount: 0, uploadBytes: 0, uploadUsageInitialized: true } }
    );
  }
}
