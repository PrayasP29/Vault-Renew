import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { registerDevice, getDevices, deleteDevice } from "../controllers/notificationController.js";

const router = express.Router();

router.post("/", authMiddleware, registerDevice);
router.get("/", authMiddleware, getDevices);
router.delete("/:id", authMiddleware, deleteDevice);

export default router;
