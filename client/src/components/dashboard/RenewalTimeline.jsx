import { formatDayMonth, formatMoney } from "../../lib/subscriptions.js";

// groups real renewal dates into month buckets, oldest first
const monthKey = (value) => {
  const d = new Date(value);
  return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
};

export default function RenewalTimeline({ subs }) {
  if (subs.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight">Renewal timeline</h2>
        <p className="mt-2 text-sm text-zinc-500">Your timeline fills in once you have active subscriptions.</p>
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

  // bar length is relative to the largest amount in view, not a hardcoded scale
  const max = Math.max(...subs.map((s) => s.amount), 1);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold tracking-tight">Renewal timeline</h2>
      <p className="mt-1 text-xs text-zinc-500">Next {subs.length} renewals, in date order</p>

      <div className="mt-4 space-y-5">
        {groups.map((g) => (
          <div key={g.key}>
            <div className="text-[11px] font-semibold tracking-widest text-zinc-400">{g.label}</div>
            <div className="mt-2 space-y-2">
              {g.items.map((s) => (
                <div key={s._id || s.id} className="flex items-center gap-3">
                  <div className="w-[52px] shrink-0 text-xs font-medium tabular-nums text-zinc-600">
                    {formatDayMonth(s.renewalDate)}
                  </div>
                    <div className="h-1.5 flex-1 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="h-full rounded-full bg-zinc-900" style={{ width: `${Math.max(6, (s.amount / max) * 100)}%` }} />
                    </div>
                  <div className="w-[120px] shrink-0 truncate text-right text-xs text-zinc-600">
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
