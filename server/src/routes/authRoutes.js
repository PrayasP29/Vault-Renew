import express from "express";
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  refresh,
  logout,
  changePassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  registerLimiter,
  verifyLimiter,
  resendLimiter,
  loginLimiter,
  loginIpLimiter,
  refreshLimiter,
} from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", registerLimiter, register);
router.get("/verify-email", verifyLimiter, verifyEmail);
router.post("/resend-verification", resendLimiter, resendVerification);
router.post("/login", loginIpLimiter, loginLimiter, login);
router.get("/me", authMiddleware, getMe);
router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);
router.post("/change-password", authMiddleware, changePassword);

export default router;
