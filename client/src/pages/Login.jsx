import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!email || !password) return setErr("Email and password are required.");
    setLoading(true);
    try {
      await login(email.trim(), password);
      nav("/upload");
    } catch (e2) {
      const msg = e2.response?.data?.message || e2.message || "Login failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] pt-[72px]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[980px] grid lg:grid-cols-2 gap-6 rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          {/* left panel - pulseawan modern-login-signup left side, no OAuth */}
          <div className="bg-zinc-900 text-white p-8 sm:p-10 flex flex-col justify-between min-h-[520px]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-white grid place-items-center"><span className="h-2.5 w-2.5 rounded-full bg-zinc-900" /></span>
                <span className="font-semibold tracking-tight">Vault-Renew</span>
              </div>
              <h1 className="mt-8 text-[28px] font-semibold tracking-tight leading-tight">Welcome back.</h1>
              <p className="mt-2 text-sm leading-6 text-white/60">Sign in to your vault. Your subscriptions and reminders are waiting.</p>
              <ul className="mt-6 space-y-2 text-xs text-white/50">
                <li>• No social login — email only</li>
                <li>• Encrypted at rest, tied to your account</li>
                <li>• Reminders at T-2 and T-1</li>
              </ul>
            </div>
            <div className="text-xs text-white/40">Don’t have an account? <Link to="/signup" className="text-white underline">Create one</Link></div>
          </div>

          {/* form */}
          <div className="p-6 sm:p-8">
            <h2 className="text-[18px] font-semibold tracking-tight text-zinc-900">Login</h2>
            <p className="text-sm text-zinc-500 mt-1">Use your verified email.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@domain.com" className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
              </div>
              {err && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{err}</div>}
              <button disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <div className="text-center text-xs text-zinc-500">
                No account? <Link to="/signup" className="font-medium text-zinc-900 underline">Sign up</Link> · <Link to="/verify-email" className="underline">Verify email</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
