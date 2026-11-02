import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const emailParam = params.get("email");
  const [status, setStatus] = useState(token ? "verifying" : "idle");
  const [msg, setMsg] = useState("");
  const [resendEmail, setResendEmail] = useState(emailParam || "");
  const [resendStatus, setResendStatus] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setStatus("success");
        setMsg(data.message || "Email verified successfully");
      } catch (e) {
        setStatus("error");
        setMsg(e.response?.data?.message || "Verification link is invalid or has expired");
      }
    })();
  }, [token]);

  const resend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return setResendStatus("Email address is required");
    setResendStatus("Sending verification link…");
    try {
      const { data } = await api.post("/auth/resend-verification", { email: resendEmail.trim() });
      setResendStatus(data.message || "If an account exists, a verification email has been sent.");
    } catch (e2) {
      setResendStatus(e2.response?.data?.message || "Could not send verification email.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-[#09090b] pt-[76px] transition-colors">
      <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-12">
        <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5">
            <span className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
              ✓
            </span>
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Vault-Renew
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-4">
            Verify Your Email
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Accounts require email verification before authentication is granted.
          </p>

          <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/50 p-4">
            {status === "verifying" && (
              <div className="text-sm text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>Verifying your activation token…</span>
              </div>
            )}
            {status === "success" && (
              <div className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                ✓ {msg} — you can now{" "}
                <Link to="/login" className="underline font-bold">
                  sign in to your vault
                </Link>
                .
              </div>
            )}
            {status === "error" && (
              <div className="text-sm text-red-700 dark:text-red-400">
                ✗ {msg}
              </div>
            )}
            {status === "idle" && (
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                No token detected in URL. Please check your inbox for the link, or request a new one below.
              </div>
            )}
          </div>

          <form onSubmit={resend} className="mt-6 space-y-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Resend verification email
            </div>
            <div className="flex gap-2">
              <input
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@domain.com"
                type="email"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition"
              />
              <button
                type="submit"
                className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-xs sm:text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shrink-0"
              >
                Resend Link
              </button>
            </div>
            {resendStatus && (
              <div className="text-xs text-zinc-600 dark:text-zinc-400 pt-1">
                {resendStatus}
              </div>
            )}
          </form>

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <Link
              to="/login"
              className="rounded-full border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              Go to sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              Create new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
