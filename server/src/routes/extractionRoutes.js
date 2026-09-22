import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { extractSubscription } from "../controllers/extractionController.js";

const router = express.Router();

router.post("/:id/extract", authMiddleware, extractSubscription);

export default router;
