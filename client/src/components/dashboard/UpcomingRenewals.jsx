import { Link } from "react-router-dom";
import { daysUntil, formatDayMonth, formatMoney } from "../../lib/subscriptions.js";

function Chip({ days }) {
  const tone =
    days <= 1
      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
      : days <= 7
      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
      : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800";

  const label = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days}d`;

  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}>
      {label}
    </span>
  );
}

export default function UpcomingRenewals({ subs }) {
  return (
    <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-sm transition">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Upcoming Renewals
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Subscriptions requiring attention soon
          </p>
        </div>
        <Link
          to="/dashboard/subscriptions"
          className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
        >
          View all →
        </Link>
      </div>

      {subs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-6 text-center">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nothing renewing yet</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Upload an invoice and the renewal dates land here automatically.
          </div>
          <Link
            to="/upload"
            className="mt-4 inline-flex rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            Upload invoice
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {subs.map((s) => {
            const days = daysUntil(s.renewalDate);
            return (
              <li key={s._id || s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {s.name}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Renews {formatDayMonth(s.renewalDate)} · {formatMoney(s.amount, s.currency)} ·{" "}
                    <span className="capitalize">{s.billingCycle}</span>
                  </div>
                </div>
                <Chip days={days} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
