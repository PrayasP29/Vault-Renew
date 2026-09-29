import { formatMoney } from "../../lib/subscriptions.js";

function Card({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium tracking-widest text-zinc-400">{label}</div>
      <div className="mt-2 text-[22px] font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-zinc-400">{hint}</div>}
    </div>
  );
}

export default function SummaryCards({ summary, dueSoon, hasSubs }) {
  const money = (list, pick) =>
    list.length ? list.map((m) => formatMoney(pick(m), m.currency)).join(" + ") : "—";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        label="ACTIVE"
        value={summary.active}
        hint={summary.cancelled ? `${summary.cancelled} cancelled` : "All in good standing"}
      />

      <Card
        label="MONTHLY · ESTIMATED"
        value={money(summary.monthly, (m) => m.amount)}
        hint={
          summary.customCycles
            ? `Excludes ${summary.customCycles} custom cycle${summary.customCycles > 1 ? "s" : ""}`
            : "Monthly + quarterly/3 + yearly/12"
        }
      />

      <Card
        label="YEARLY · ESTIMATED"
        value={money(summary.monthly, (m) => m.yearly)}
        hint="Same basis, ×12"
      />

      <Card
        label="DUE IN 30 DAYS"
        value={dueSoon}
        hint={hasSubs ? "Reminders fire at T-2 and T-1" : "Upload an invoice to begin"}
      />
    </div>
  );
}
