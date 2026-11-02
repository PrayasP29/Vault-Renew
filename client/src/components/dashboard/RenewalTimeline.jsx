import { formatDayMonth, formatMoney } from "../../lib/subscriptions.js";

// groups real renewal dates into month buckets, oldest first
const monthKey = (value) => {
  const d = new Date(value);
  return {
    key: `${d.getFullYear()}-${d.getMonth()}`,
    label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
  };
};

export default function RenewalTimeline({ subs }) {
  if (subs.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Renewal Timeline
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Your timeline fills in once you have active subscriptions.
        </p>
      </div>
    );
  }

  const groups = [];
  for (const s of subs) {
    const { key, label } = monthKey(s.renewalDate);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(s);
    else groups.push({ key, label, items: [s] });
  }

  const max = Math.max(...subs.map((s) => s.amount), 1);

  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Renewal Timeline
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Next {subs.length} renewal{subs.length === 1 ? "" : "s"} in chronological order
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.key} className="space-y-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
              {g.label}
            </div>
            <div className="space-y-2.5">
              {g.items.map((s) => (
                <div key={s._id || s.id} className="flex items-center gap-3">
                  <div className="w-[52px] shrink-0 text-xs font-medium tabular-nums text-zinc-600 dark:text-zinc-400">
                    {formatDayMonth(s.renewalDate)}
                  </div>
                  <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-zinc-200 transition-all duration-300"
                      style={{ width: `${Math.max(6, (s.amount / max) * 100)}%` }}
                    />
                  </div>
                  <div className="w-[130px] shrink-0 truncate text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {s.name} · {formatMoney(s.amount, s.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
