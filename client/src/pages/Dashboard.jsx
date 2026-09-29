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
    () => subs.filter((s) => s.status === "active" && daysUntil(s.renewalDate) >= 0 && daysUntil(s.renewalDate) <= 30).length,
    [subs]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Welcome back, {user?.name?.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {summary.active} active subscription{summary.active === 1 ? "" : "s"} · next renewal in{" "}
            {upcoming.length ? `${daysUntil(upcoming[0].renewalDate)} days` : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/upload" className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            Upload invoice
          </Link>
          <button onClick={reload} className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          <button onClick={reload} className="underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          Loading your vault…
        </div>
      ) : (
        <>
          <SummaryCards summary={summary} dueSoon={dueSoon} hasSubs={subs.length > 0} />

          <div className="grid lg:grid-cols-2 gap-4">
            <UpcomingRenewals subs={upcoming} />
            <RenewalTimeline subs={upcomingRenewals(subs, 8)} />
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-xs text-zinc-500 shadow-sm">
            Reminders are scheduled by the server at T-2 and T-1 for every active subscription — see{" "}
            <Link to="/dashboard/reminders" className="text-zinc-900 underline">
              reminder status
            </Link>
            .
          </div>
        </>
      )}
    </div>
  );
}
