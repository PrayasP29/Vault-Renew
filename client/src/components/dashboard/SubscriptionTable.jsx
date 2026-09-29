import { daysUntil, formatDate, formatMoney } from "../../lib/subscriptions.js";

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-500"
      }`}
    >
      {status}
    </span>
  );
}

// rows reflow into cards on mobile, so there is no wide table to scroll sideways
export default function SubscriptionTable({ subs, onEdit, onDelete, onToggleStatus, busyId }) {
  if (subs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
        <div className="text-sm font-medium text-zinc-700">No subscriptions yet</div>
        <div className="mt-1 text-xs text-zinc-500">Upload an invoice or add one manually to get started.</div>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {subs.map((s) => {
        const id = s._id || s.id;
        const days = daysUntil(s.renewalDate);
        const busy = busyId === id;
        return (
          <li key={id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold tracking-tight">{s.name}</span>
                  <StatusPill status={s.status} />
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {formatMoney(s.amount, s.currency)} / {s.billingCycle}
                  {s.category ? ` · ${s.category}` : ""}
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  Renews {formatDate(s.renewalDate)}
                  {s.status === "active" && (
                    <span className={days <= 1 ? "text-amber-700" : days < 0 ? "text-zinc-400" : "text-zinc-600"}>
                      {" "}
                      · {days < 0 ? `${Math.abs(days)} days ago` : days === 0 ? "today" : `in ${days} days`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  onClick={() => onEdit(s)}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => onToggleStatus(s)}
                  disabled={busy}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50"
                >
                  {s.status === "active" ? "Cancel" : "Reactivate"}
                </button>
                <button
                  onClick={() => onDelete(s)}
                  disabled={busy}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
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
