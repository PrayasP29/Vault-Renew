import { useState } from "react";
import { toDateInput } from "../../lib/subscriptions.js";

const CYCLES = ["monthly", "quarterly", "yearly", "custom"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const field = "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900";
const label = "text-xs font-medium text-zinc-700";

const blank = {
  name: "",
  amount: "",
  currency: "INR",
  billingCycle: "monthly",
  renewalDate: "",
  category: "",
  status: "active",
};

// manual add/edit — the extract-from-invoice path on /upload remains the primary flow
export default function SubscriptionForm({ initial, onSubmit, onCancel, busy, error }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          name: initial.name || "",
          amount: String(initial.amount ?? ""),
          currency: initial.currency || "INR",
          billingCycle: initial.billingCycle || "monthly",
          renewalDate: toDateInput(initial.renewalDate),
          category: initial.category || "",
          status: initial.status || "active",
        }
      : blank
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!form.renewalDate) return;

    // only fields the API accepts — userId/status ownership stays server-side
    const payload = {
      name: form.name.trim(),
      amount,
      currency: form.currency,
      billingCycle: form.billingCycle,
      renewalDate: form.renewalDate,
      category: form.category.trim() || undefined,
    };
    if (initial) payload.status = form.status;
    await onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight">{initial ? "Edit subscription" : "Add subscription"}</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Prefer the paper trail? <span className="text-zinc-700">Upload an invoice</span> and extraction fills this in.
      </p>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={label}>Name</label>
          <input value={form.name} onChange={set("name")} placeholder="Netflix" className={field} />
        </div>
        <div>
          <label className={label}>Amount</label>
          <input value={form.amount} onChange={set("amount")} type="number" min="0" step="0.01" placeholder="649" className={field} />
        </div>
        <div>
          <label className={label}>Currency</label>
          <select value={form.currency} onChange={set("currency")} className={field}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Billing cycle</label>
          <select value={form.billingCycle} onChange={set("billingCycle")} className={field}>
            {CYCLES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Next renewal</label>
          <input value={form.renewalDate} onChange={set("renewalDate")} type="date" className={field} />
        </div>
        <div>
          <label className={label}>Category</label>
          <input value={form.category} onChange={set("category")} placeholder="Entertainment" className={field} />
        </div>
        {initial && (
          <div>
            <label className={label}>Status</label>
            <select value={form.status} onChange={set("status")} className={field}>
              <option value="active">active</option>
              <option value="cancelled">cancelled</option>
            </select>
          </div>
        )}
      </div>

      {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-full bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : initial ? "Save changes" : "Add to vault"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium hover:bg-zinc-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
