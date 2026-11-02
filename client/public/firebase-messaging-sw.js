/* eslint-disable no-undef */
// ponytail: public compat SW, not bundled by Vite — upgrade to modular SW if build tooling added
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBeRbKdYc2Ou8Q57t7286KU46o3CqyCaVM",
  authDomain: "vault-renew.firebaseapp.com",
  projectId: "vault-renew",
  storageBucket: "vault-renew.firebasestorage.app",
  messagingSenderId: "275890573623",
  appId: "1:275890573623:web:03ccab22240fb39f580ab2",
  measurementId: "G-S3GNRVC28M",
});

const messaging = firebase.messaging();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "Vault-Renew";
  const options = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/favicon.svg",
    data: payload.data || {},
    tag: payload.data?.messageId || undefined,
  };
  return self.registration.getNotifications({ tag: options.tag }).then((existing) => {
    if (existing.length === 0) return self.registration.showNotification(title, options);
    return undefined;
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const target = new URL("/dashboard/reminders", self.location.origin).href;
      const existing = clients.find((client) => "focus" in client);
      if (existing) {
        return existing.focus().then(() => existing.navigate?.(target));
      }
      return self.clients.openWindow(target);
    })
  );
});
