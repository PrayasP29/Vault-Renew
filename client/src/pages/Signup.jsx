import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!name.trim() || !email.trim() || !password) return setErr("All fields are required.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      const data = await register(name.trim(), email.trim().toLowerCase(), password);
      setMsg(data.message || "Account created! Check your email to verify.");
      setTimeout(() => nav(`/verify-email?email=${encodeURIComponent(email.trim())}`), 900);
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#09090b] pt-[76px] transition-colors">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[960px] grid lg:grid-cols-2 gap-0 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Left panel */}
          <div className="bg-zinc-900 text-white p-8 sm:p-10 flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-full bg-white flex items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-900" />
                </span>
                <span className="font-semibold tracking-tight text-white">Vault-Renew</span>
              </div>
              <h1 className="mt-8 text-3xl font-bold tracking-tight leading-tight">
                Create your subscription vault.
              </h1>
              <p className="mt-2.5 text-sm leading-6 text-zinc-400">
                Track every renewal, drop surprises, and automate advance reminders for all your recurring plans.
              </p>
              <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-800/50 p-4">
                <div className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                  How Verification Works
                </div>
                <div className="mt-1.5 text-sm font-semibold">Verify email → Sign in → Upload</div>
                <div className="text-xs text-zinc-400 mt-1">
                  We dispatch a secure verification link to ensure ownership. No third-party trackers.
                </div>
              </div>
            </div>
            <div className="text-xs text-zinc-500 pt-6 border-t border-zinc-800">
              Already have an account?{" "}
              <Link to="/login" className="text-white hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>

          {/* Right form */}
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Create Account
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Direct credentials — private and isolated.
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-3.5">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Confirm Password
                </label>
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
                />
              </div>

              {err && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400">
                  {err}
                </div>
              )}

              {msg && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                  {msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-sm mt-2"
              >
                {loading ? "Creating Account…" : "Create Vault Account"}
              </button>

              <div className="pt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Already registered?{" "}
                <Link to="/login" className="font-semibold text-zinc-900 dark:text-zinc-100 underline">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
