import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSubscription,
  getSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/", authMiddleware, createSubscription);
router.get("/", authMiddleware, getSubscriptions);
router.get("/:id", authMiddleware, getSubscription);
router.put("/:id", authMiddleware, updateSubscription);
router.delete("/:id", authMiddleware, deleteSubscription);

export default router;
