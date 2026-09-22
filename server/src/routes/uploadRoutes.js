import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/uploadMiddleware.js";
import { uploadFile, getUploads, getUpload, downloadFile, deleteUpload } from "../controllers/uploadController.js";

const router = express.Router();

router.post("/", authMiddleware, uploadSingle, uploadFile);
router.get("/", authMiddleware, getUploads);
router.get("/:id/download", authMiddleware, downloadFile);
router.get("/:id", authMiddleware, getUpload);
router.delete("/:id", authMiddleware, deleteUpload);

export default router;
