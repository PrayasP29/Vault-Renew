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
    if (!resendEmail.trim()) return setResendStatus("Email is required");
    setResendStatus("Sending…");
    try {
      const { data } = await api.post("/auth/resend-verification", { email: resendEmail.trim() });
      setResendStatus(data.message || "If an account exists, an email was sent.");
    } catch (e2) {
      setResendStatus(e2.response?.data?.message || "Could not resend");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] pt-[72px]">
      <div className="mx-auto max-w-[640px] px-4 sm:px-6 py-12">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className="text-[20px] font-semibold tracking-tight">Verify your email</h1>
          <p className="text-sm text-zinc-500 mt-1">Vault-Renew requires email verification before login.</p>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            {status === "verifying" && <div className="text-sm">Verifying…</div>}
            {status === "success" && <div className="text-sm text-emerald-700 font-medium">✓ {msg} — you can now <Link to="/login" className="underline">log in</Link>.</div>}
            {status === "error" && <div className="text-sm text-red-700">✗ {msg}</div>}
            {status === "idle" && <div className="text-sm text-zinc-600">No token in URL. Check your email for the verification link, or resend below.</div>}
          </div>

          <form onSubmit={resend} className="mt-6 space-y-3">
            <div className="text-xs font-medium text-zinc-700">Resend verification email</div>
            <div className="flex gap-2">
              <input value={resendEmail} onChange={(e) => setResendEmail(e.target.value)} placeholder="you@domain.com" type="email" className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
              <button className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-zinc-800">Resend</button>
            </div>
            {resendStatus && <div className="text-xs text-zinc-600">{resendStatus}</div>}
          </form>

          <div className="mt-6 flex gap-2 text-xs">
            <Link to="/login" className="rounded-full border border-zinc-200 px-4 py-2">Go to login</Link>
            <Link to="/signup" className="rounded-full bg-zinc-900 text-white px-4 py-2">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
