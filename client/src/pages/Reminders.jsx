import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";
import ReminderList from "../components/dashboard/ReminderList.jsx";

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearing, setClearing] = useState(false);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/reminders");
      setReminders(data.reminders || []);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load reminders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sentCount = reminders.filter((r) => r.status === "sent").length;

  const handleClearSent = async () => {
    if (sentCount === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to clear ${sentCount} sent reminder${sentCount === 1 ? "" : "s"}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setClearing(true);
    setActionError("");
    setSuccessMessage("");
    try {
      const { data } = await api.delete("/reminders/sent");
      const count = data.deletedCount ?? sentCount;
      setSuccessMessage(
        data.message || `Cleared ${count} sent reminder${count === 1 ? "" : "s"}.`
      );
      await load();
    } catch (e) {
      setActionError(e.response?.data?.message || "Could not clear sent reminders");
    } finally {
      setClearing(false);
    }
  };

  const handleRefresh = () => {
    setActionError("");
    setSuccessMessage("");
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Reminder Status
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Automated server-dispatched push alerts scheduled at T-2 and T-1 days before renewal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleClearSent}
            disabled={loading || clearing || sentCount === 0}
            title={sentCount === 0 ? "No sent reminders to clear" : `Clear ${sentCount} sent reminder${sentCount === 1 ? "" : "s"}`}
            className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {clearing ? "Clearing…" : sentCount > 0 ? `Clear Sent Reminders (${sentCount})` : "Clear Sent Reminders"}
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || clearing}
            className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition shadow-sm"
          >
            {loading ? "Checking…" : "Refresh Queue"}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <ReminderList reminders={reminders} loading={loading} error={error} />
    </div>
  );
}
