import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { registerForPushNotifications } from "../../services/notificationService.js";
import { formatDate } from "../../lib/subscriptions.js";

const permissionLabel = {
  granted: "Allowed in this browser",
  denied: "Blocked in this browser — enable it in site settings",
  default: "Not asked yet",
};

// permission is only ever requested from the explicit button below, never on page load
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
            ? "Permission denied — notifications stay off until you allow them in browser settings."
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
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight">Notifications</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Reminders are pushed by the server through FCM. Nothing is requested until you press enable.
      </p>

      <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        Browser permission: <span className="font-medium">{permissionLabel[permission] || permission}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={enable}
          disabled={busy}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Working…" : "Enable on this device"}
        </button>
        <button onClick={load} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          Refresh
        </button>
      </div>

      {message && <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">{message}</div>}
      {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading devices…</div>
        ) : devices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500">
            No devices registered — this account will not receive push reminders.
          </div>
        ) : (
          <ul className="space-y-2">
            {devices.map((d) => (
              <li key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium">
                    {d.platform} device ·{" "}
                    <span className={d.enabled ? "text-emerald-700" : "text-zinc-500"}>
                      {d.enabled ? "enabled" : "disabled"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    {d.deviceId || "unnamed"} · last seen {d.lastSeenAt ? formatDate(d.lastSeenAt) : "—"}
                  </div>
                </div>
                {d.enabled && (
                  <button
                    onClick={() => disable(d)}
                    disabled={busy}
                    className="self-start rounded-full border border-zinc-200 px-3 py-1.5 text-[11px] font-medium hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Disable
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
