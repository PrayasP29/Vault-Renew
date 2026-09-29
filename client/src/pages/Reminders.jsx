import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";
import ReminderList from "../components/dashboard/ReminderList.jsx";

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Reminder status</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Scheduled and sent by the server at T-2 and T-1. This page only reports — it never sends anything.
          </p>
        </div>
        <button onClick={load} className="self-start rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          Refresh
        </button>
      </div>

      <ReminderList reminders={reminders} loading={loading} error={error} />
    </div>
  );
}
