import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!authLoading && isAuthenticated) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email.trim() || !password) return setErr("Email and password are required.");
    setBusy(true);
    try {
      await login(email.trim(), password);
      nav(location.state?.from || "/dashboard", { replace: true });
    } catch (e2) {
      const msg = e2.response?.data?.message || e2.message || "Login failed";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#09090b] pt-[76px] transition-colors">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[960px] grid lg:grid-cols-2 gap-0 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          {/* Left Hero Panel */}
          <div className="bg-zinc-900 text-white p-8 sm:p-10 flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-full bg-white flex items-center justify-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-900" />
                </span>
                <span className="font-semibold tracking-tight text-white">Vault-Renew</span>
              </div>
              <h1 className="mt-8 text-3xl font-bold tracking-tight leading-tight">
                Welcome back to your vault.
              </h1>
              <p className="mt-2.5 text-sm leading-6 text-zinc-400">
                Sign in to manage recurring subscriptions, monitor upcoming renewals, and configure push notifications.
              </p>
              <ul className="mt-8 space-y-2.5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <span>Secure HS256 JWT tokens with automatic rotation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <span>Automated alerts at T-2 and T-1 days</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <span>Private and encrypted per-user data isolation</span>
                </li>
              </ul>
            </div>
            <div className="text-xs text-zinc-500 pt-6 border-t border-zinc-800">
              Don’t have an account yet?{" "}
              <Link to="/signup" className="text-white hover:underline font-medium">
                Create one
              </Link>
            </div>
          </div>

          {/* Right Form */}
          <div className="p-6 sm:p-10 flex flex-col justify-center">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Sign In
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Enter your verified email and password.
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
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
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Password
                  </label>
                  <Link
                    to="/verify-email"
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 underline"
                  >
                    Need email verification?
                  </Link>
                </div>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
                />
              </div>

              {err && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-400">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-sm mt-2"
              >
                {busy ? "Signing in…" : "Sign In to Vault"}
              </button>

              <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                New to Vault-Renew?{" "}
                <Link to="/signup" className="font-semibold text-zinc-900 dark:text-zinc-100 underline">
                  Create account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
