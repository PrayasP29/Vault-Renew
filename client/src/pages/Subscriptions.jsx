import { useState } from "react";
import { Link } from "react-router-dom";
import useSubscriptions from "../hooks/useSubscriptions.js";
import SubscriptionForm from "../components/dashboard/SubscriptionForm.jsx";
import SubscriptionTable from "../components/dashboard/SubscriptionTable.jsx";
import { sortedByRenewal } from "../lib/subscriptions.js";

export default function Subscriptions() {
  const { subs, loading, error, create, update, remove } = useSubscriptions();
  const [editing, setEditing] = useState(null); // subscription | "new" | null
  const [busyId, setBusyId] = useState(null);
  const [formError, setFormError] = useState("");

  const submit = async (payload) => {
    setFormError("");
    setBusyId("form");
    try {
      if (editing === "new") await create(payload);
      else await update(editing._id || editing.id, payload);
      setEditing(null);
    } catch (e) {
      setFormError(e.response?.data?.message || "Could not save");
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (s) => {
    setBusyId(s._id || s.id);
    try {
      await update(s._id || s.id, { status: s.status === "active" ? "cancelled" : "active" });
    } catch (e) {
      setFormError(e.response?.data?.message || "Could not update status");
    } finally {
      setBusyId(null);
    }
  };

  const destroy = async (s) => {
    if (!window.confirm(`Delete ${s.name}? Its reminders are removed too.`)) return;
    setBusyId(s._id || s.id);
    try {
      await remove(s._id || s.id);
    } catch (e) {
      setFormError(e.response?.data?.message || "Could not delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-zinc-500">{subs.length} in your vault, sorted by renewal date</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing("new")}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Add manually
          </button>
          <Link to="/upload" className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50">
            Upload invoice
          </Link>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {editing && (
        <SubscriptionForm
          initial={editing === "new" ? null : editing}
          onSubmit={submit}
          onCancel={() => {
            setEditing(null);
            setFormError("");
          }}
          busy={busyId === "form"}
          error={formError}
        />
      )}
      {!editing && formError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          Loading subscriptions…
        </div>
      ) : (
        <SubscriptionTable
          subs={sortedByRenewal(subs)}
          onEdit={(s) => {
            setFormError("");
            setEditing(s);
          }}
          onDelete={destroy}
          onToggleStatus={toggleStatus}
          busyId={busyId}
        />
      )}
    </div>
  );
}
