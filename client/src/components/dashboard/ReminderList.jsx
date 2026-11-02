import { formatDate } from "../../lib/subscriptions.js";

const TYPE_CONFIG = {
  renewal_2_day: {
    label: "T-2 Days",
    pill: "border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400",
  },
  renewal_1_day: {
    label: "T-1 Day",
    pill: "border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
  },
};

const STATUS_CONFIG = {
  sent: {
    label: "Sent",
    dot: "bg-emerald-500",
    style: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
  },
  pending: {
    label: "Pending",
    dot: "bg-sky-500",
    style: "border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400",
  },
  processing: {
    label: "Processing",
    dot: "bg-amber-500 animate-ping",
    style: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  },
  failed: {
    label: "Failed",
    dot: "bg-red-500",
    style: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  },
};

const subName = (r) =>
  (r.subscription && (r.subscription.name || r.subscription.title)) ||
  r.subscriptionName ||
  "Subscription";

export default function ReminderList({ reminders, loading, error }) {
  if (loading) {
    return (
      <div className="mt-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center text-sm text-zinc-500 dark:text-zinc-400 shadow-sm animate-pulse">
        Loading reminder queue…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="mt-4 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-8 text-center transition">
        <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No reminders scheduled</div>
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          T-2 and T-1 reminders are automatically generated whenever a subscription is saved.
        </div>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-3">
      {reminders.map((r) => {
        const typeCfg = TYPE_CONFIG[r.type] || {
          label: r.type,
          pill: "border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
        };
        const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;

        return (
          <li
            key={r._id}
            className="rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 sm:p-5 shadow-sm transition hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {subName(r)}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium tracking-wide ${typeCfg.pill}`}
                  >
                    {typeCfg.label}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    Scheduled for{" "}
                    <strong className="text-zinc-700 dark:text-zinc-300 font-medium">
                      {formatDate(r.scheduledFor)}
                    </strong>
                  </span>
                  {r.sentAt && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Delivered on {formatDate(r.sentAt)}
                      </span>
                    </>
                  )}
                  {r.attempts > 0 && (
                    <>
                      <span>·</span>
                      <span>
                        {r.attempts} attempt{r.attempts === 1 ? "" : "s"}
                      </span>
                    </>
                  )}
                </div>

                {r.failureReason && (
                  <div className="mt-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-2.5 py-1 text-xs text-red-600 dark:text-red-400">
                    Reason: {r.failureReason}
                  </div>
                )}
              </div>

              <div className="shrink-0 self-start sm:self-center">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${statusCfg.style}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
