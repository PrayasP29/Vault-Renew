import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const mimeToExt = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};
const extToMime = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = mimeToExt[file.mimetype] || path.extname(file.originalname).slice(1).toLowerCase() || "bin";
    cb(null, `${crypto.randomUUID()}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimes.has(file.mimetype)) return cb(new Error("Unsupported file type"), false);
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  // ponytail: strict mime+ext check, upgrade to magic-byte sniffing if spoofing matters
  if (ext && extToMime[ext] && extToMime[ext] !== file.mimetype) {
    // allow jpg/jpeg both mapping to image/jpeg
    if (!(ext === "jpg" && file.mimetype === "image/jpeg") && !(ext === "jpeg" && file.mimetype === "image/jpeg")) {
      return cb(new Error("Unsupported file type"), false);
    }
  }
  if (ext && !extToMime[ext]) return cb(new Error("Unsupported file type"), false);
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

export const uploadSingle = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, message: "File too large. Max 10MB allowed" });
      if (err.message === "Unsupported file type") return res.status(400).json({ success: false, message: "Unsupported file type" });
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

export default upload;
