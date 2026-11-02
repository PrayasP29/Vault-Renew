import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import NotificationSettings from "../components/dashboard/NotificationSettings.jsx";

const field =
  "mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition";
const label = "text-xs font-medium text-zinc-700 dark:text-zinc-300";

function Row({ k, v }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-100 dark:border-zinc-800 py-3 last:border-0">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:w-[160px]">{k}</span>
      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 break-all">{v}</span>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const changePassword = async (e) => {
    e.preventDefault();
    setError("");
    setDone("");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords do not match.");
    if (next === current) return setError("New password must be different from the current one.");

    setBusy(true);
    try {
      const { data } = await api.post("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      setDone(data.message || "Password changed.");
      setCurrent("");
      setNext("");
      setConfirm("");
      await logout();
      navigate("/login", { replace: true, state: { changed: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Could not change password");
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your vault identity, credentials and notification devices.
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Vault Profile
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Identity information associated with this account.
        </p>
        <div className="mt-4">
          <Row k="Name" v={user?.name || "—"} />
          <Row k="Email Address" v={user?.email || "—"} />
          <Row k="Account ID" v={user?._id || user?.id || "—"} />
          <Row k="Timezone" v={user?.timezone || "Asia/Kolkata (Default)"} />
          <Row
            k="Verification Status"
            v={
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  user?.emailVerified
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                    : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    user?.emailVerified ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {user?.emailVerified ? "Verified" : "Unverified"}
              </span>
            }
          />
        </div>
      </div>

      {/* Security: Change Password */}
      <form
        onSubmit={changePassword}
        className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition"
      >
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Security & Password
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Changing your password invalidates all current refresh token sessions across all devices.
        </p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3.5">
          <div className="sm:col-span-2">
            <label className={label}>Current Password</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className={field}
            />
          </div>
          <div>
            <label className={label}>New Password</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              placeholder="Min 8 characters"
              className={field}
            />
          </div>
          <div>
            <label className={label}>Confirm New Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat new password"
              className={field}
            />
          </div>
        </div>

        {error && (
          <div className="mt-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3.5 py-2 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        {done && (
          <div className="mt-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 text-xs text-emerald-700 dark:text-emerald-400">
            {done}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="submit"
            disabled={busy || !current || !next || !confirm}
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition shadow-sm"
          >
            {busy ? "Updating Password…" : "Update Password"}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
          >
            Sign Out
          </button>
        </div>
      </form>

      {/* Notification Devices */}
      <NotificationSettings />
    </div>
  );
}
