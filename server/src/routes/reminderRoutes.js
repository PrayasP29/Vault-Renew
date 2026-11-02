import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getReminders, clearSentReminders } from "../controllers/reminderController.js";

const router = express.Router();

router.get("/", authMiddleware, getReminders);
router.delete("/sent", authMiddleware, clearSentReminders);

export default router;
