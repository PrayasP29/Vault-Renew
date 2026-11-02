import { daysUntil, formatDate, formatMoney } from "../../lib/subscriptions.js";

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${
        active
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
          : "border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-zinc-400"}`}
      />
      {status}
    </span>
  );
}

export default function SubscriptionTable({ subs, onEdit, onDelete, onToggleStatus, busyId }) {
  if (subs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-8 text-center transition">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No subscriptions yet</div>
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Upload an invoice or add one manually to get started.
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {subs.map((s) => {
        const id = s._id || s.id;
        const days = daysUntil(s.renewalDate);
        const busy = busyId === id;
        return (
          <li
            key={id}
            className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 sm:p-5 shadow-sm transition hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {s.name}
                  </span>
                  <StatusPill status={s.status} />
                  {s.category && (
                    <span className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {s.category}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                    {formatMoney(s.amount, s.currency)}
                  </span>
                  <span>/</span>
                  <span className="capitalize">{s.billingCycle}</span>
                  <span>·</span>
                  <span>
                    Renews <strong className="text-zinc-700 dark:text-zinc-300 font-medium">{formatDate(s.renewalDate)}</strong>
                  </span>
                  {s.status === "active" && (
                    <span
                      className={
                        days <= 1
                          ? "text-amber-600 dark:text-amber-400 font-medium"
                          : days < 0
                          ? "text-zinc-400"
                          : "text-zinc-600 dark:text-zinc-300"
                      }
                    >
                      ({days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "today" : `in ${days} days`})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center flex-wrap gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => onEdit(s)}
                  className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => onToggleStatus(s)}
                  disabled={busy}
                  className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition"
                >
                  {s.status === "active" ? "Cancel Plan" : "Reactivate"}
                </button>
                <button
                  onClick={() => onDelete(s)}
                  disabled={busy}
                  className="rounded-full border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
