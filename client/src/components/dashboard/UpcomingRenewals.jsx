import { Link } from "react-router-dom";
import { daysUntil, formatDayMonth, formatMoney } from "../../lib/subscriptions.js";

function Chip({ days }) {
  const tone =
    days <= 1
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : days <= 7
        ? "bg-zinc-100 text-zinc-700 border-zinc-200"
        : "bg-white text-zinc-500 border-zinc-200";
  const label = days === 0 ? "today" : days === 1 ? "tomorrow" : `${days} days`;
  return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${tone}`}>{label}</span>;
}

export default function UpcomingRenewals({ subs }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Upcoming renewals</h2>
        <Link to="/dashboard/subscriptions" className="text-xs text-zinc-500 hover:text-zinc-900">
          View all
        </Link>
      </div>

      {subs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
          <div className="text-sm font-medium text-zinc-700">Nothing renewing yet</div>
          <div className="mt-1 text-xs text-zinc-500">
            Upload an invoice and the renewal dates land here automatically.
          </div>
          <Link
            to="/upload"
            className="mt-4 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Upload an invoice
          </Link>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100">
          {subs.map((s) => {
            const days = daysUntil(s.renewalDate);
            return (
              <li key={s._id || s.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    Renews {formatDayMonth(s.renewalDate)} · {formatMoney(s.amount, s.currency)} · {s.billingCycle}
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
