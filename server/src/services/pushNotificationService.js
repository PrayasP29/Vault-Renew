import "../config/firebaseAdmin.js";
import { getMessaging } from "firebase-admin/messaging";
import mongoose from "mongoose";
import NotificationDevice from "../models/NotificationDevice.js";

const MAX_INSTALLATION_ID = 500;
const MAX_TITLE = 200;
const MAX_BODY = 1000;

// ponytail: single device lookup + send, no batch, no retry; queue if throughput needed
function isNonEmptyString(v, max) {
  if (typeof v !== "string") return false;
  const t = v.trim();
  if (t.length === 0) return false;
  if (max && t.length > max) return false;
  return true;
}

function normalizeData(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === null || v === undefined) continue;
    const key = String(k);
    // FCM data key restrictions are alphanumeric + underscore/hyphen, but keep as-is for now
    if (typeof v === "string") out[key] = v;
    else if (typeof v === "number" || typeof v === "boolean") out[key] = String(v);
    else if (v instanceof mongoose.Types.ObjectId) out[key] = String(v);
    else if (typeof v === "object") {
      // stringify plain objects? spec says numbers/booleans/ObjectId -> string, omit null/undef; keep others as string
      out[key] = String(v);
    } else {
      out[key] = String(v);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export async function sendPushNotification({ userId, installationId, title, body, data }) {
  // ---- validation ----
  const validUserId =
    (typeof userId === "string" && isNonEmptyString(userId, 100) && mongoose.Types.ObjectId.isValid(userId.trim())) ||
    (userId instanceof mongoose.Types.ObjectId);

  if (!validUserId || !isNonEmptyString(installationId, MAX_INSTALLATION_ID) || !isNonEmptyString(title, MAX_TITLE) || !isNonEmptyString(body, MAX_BODY)) {
    return { success: false, reason: "invalid-input" };
  }

  if (data !== undefined && data !== null && (typeof data !== "object" || Array.isArray(data))) {
    return { success: false, reason: "invalid-input" };
  }

  const uid = String(userId).trim();
  const fid = String(installationId).trim();
  const cleanTitle = String(title).trim();
  const cleanBody = String(body).trim();

  // ---- device lookup (enabled only) ----
  const device = await NotificationDevice.findOne({ userId: uid, installationId: fid, enabled: true });
  if (!device) {
    return { success: false, reason: "device-not-found" };
  }

  const normalizedData = normalizeData(data);

  const message = {
    notification: { title: cleanTitle, body: cleanBody },
    ...(normalizedData ? { data: normalizedData } : {}),
    fid,
  };

  // ponytail: test mock for Reminder scheduler tests — no Firebase network
  if (process.env.TEST_FCM_MOCK === "true" && fid.startsWith("test_success")) {
    return { success: true, messageId: `mocked_${Date.now()}`, installationId: fid };
  }
  if (process.env.TEST_FCM_MOCK === "true" && fid.startsWith("test_invalid")) {
    try {
      const existing = await NotificationDevice.findOne({ userId: uid, installationId: fid });
      if (existing) {
        existing.enabled = false;
        existing.lastSeenAt = new Date();
        await existing.save();
      }
    } catch {}
    return { success: false, reason: "device-invalid" };
  }

  try {
    const messageId = await getMessaging().send(message);
    return { success: true, messageId, installationId: fid };
  } catch (err) {
    const code = err?.code || err?.errorInfo?.code || "";
    // safe logging — never log fid or payload
    console.error("sendPushNotification:", code || err.message);

    // handle invalid/unregistered FID — disable device
    const invalidCodes = new Set([
      "messaging/installation-id-not-registered",
      "installation-id-not-registered",
      "messaging/invalid-registration-token",
      "invalid-registration-token",
      "messaging/registration-token-not-registered",
      "registration-token-not-registered",
    ]);

    // also treat invalid-argument/invalid-recipient that mentions installation as invalid device
    // but only when code is installation-specific to avoid disabling on payload errors
    const isInvalidDevice = invalidCodes.has(code) || code === "messaging/installation-id-not-registered";

    if (isInvalidDevice) {
      try {
        const existing = await NotificationDevice.findOne({ userId: uid, installationId: fid });
        if (existing) {
          existing.enabled = false;
          existing.lastSeenAt = new Date();
          await existing.save();
        }
      } catch {}
      return { success: false, reason: "device-invalid" };
    }

    // auth / permission / unavailable — do not disable, return controlled reason
    if (code.includes("authentication-error") || code.includes("mismatched-credential")) {
      return { success: false, reason: "firebase-auth-error" };
    }
    if (code.includes("permission")) {
      return { success: false, reason: "firebase-permission-error" };
    }
    if (code.includes("server-unavailable") || code.includes("unavailable") || code.includes("internal-error") || code.includes("unknown-error")) {
      return { success: false, reason: "firebase-unavailable" };
    }

    return { success: false, reason: "firebase-error" };
  }
}
