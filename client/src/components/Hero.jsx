import { Link } from "react-router-dom";
import Reveal from "./Reveal.jsx";

export default function Hero() {
  return (
    <section className="relative isolate min-h-[86svh] flex flex-col">
      <div className="relative flex-1 flex flex-col justify-center mx-auto w-full max-w-[1160px] px-4 sm:px-6 pt-[88px] pb-10 sm:pb-12">
        <div className="mx-auto max-w-[860px] text-center flex flex-col items-center">
          {/* app mark — name itself is the h1 below */}
          <Reveal repeat>
            <div className="flex justify-center items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] backdrop-blur-md px-4 py-1.5">
              <span className="h-9 w-9 rounded-full bg-white grid place-items-center shadow-lg">
                <span className="h-3.5 w-3.5 rounded-full bg-zinc-900" />
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-[10px] font-medium tracking-widest text-white/70">PRIVATE VAULT</span>
            </div>
          </Reveal>

          <Reveal repeat delay={110}>
            <h1 className="mt-8 font-bold italic tracking-[-0.04em] leading-[0.95] text-white text-[52px] sm:text-[80px] lg:text-[104px]">
              Vault-Renew
            </h1>
          </Reveal>

          <Reveal repeat delay={220}>
            <p className="mx-auto mt-4 max-w-[640px] text-[18px] sm:text-[22px] lg:text-[26px] leading-tight font-medium tracking-tight text-white/70 text-pretty">
              Never miss a subscription renewal again.
            </p>
          </Reveal>

          <Reveal repeat delay={330} className="w-full sm:w-auto">
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <Link to="/signup" className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-full bg-white/[0.12] backdrop-blur-md border border-white/25 text-white px-7 py-3.5 text-[14px] font-semibold hover:bg-white/[0.18] hover:shadow-[0_0_28px_rgba(255,255,255,0.22)] transition">
                Get Started <span aria-hidden>→</span>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto inline-flex justify-center items-center rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md text-white px-7 py-3.5 text-[14px] font-medium hover:bg-white/10 hover:border-white/25 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)] transition">
                See How It Works
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
