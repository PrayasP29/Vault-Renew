import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import extractionRoutes from "./routes/extractionRoutes.js";
import mongoose from "mongoose";
import notificationRoutes from "./routes/notificationRoutes.js";
import devRoutes from "./routes/devRoutes.js";
import { startReminderScheduler, stopReminderScheduler } from "./services/reminderScheduler.js";

dotenv.config();

// ponytail: dynamic import ensures env loaded before Admin init; static import would init before dotenv
await import("./config/firebaseAdmin.js");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Vault-Renew server is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/uploads", extractionRoutes);
app.use("/api/notifications/devices", notificationRoutes);
app.use("/api/dev", devRoutes);

const PORT = process.env.PORT || 5000;

await connectDB();

startReminderScheduler();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ponytail: lightweight graceful shutdown, no framework
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
  // force exit if not closed in 10s
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
