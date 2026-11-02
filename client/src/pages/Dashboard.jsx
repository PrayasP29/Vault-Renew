import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import useSubscriptions from "../hooks/useSubscriptions.js";
import { daysUntil, summarize, upcomingRenewals } from "../lib/subscriptions.js";
import SummaryCards from "../components/dashboard/SummaryCards.jsx";
import UpcomingRenewals from "../components/dashboard/UpcomingRenewals.jsx";
import RenewalTimeline from "../components/dashboard/RenewalTimeline.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const { subs, loading, error, reload } = useSubscriptions();

  const summary = useMemo(() => summarize(subs), [subs]);
  const upcoming = useMemo(() => upcomingRenewals(subs, 6), [subs]);
  const dueSoon = useMemo(
    () =>
      subs.filter(
        (s) =>
          s.status === "active" &&
          daysUntil(s.renewalDate) >= 0 &&
          daysUntil(s.renewalDate) <= 30
      ).length,
    [subs]
  );

  return (
    <div className="space-y-6">
      {/* Page Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {summary.active} active plan{summary.active === 1 ? "" : "s"} · next renewal in{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {upcoming.length ? `${daysUntil(upcoming[0].renewalDate)} days` : "—"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/upload"
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-sm"
          >
            Upload invoice
          </Link>
          <button
            onClick={reload}
            className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={reload} className="underline font-medium hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-sm text-zinc-500 dark:text-zinc-400 shadow-sm animate-pulse">
          Loading your subscription vault…
        </div>
      ) : (
        <>
          <SummaryCards summary={summary} dueSoon={dueSoon} hasSubs={subs.length > 0} />

          <div className="grid lg:grid-cols-2 gap-5 sm:gap-6">
            <UpcomingRenewals subs={upcoming} />
            <RenewalTimeline subs={upcomingRenewals(subs, 8)} />
          </div>

          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 sm:p-5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between gap-3 shadow-sm">
            <span>
              Automatic notifications are scheduled by the engine at T-2 and T-1 days before renewal.
            </span>
            <Link
              to="/dashboard/reminders"
              className="font-medium text-zinc-900 dark:text-zinc-200 hover:underline shrink-0"
            >
              View reminder queue →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
