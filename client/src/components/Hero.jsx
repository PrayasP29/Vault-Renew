import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] flex flex-col">
      <div className="relative flex-1 flex flex-col justify-center mx-auto w-full max-w-[1160px] px-4 sm:px-6 pt-[88px] pb-10 sm:pb-12">
        <div className="mx-auto max-w-[860px] text-center flex flex-col items-center">
          {/* Vault-Renew — centered, readable against tunnel */}
          <div className="flex justify-center items-center gap-3">
            <span className="h-8 w-8 rounded-full bg-white grid place-items-center shadow-lg">
              <span className="h-3 w-3 rounded-full bg-zinc-900" />
            </span>
            <span className="text-white font-semibold tracking-tight text-[15px]">Vault-Renew</span>
            <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-[10px] font-medium tracking-widest text-white/70">PRIVATE VAULT</span>
          </div>

          <h1 className="mt-6 font-[700] tracking-[-0.03em] leading-[0.95] text-white text-balance text-[32px] sm:text-[54px] lg:text-[64px]">
            Never miss a subscription renewal again.
          </h1>

          <p className="mx-auto mt-5 max-w-[640px] text-[15px] sm:text-[16px] leading-6 text-white/70 text-pretty">
            Upload your subscription invoice or screenshot, let Vault-Renew extract the important details, and get reminded before your subscription renews.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link to="/signup" className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-full bg-white text-zinc-900 px-7 py-3.5 text-[14px] font-semibold hover:bg-zinc-100 transition shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
              Get Started <span aria-hidden>→</span>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur text-white px-7 py-3.5 text-[14px] font-medium hover:bg-white/10 transition">
              See How It Works
            </a>
          </div>

          <div className="mt-5 flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] backdrop-blur px-3 py-1.5 text-[11px] font-medium tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Reminders 2 days & 1 day before renewal
            </span>
            <p className="text-[12px] text-white/45">No credit card · Email verification required · 10MB upload</p>
          </div>
        </div>
      </div>
    </section>
  );
}
