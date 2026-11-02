import fs from "node:fs";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Reminder from "../src/models/Reminder.js";
import {
  analyzeReminderCycleKeys,
  migrateReminderCycleKeys,
} from "../src/services/reminderService.js";

dotenv.config();

const apply = process.argv.includes("--apply");
const backupArgIndex = process.argv.indexOf("--backup-file");
const backupPath = backupArgIndex >= 0 ? process.argv[backupArgIndex + 1] : "";

if (apply && (!backupPath || !fs.existsSync(backupPath))) {
  throw new Error("Refusing --apply without an existing backup path from mongodump");
}

await mongoose.connect(process.env.MONGO_URI);
try {
  if (!apply) {
    const analysis = await analyzeReminderCycleKeys();
    console.log(JSON.stringify({ mode: "dry-run", ...analysis }, null, 2));
  } else {
    const result = await migrateReminderCycleKeys();
    console.log(JSON.stringify({ mode: "apply", ...result }, null, 2));
  }
} finally {
  await mongoose.disconnect();
}
