import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimes = new Set(["image/jpeg", "image/png", "image/webp"]);
const mimeToExt = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const extToMime = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = mimeToExt[file.mimetype] || path.extname(file.originalname).slice(1).toLowerCase() || "bin";
    cb(null, `${crypto.randomUUID()}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimes.has(file.mimetype)) {
    return cb(new Error("Unsupported file type. Only JPEG, PNG and WEBP images are allowed"), false);
  }
  const ext = path.extname(file.originalname).slice(1).toLowerCase();
  if (ext && extToMime[ext] && extToMime[ext] !== file.mimetype) {
    if (!(ext === "jpg" && file.mimetype === "image/jpeg") && !(ext === "jpeg" && file.mimetype === "image/jpeg")) {
      return cb(new Error("Unsupported file type. Only JPEG, PNG and WEBP images are allowed"), false);
    }
  }
  if (ext && !extToMime[ext]) {
    return cb(new Error("Unsupported file type. Only JPEG, PNG and WEBP images are allowed"), false);
  }
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
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Max 10MB allowed" });
      }
      return res.status(400).json({ success: false, message: err.message || "File upload failed" });
    }
    next();
  });
};

export default upload;
