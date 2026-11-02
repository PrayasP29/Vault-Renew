import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { registerForPushNotifications } from "../../services/notificationService.js";
import { formatDate } from "../../lib/subscriptions.js";

const permissionLabel = {
  granted: "Allowed in this browser",
  denied: "Blocked in this browser — enable it in site settings",
  default: "Not asked yet",
};

export default function NotificationSettings() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [permission, setPermission] = useState(
    () => (typeof Notification !== "undefined" ? Notification.permission : "unsupported")
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications/devices");
      setDevices(data.devices || []);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Could not load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const enable = async () => {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const result = await registerForPushNotifications();
      setPermission(result.permission || (typeof Notification !== "undefined" ? Notification.permission : "default"));
      if (!result.success) {
        setMessage(
          result.reason === "permission-denied"
            ? "Permission denied — notifications stay off until allowed in browser settings."
            : `Could not register this device (${result.reason}).`
        );
        return;
      }
      const { data } = await api.post("/notifications/devices", {
        installationId: result.installationId,
        platform: "web",
        deviceId: "vault-renew-web",
      });
      setMessage(data?.device?.enabled ? "This device is registered for reminders." : "Registered.");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const disable = async (device) => {
    setBusy(true);
    setMessage("");
    try {
      await api.delete(`/notifications/devices/${device.id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Could not disable device");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Notification Devices
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Push notifications are dispatched through Firebase Cloud Messaging (FCM).
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-zinc-50/70 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
        <span>Browser Permission:</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {permissionLabel[permission] || permission}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          onClick={enable}
          disabled={busy}
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-sm"
        >
          {busy ? "Registering…" : "Enable Push on This Device"}
        </button>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
        >
          {loading ? "Refreshing…" : "Refresh Devices"}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 px-3.5 py-2 text-xs text-zinc-700 dark:text-zinc-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3.5 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="text-center py-6 text-xs text-zinc-500 dark:text-zinc-400 animate-pulse">
            Loading registered devices…
          </div>
        ) : devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No notification devices registered yet. Click &ldquo;Enable Push on This Device&rdquo; to receive alerts.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {devices.map((d) => (
              <li
                key={d.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-3.5 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                      {d.platform} client
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        d.enabled
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                          : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {d.enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Device: {d.deviceId || "unnamed"} · Last seen {d.lastSeenAt ? formatDate(d.lastSeenAt) : "—"}
                  </div>
                </div>
                {d.enabled && (
                  <button
                    onClick={() => disable(d)}
                    disabled={busy}
                    className="self-start sm:self-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition"
                  >
                    Disable Device
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
