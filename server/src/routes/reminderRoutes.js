import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getReminders } from "../controllers/reminderController.js";

const router = express.Router();

router.get("/", authMiddleware, getReminders);

export default router;
