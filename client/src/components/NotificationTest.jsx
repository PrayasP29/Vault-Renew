import { useState, useEffect } from "react";
import { registerForPushNotifications, listenForForegroundMessages } from "../services/notificationService.js";

function maskFid(fid) {
  if (!fid || fid.length <= 8) return "Not displayed in full";
  return `${fid.slice(0, 4)}...${fid.slice(-4)}`;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function NotificationTest() {
  const [auth, setAuth] = useState(null); // { token, user }
  const [authLoading, setAuthLoading] = useState(false);
  const [permission, setPermission] = useState(() => (typeof Notification !== "undefined" ? Notification.permission : "default"));
  const [fcmStatus, setFcmStatus] = useState(null); // { success, installationId, reason }
  const [backendStatus, setBackendStatus] = useState(null); // { success, platform }
  const [fcmLoading, setFcmLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("Waiting...");
  const [foregroundMsg, setForegroundMsg] = useState(null);

  useEffect(() => {
    const unsub = listenForForegroundMessages((payload) => {
      setForegroundMsg(payload);
    });
    return () => {
      try { unsub && unsub(); } catch {}
    };
  }, []);

  async function handleTestLogin() {
    setAuthLoading(true);
    setStatus("Requesting test login...");
    try {
      const res = await fetch(`${API_BASE}/api/dev/test-login`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.accessToken) throw new Error(data.message || "test-login failed");
      setAuth({ token: data.accessToken, user: data.user });
      setStatus("Authenticated");
    } catch (e) {
      setStatus(`Login failed: ${e.message}`);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleEnable() {
    setFcmLoading(true);
    setStatus("Requesting notification permission...");
    try {
      const result = await registerForPushNotifications();
      setPermission(result.permission || (typeof Notification !== "undefined" ? Notification.permission : "default"));
      setFcmStatus(result);
      if (!result.success) {
        setStatus(`FCM failed: ${result.reason}`);
        return;
      }
      setStatus("FCM registered, registering with backend...");
      // register with backend
      if (!auth?.token) {
        setStatus("FCM registered but not authenticated — click Get Test Login first");
        return;
      }
      const res = await fetch(`${API_BASE}/api/notifications/devices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          installationId: result.installationId,
          platform: "web",
          deviceId: "vault-renew-fcm-test-browser",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "backend registration failed");
      setBackendStatus({ success: true, platform: data.device?.platform || "web" });
      setStatus("Backend device registered");
    } catch (e) {
      setBackendStatus({ success: false, reason: e.message });
      setStatus(`Error: ${e.message}`);
    } finally {
      setFcmLoading(false);
    }
  }

  async function handleSend() {
    if (!auth?.token) {
      setStatus("Not authenticated");
      return;
    }
    if (!fcmStatus?.success) {
      setStatus("Not registered for notifications");
      return;
    }
    setSending(true);
    setStatus("Sending...");
    try {
      const res = await fetch(`${API_BASE}/api/dev/test-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          title: "Vault-Renew Test",
          body: "This is a real FCM notification.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "send failed");
      setStatus(`✅ Notification request sent (attempted ${data.devicesAttempted}, succeeded ${data.devicesSucceeded})`);
    } catch (e) {
      setStatus(`Send failed: ${e.message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-6 p-6 border rounded-lg shadow-sm space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-bold">Vault-Renew FCM Test</h1>
        <p className="text-xs text-red-600 mt-1">DEVELOPMENT TEST ONLY</p>
      </div>

      <button
        onClick={handleTestLogin}
        disabled={authLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {authLoading ? "Logging in..." : "Get Test Login"}
      </button>

      <div className="text-sm bg-gray-50 p-3 rounded space-y-1">
        <p><span className="font-medium">Authentication:</span> {auth ? "✅ Authenticated" : "❌ Not authenticated"}</p>
        {auth && <p><span className="font-medium">Test user:</span> {auth.user?.name} ({auth.user?.email})</p>}
      </div>

      <button
        onClick={handleEnable}
        disabled={fcmLoading}
        className="w-full px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {fcmLoading ? "Registering..." : "Enable Notifications"}
      </button>

      <div className="text-sm bg-gray-50 p-3 rounded space-y-1">
        <p><span className="font-medium">Notification Permission:</span> {permission}</p>
        <p><span className="font-medium">FCM Registration:</span> {fcmStatus?.success ? "✅ Registered" : fcmStatus ? `❌ ${fcmStatus.reason}` : "Not registered"}</p>
        <p><span className="font-medium">FID:</span> {fcmStatus?.installationId ? maskFid(fcmStatus.installationId) : "Not displayed in full"}</p>
        <p><span className="font-medium">Backend Device:</span> {backendStatus?.success ? "✅ Registered" : backendStatus ? `❌ ${backendStatus.reason || "failed"}` : "Not registered"}</p>
        {backendStatus?.platform && <p><span className="font-medium">Platform:</span> {backendStatus.platform}</p>}
      </div>

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Test Notification"}
      </button>

      <div className="text-sm bg-gray-50 p-3 rounded">
        <p><span className="font-medium">Status:</span> {status}</p>
        {foregroundMsg && (
          <div className="mt-2 p-2 bg-yellow-50 rounded">
            <p className="font-medium">Foreground message received:</p>
            <p>{foregroundMsg.notification?.title || "No title"}</p>
            <p className="text-xs">{foregroundMsg.notification?.body || ""}</p>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>1. Get Test Login → 2. Enable Notifications (Allow) → 3. Keep tab open → 4. Open another tab → 5. Send Test Notification → 6. Check Windows notification</p>
        <p>Background handled by <code>firebase-messaging-sw.js</code>, foreground via <code>onMessage</code>.</p>
      </div>
    </div>
  );
}
