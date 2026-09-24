import { messaging } from "../config/firebase.js";
import { register, onRegistered, onMessage } from "firebase/messaging";

/**
 * Register for FCM push via FID-based flow.
 * Call explicitly from UI — does not auto-request on import.
 * @returns {Promise<{success:boolean, installationId?:string, permission?:string, reason?:string}>}
 */
export async function registerForPushNotifications() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { success: false, reason: "unsupported" };
  }
  if (!("serviceWorker" in navigator)) {
    return { success: false, reason: "unsupported-sw" };
  }

  let permission;
  try {
    permission = await Notification.requestPermission();
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
        serviceWorkerRegistration,
      }).catch((err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { unsub(); } catch { /* ignore */ }
        reject(err);
      });
    });

    return { success: true, installationId, permission: "granted" };
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
