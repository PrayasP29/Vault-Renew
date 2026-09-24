import { useState } from "react";

// bundui/faq1 adapted — single-open accordion, minimal
const FAQS = [
  { q: "What is Vault-Renew?", a: "Vault-Renew keeps your subscriptions in one place and reminds you before they renew, so surprise charges don't sneak up on you." },
  { q: "What can I upload?", a: "You can upload subscription invoices and screenshots in JPEG, JPG, PNG, WEBP or PDF. Vault-Renew extracts the useful renewal details for you. Image extraction works today; PDF extraction is coming later." },
  { q: "How does Vault-Renew know when to remind me?", a: "Vault-Renew reads the renewal date from your uploaded document and schedules reminders 2 days and 1 day before that date." },
  { q: "Can I use it for multiple subscriptions?", a: "Yes. Each subscription is stored separately, so your streaming services, software plans and other recurring subscriptions can live in one place." },
  { q: "Will I receive notifications?", a: "Yes. Vault-Renew is built around real push notifications so renewal reminders can reach you without relying only on email. You control permission in your browser." },
  { q: "What happens to my uploaded document?", a: "Your uploaded document is associated with your account and processed to extract subscription information. It stays in your vault until you delete it." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="mx-auto max-w-[880px] px-4 sm:px-6 py-12 sm:py-16">
      <div className="text-center">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] tracking-widest text-white/60">FAQ</div>
        <h2 className="mt-3 text-[26px] sm:text-[32px] font-semibold tracking-tight text-white">Straight answers.</h2>
        <p className="mt-2 text-[14px] text-white/60">No corporate filler. Just how Vault-Renew actually works.</p>
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur divide-y divide-white/10 overflow-hidden">
        {FAQS.map((f, i) => (
          <div key={f.q} className="p-0">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-white/[0.04] transition">
              <span className="text-[14px] font-medium text-white">{f.q}</span>
              <span className={`h-6 w-6 rounded-full border grid place-items-center text-[11px] shrink-0 transition ${open === i ? "bg-white text-zinc-900 border-white" : "border-white/15 text-white/60"}`}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <div className="px-5 pb-4 text-[13px] leading-6 text-white/60 -mt-1">{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
