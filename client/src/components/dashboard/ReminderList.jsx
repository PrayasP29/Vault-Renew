import { formatDate } from "../../lib/subscriptions.js";

const TYPE_LABEL = { renewal_2_day: "T-2 days", renewal_1_day: "T-1 day" };

const STATUS_STYLE = {
  sent: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-zinc-200 bg-zinc-100 text-zinc-600",
  processing: "border-sky-200 bg-sky-50 text-sky-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

const subName = (r) => (r.subscription && (r.subscription.name || r.subscription.title)) || r.subscriptionName || "Subscription";

export default function ReminderList({ reminders, loading, error }) {
  if (loading) return <div className="mt-4 text-sm text-zinc-500">Loading reminders…</div>;
  if (error) return <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  if (reminders.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
        <div className="text-sm font-medium text-zinc-700">No reminders scheduled</div>
        <div className="mt-1 text-xs text-zinc-500">
          T-2 and T-1 reminders are created by the server whenever a subscription is added.
        </div>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {reminders.map((r) => (
        <li key={r._id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{subName(r)}</span>
                <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-mono tracking-widest text-zinc-500">
                  {TYPE_LABEL[r.type] || r.type}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Scheduled {formatDate(r.scheduledFor)}
                {r.sentAt ? ` · sent ${formatDate(r.sentAt)}` : ""}
                {r.attempts > 0 ? ` · ${r.attempts} attempt(s)` : ""}
              </div>
              {r.failureReason && <div className="mt-1 text-xs text-red-600">{r.failureReason}</div>}
            </div>
            <span className={`shrink-0 self-start rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLE[r.status] || STATUS_STYLE.pending}`}>
              {r.status}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
