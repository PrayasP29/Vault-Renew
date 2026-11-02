import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import User from "../models/User.js";
import { sendVerificationEmail } from "../services/emailService.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { hashRefreshToken } from "../utils/tokenHash.js";

const hashToken = (raw) =>
  crypto.createHash("sha256").update(raw).digest("hex");

const GRACE_WINDOW_MS = 30 * 1000;

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(50),
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  timezone: z.string().trim().max(100).optional(),
});

const resendSchema = z.object({
  email: z.string().trim().email("Invalid email"),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const register = async (req, res) => {
  try {
    const { name, email, password, timezone } = registerSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.emailVerified) {
        return res
          .status(409)
          .json({ success: false, message: "Email already registered" });
      }
      // unverified: refresh token and resend
      const rawToken = crypto.randomBytes(32).toString("hex");
      existing.emailVerificationToken = hashToken(rawToken);
      existing.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
      existing.name = name;
      if (timezone) existing.timezone = timezone;
      await existing.save();

      try {
        await sendVerificationEmail(existing.email, rawToken);
      } catch (err) {
        console.error("Resend email error (unverified re-register):", err.message);
        return res.status(500).json({
          success: false,
          message:
            "Account already exists but verification email could not be sent. Please use resend-verification.",
        });
      }
      return res.status(200).json({
        success: true,
        message:
          "Account already exists. Verification email resent. Please verify your email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = hashToken(rawToken);

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      emailVerificationToken: hashed,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
      timezone: timezone || "Asia/Kolkata",
    });

    await user.save();

    try {
      await sendVerificationEmail(user.email, rawToken);
    } catch (err) {
      console.error("Email send error:", err.message);
      return res.status(500).json({
        success: false,
        message:
          "Registration successful but verification email could not be sent. Please use resend-verification to get a new link.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
        errors: error.issues,
      });
    }
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });
    }
    console.error("Register error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const rawToken = req.query.token;
    if (!rawToken || typeof rawToken !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Verification token is required" });
    }

    const hashed = hashToken(rawToken);

    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification link is invalid or has expired",
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = resendSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const genericResponse = {
      success: true,
      message:
        "If an unverified account exists for this email, a verification email has been sent.",
    };

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.emailVerified) {
      return res.status(200).json(genericResponse);
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires.getTime() > Date.now() + 14 * 60 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait a minute before requesting another verification email",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, rawToken);
    } catch (err) {
      console.error("Resend email error:", err.message);
      return res.status(500).json({
        success: false,
        message: "Could not send verification email. Please try again later.",
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: error.issues[0].message,
      });
    }
    console.error("Resend verification error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in" });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = hashRefreshToken(refreshToken);
    user.refreshTokenHistory = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0].message });
    }
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "-password -emailVerificationToken -emailVerificationExpires -refreshToken -refreshTokenHistory -__v"
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Me error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const refresh = async (req, res) => {
  try {
    const token =
      req.body?.refreshToken ||
      req.body?.refresh_token ||
      (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if (!token) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Refresh token expired" });
      }
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const tokenHash = hashRefreshToken(token);
    const newRefreshToken = generateRefreshToken(decoded.userId);
    const newHashed = hashRefreshToken(newRefreshToken);

    // Atomic rotation attempt: replace active refreshToken with newHashed and push tokenHash to history
    const user = await User.findOneAndUpdate(
      { _id: decoded.userId, refreshToken: tokenHash },
      {
        $set: { refreshToken: newHashed },
        $push: {
          refreshTokenHistory: {
            $each: [{ hash: tokenHash, rotatedAt: new Date() }],
            $slice: -20,
          },
        },
      },
      { new: true }
    );

    if (user) {
      const accessToken = generateAccessToken(user._id);
      return res.status(200).json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
      });
    }

    // Winner was not this caller. Check if token was rotated inside or outside grace window.
    const existing = await User.findById(decoded.userId);
    if (!existing) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const historyEntry = existing.refreshTokenHistory?.find((h) => h.hash === tokenHash);
    if (historyEntry) {
      const age = Date.now() - new Date(historyEntry.rotatedAt).getTime();
      if (age <= GRACE_WINDOW_MS) {
        return res.status(401).json({
          success: false,
          message: "Refresh token already used. Please wait for the current session.",
        });
      }
      // Replay after grace window: reuse detected -> revoke active session
      await User.updateOne({ _id: decoded.userId }, { $unset: { refreshToken: 1 } });
      return res.status(401).json({
        success: false,
        message: "Refresh token reuse detected. Session revoked.",
      });
    }

    return res.status(401).json({ success: false, message: "Invalid or revoked refresh token" });
  } catch (error) {
    console.error("Refresh error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.refreshToken = undefined;
    user.refreshTokenHistory = [];
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed. Please log in again." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0].message, errors: error.issues });
    }
    console.error("ChangePassword error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const token =
      req.body?.refreshToken ||
      req.body?.refresh_token ||
      (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

    if (!token) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const tokenHash = hashRefreshToken(token);
    await User.updateOne(
      { _id: decoded.userId, refreshToken: tokenHash },
      { $unset: { refreshToken: 1 } }
    );

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
