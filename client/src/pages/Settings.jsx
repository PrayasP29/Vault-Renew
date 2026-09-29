import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import NotificationSettings from "../components/dashboard/NotificationSettings.jsx";

const field = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900";
const label = "text-xs font-medium text-zinc-700";

function Row({ k, v }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 border-b border-zinc-100 py-2.5 last:border-0">
      <span className="text-xs text-zinc-500 sm:w-[140px]">{k}</span>
      <span className="text-sm font-medium break-all">{v}</span>
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
      // server revokes the refresh token on change, so this session is finished
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
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Profile, security and notification devices</p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight">Profile</h2>
        <p className="mt-1 text-xs text-zinc-500">Identity comes from your verified account — not editable here.</p>
        <div className="mt-3">
          <Row k="Name" v={user?.name || "—"} />
          <Row k="Email" v={user?.email || "—"} />
          {/* userId straight from /auth/me — the frontend never supplies it */}
          <Row k="User ID" v={user?._id || user?.id || "—"} />
          <Row
            k="Email status"
            v={
              <span className={user?.emailVerified ? "text-emerald-700" : "text-amber-700"}>
                {user?.emailVerified ? "verified" : "not verified"}
              </span>
            }
          />
        </div>
      </div>

      <form onSubmit={changePassword} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight">Security</h2>
        <p className="mt-1 text-xs text-zinc-500">Changing your password signs you out of every session.</p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={label}>Current password</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={field} />
          </div>
          <div>
            <label className={label}>New password</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={field} />
          </div>
          <div>
            <label className={label}>Confirm new password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={field} />
          </div>
        </div>

        {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {done && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{done}</div>}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy || !current || !next || !confirm}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            {busy ? "Updating…" : "Change password"}
          </button>
          <button type="button" onClick={signOut} className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50">
            Logout
          </button>
        </div>
      </form>

      <NotificationSettings />
    </div>
  );
}
