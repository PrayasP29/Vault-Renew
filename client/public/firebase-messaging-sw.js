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

// Handle background messages — show notification from FCM payload
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Vault-Renew";
  const options = {
    body: payload.notification?.body || "",
    icon: "/favicon.svg",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});
