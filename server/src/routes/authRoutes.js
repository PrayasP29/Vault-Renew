import express from "express";
import {
  register,
  verifyEmail,
  resendVerification,
  login,
  getMe,
  refresh,
  logout,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
