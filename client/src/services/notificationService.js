import { messaging } from "../config/firebase.js";
import { register, onRegistered, onMessage } from "firebase/messaging";

const seenMessageIds = new Set();
const MAX_SEEN_MESSAGE_IDS = 100;

function messageId(payload) {
  return payload?.messageId || payload?.fcmMessageId || payload?.data?.messageId || null;
}

function rememberMessage(payload) {
  const id = messageId(payload);
  if (!id) return true;
  if (seenMessageIds.has(id)) return false;
  seenMessageIds.add(id);
  if (seenMessageIds.size > MAX_SEEN_MESSAGE_IDS) {
    seenMessageIds.delete(seenMessageIds.values().next().value);
  }
  return true;
}

export function getNotificationPayload(payload) {
  const notification = payload?.notification || {};
  const data = payload?.data || {};
  return {
    title: notification.title || data.title || "Vault-Renew",
    body: notification.body || data.body || "",
    data,
  };
}

/**
 * Register for FCM push via FID-based flow.
 * Call explicitly from UI — does not auto-request on import.
 * @returns {Promise<{success:boolean, installationId?:string, permission?:string, reason?:string}>}
 */
export async function registerForPushNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { success: false, reason: "unsupported" };
  }
  if (!messaging) {
    return { success: false, reason: "unsupported-fcm" };
  }
  if (!("serviceWorker" in navigator)) {
    return { success: false, reason: "unsupported-sw" };
  }

  if (!import.meta.env.VITE_FIREBASE_VAPID_KEY?.trim()) {
    return { success: false, reason: "missing-vapid-key" };
  }

  let permission;
  try {
    permission = Notification.permission === "granted"
      ? "granted"
      : await Notification.requestPermission();
  } catch {
    return { success: false, reason: "permission-error" };
  }

  if (permission !== "granted") {
    return { success: false, reason: "permission-denied", permission };
  }

  try {
    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    const activeRegistration = await navigator.serviceWorker.ready;
    if (!activeRegistration.active) {
      return { success: false, reason: "service-worker-inactive", permission };
    }

    // ponytail: 10s timeout for FID — increase if slow networks show false failures
    const installationId = await new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { unsub(); } catch { /* ignore */ }
          reject(new Error("fid-timeout"));
        }
      }, 10000);

      const unsub = onRegistered(messaging, (fid) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { unsub(); } catch { /* ignore */ }
        resolve(fid);
      });

      register(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: activeRegistration || serviceWorkerRegistration,
      }).catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { unsub(); } catch { /* ignore */ }
        reject(err);
      });
    });

    if (typeof installationId !== "string" || !installationId.trim()) {
      return { success: false, reason: "invalid-installation-id", permission };
    }
    return {
      success: true,
      installationId: installationId.trim(),
      permission: "granted",
      serviceWorkerScope: activeRegistration.scope,
    };
  } catch (err) {
    return {
      success: false,
      reason: err?.message || "registration-failed",
      permission: "granted",
    };
  }
}

export function listenForForegroundMessages(callback) {
  if (typeof window === "undefined" || !messaging) return () => {};
  try {
    return onMessage(messaging, callback);
  } catch {
    return () => {};
  }
}

export function installForegroundNotifications({ onMessageReceived } = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { unsubscribe: () => {}, reason: "unsupported" };
  }
  if (!("serviceWorker" in navigator)) {
    return { unsubscribe: () => {}, reason: "unsupported-sw" };
  }
  if (!messaging) {
    return { unsubscribe: () => {}, reason: "unsupported-fcm" };
  }
  if (Notification.permission !== "granted") {
    return { unsubscribe: () => {}, reason: "permission-denied" };
  }

  let active = true;
  const unsubscribe = listenForForegroundMessages(async (payload) => {
    if (!active) return;
    if (!rememberMessage(payload)) return;
    onMessageReceived?.(payload);
    const { title, body, data } = getNotificationPayload(payload);
    if (Notification.permission !== "granted") return;
    try {
      const registration = await navigator.serviceWorker.ready;
      if (!registration.active) return;
      await registration.showNotification(title, { body, icon: "/favicon.svg", data });
    } catch (error) {
      console.warn("[notifications] foreground display unavailable:", error?.message || "unknown error");
    }
  });

  return {
    unsubscribe: () => {
      active = false;
      unsubscribe();
    },
  };
}
