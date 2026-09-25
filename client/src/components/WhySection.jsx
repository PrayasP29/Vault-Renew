import Reveal from "./Reveal.jsx";

export default function WhySection() {
  const items = [
    { title: "One vault for everything", desc: "Streaming, software, memberships — each subscription lives separately so nothing gets buried in email." },
    { title: "Extraction, not typing", desc: "Upload the invoice and Vault-Renew pulls the name, amount, renewal date and cycle for you." },
    { title: "Reminders that actually arrive", desc: "Real push notifications 2 days and 1 day before renewal — not a newsletter you ignore." },
    { title: "Your docs stay yours", desc: "Each upload is tied to your account and used only to create your subscription record." },
    { title: "No fake urgency", desc: "No dark patterns, no fake counts. Just a clean list of what renews next." },
    { title: "Built for later", desc: "Dashboard, search and renewal calendar coming next — your vault grows with you." },
  ];
  return (
    <section className="mx-auto max-w-[1160px] px-4 sm:px-6 py-12 sm:py-16">
      <Reveal className="mx-auto max-w-[720px] text-center">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-widest text-white/60">WHY VAULT-RENEW</div>
        <h2 className="mt-3 text-[26px] sm:text-[32px] font-semibold tracking-tight text-white">Quietly keeps you ahead of the charge.</h2>
        <p className="mt-2 text-[14px] leading-6 text-white/60">Most renewal tools feel like spreadsheets. Vault-Renew feels like a vault — calm, organized, and there when you need it.</p>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {items.map((x, i) => (
          <Reveal key={x.title} delay={i * 110}>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-5">
              <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[11px] text-white/70">◆</div>
              <div className="mt-3 text-[14px] font-semibold text-white">{x.title}</div>
              <div className="mt-1 text-[13px] leading-5 text-white/60">{x.desc}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
