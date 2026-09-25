import Reveal from "./Reveal.jsx";

export default function HowItWorks() {
  const steps = [
    { n: "01", t: "Upload your invoice", d: "Drop a PNG, JPG, WEBP or PDF (up to 10MB). No cropping required — a screenshot works." },
    { n: "02", t: "Vault extracts the details", d: "Name, amount, renewal date and billing cycle are pulled automatically. You review before saving." },
    { n: "03", t: "Get reminded on time", d: "We schedule real push reminders 2 days and 1 day before renewal. You stay in control." },
  ];
  return (
    <section id="how-it-works" className="text-white">
      <Reveal repeat className="mx-auto max-w-[1160px] px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-widest text-white/60">HOW IT WORKS</div>
            <h2 className="mt-3 text-[26px] sm:text-[32px] font-semibold tracking-tight">Three steps. No surprises.</h2>
          </div>
          <p className="max-w-[420px] text-[14px] leading-6 text-white/60">Upload → Extract → Remind. The whole flow is built around your real documents, not a demo.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 130}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-6">
                <div className="text-[11px] font-mono tracking-widest text-white/40">{s.n}</div>
                <div className="mt-2 text-[16px] font-semibold">{s.t}</div>
                <div className="mt-1.5 text-[13px] leading-5 text-white/60">{s.d}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-[12px] text-white/50">
          <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> PDF extraction coming soon — images work today</span>
          <span className="hidden sm:inline opacity-30">·</span>
          <span>10MB limit · Private to your account</span>
        </div>
      </Reveal>
    </section>
  );
}
