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
    setErr(""); setMsg("");
    if (!name.trim() || !email.trim() || !password) return setErr("All fields are required.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      const data = await register(name.trim(), email.trim().toLowerCase(), password);
      setMsg(data.message || "Check your email to verify your account.");
      setTimeout(() => nav(`/verify-email?email=${encodeURIComponent(email.trim())}`), 900);
    } catch (e2) {
      setErr(e2.response?.data?.message || e2.message || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] pt-[72px]">
      <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-[980px] grid lg:grid-cols-2 gap-6 rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-zinc-900 text-white p-8 sm:p-10 flex flex-col justify-between min-h-[540px]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-white grid place-items-center"><span className="h-2.5 w-2.5 rounded-full bg-zinc-900" /></span>
                <span className="font-semibold tracking-tight">Vault-Renew</span>
              </div>
              <h1 className="mt-8 text-[28px] font-semibold tracking-tight leading-tight">Create your vault.</h1>
              <p className="mt-2 text-sm leading-6 text-white/60">One place for every renewal. Upload, extract, and never miss a charge.</p>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-mono tracking-widest text-white/40">WHAT HAPPENS NEXT</div>
                <div className="mt-2 text-sm font-medium">Verify email → Login → Upload</div>
                <div className="text-xs text-white/50 mt-1">We send a 15-minute verification link. No OAuth, no tracking.</div>
              </div>
            </div>
            <div className="text-xs text-white/40">Already have an account? <Link to="/login" className="text-white underline">Log in</Link></div>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-[18px] font-semibold tracking-tight text-zinc-900">Sign up</h2>
            <p className="text-sm text-zinc-500 mt-1">Email-based only — no Google or GitHub.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Carter" className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@domain.com" className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="At least 8 characters" className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-700">Confirm Password</label>
                <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Repeat password" className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-900" />
              </div>
              {err && <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{err}</div>}
              {msg && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800">{msg}</div>}
              <button disabled={loading} className="w-full rounded-full bg-zinc-900 text-white py-3 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50">
                {loading ? "Creating…" : "Create account"}
              </button>
              <div className="text-center text-xs text-zinc-500">Already verified? <Link to="/login" className="font-medium text-zinc-900 underline">Sign in</Link></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
