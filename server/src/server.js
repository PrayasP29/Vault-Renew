import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import extractionRoutes from "./routes/extractionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import devRoutes from "./routes/devRoutes.js";
import { startReminderScheduler, stopReminderScheduler } from "./services/reminderScheduler.js";
import { ensureReminderIndexes } from "./services/reminderService.js";
import { reconcileUploadUsage } from "./services/uploadQuota.js";

await import("./config/firebaseAdmin.js");

const app = express();

app.set("trust proxy", 1);
const configuredOrigins = (process.env.FRONTEND_URLS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  ...configuredOrigins,
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim().replace(/\/+$/, "")] : []),
]);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  credentials: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Vault-Renew server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/uploads", extractionRoutes);
app.use("/api/notifications/devices", notificationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/dev", devRoutes);

app.use((err, req, res, next) => {
  if (err?.message === "Origin not allowed by CORS") {
    return res.status(403).json({ success: false, message: "Origin not allowed" });
  }
  console.error("[server] Unhandled error:", err?.message || err);
  return res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

await connectDB();

try {
  await ensureReminderIndexes();
  await reconcileUploadUsage();
} catch (startupErr) {
  console.warn("[server] Startup reconciliation note:", startupErr.message);
}

startReminderScheduler();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const shutdown = async (signal) => {
  console.log(`[shutdown] ${signal}`);
  stopReminderScheduler();
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log("[shutdown] MongoDB closed");
    } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
