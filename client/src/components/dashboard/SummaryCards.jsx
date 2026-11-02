import { formatMoney } from "../../lib/subscriptions.js";

function Card({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 sm:p-5 shadow-sm transition">
      <div className="text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
        {label}
      </div>
      <div className="mt-2 text-[22px] sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {hint}
        </div>
      )}
    </div>
  );
}

export default function SummaryCards({ summary, dueSoon, hasSubs }) {
  const money = (list, pick) =>
    list.length ? list.map((m) => formatMoney(pick(m), m.currency)).join(" + ") : "—";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card
        label="Active Plans"
        value={summary.active}
        hint={summary.cancelled ? `${summary.cancelled} cancelled in vault` : "All plans active"}
      />

      <Card
        label="Monthly Est."
        value={money(summary.monthly, (m) => m.amount)}
        hint={
          summary.customCycles
            ? `Excludes ${summary.customCycles} custom cycle`
            : "Monthly + quarterly/3 + yearly/12"
        }
      />

      <Card
        label="Yearly Est."
        value={money(summary.monthly, (m) => m.yearly)}
        hint="Projected annual expenditure"
      />

      <Card
        label="Due in 30 Days"
        value={dueSoon}
        hint={hasSubs ? "Reminders fire at T-2 and T-1" : "Upload an invoice to begin"}
      />
    </div>
  );
}
