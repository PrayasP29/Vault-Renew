import mongoose from "mongoose";

const refreshTokenHistorySchema = new mongoose.Schema(
  {
    hash: { type: String, required: true },
    rotatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
    refreshTokenHistory: {
      type: [refreshTokenHistorySchema],
      default: [],
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
      trim: true,
    },
    uploadCount: {
      type: Number,
      default: 0,
    },
    uploadBytes: {
      type: Number,
      default: 0,
    },
    uploadUsageInitialized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
