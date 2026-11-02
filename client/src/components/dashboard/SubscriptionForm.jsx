import { useState } from "react";
import { toDateInput } from "../../lib/subscriptions.js";

const CYCLES = ["monthly", "quarterly", "yearly", "custom"];
const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

const field =
  "mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-900 dark:focus:border-zinc-400 transition";
const label = "text-xs font-medium text-zinc-700 dark:text-zinc-300";

const blank = {
  name: "",
  amount: "",
  currency: "INR",
  billingCycle: "monthly",
  renewalDate: "",
  category: "",
  status: "active",
};

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
    <form
      onSubmit={submit}
      className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {initial ? "Edit Subscription" : "Add Subscription Manually"}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Fill in the plan details below or upload an invoice for AI auto-extraction.
          </p>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3.5">
        <div className="sm:col-span-2">
          <label className={label}>Subscription Name</label>
          <input
            value={form.name}
            onChange={set("name")}
            required
            placeholder="e.g. Netflix, Spotify, AWS"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Billing Amount</label>
          <input
            value={form.amount}
            onChange={set("amount")}
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="e.g. 649"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Currency</label>
          <select value={form.currency} onChange={set("currency")} className={field}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c} className="bg-white dark:bg-zinc-800">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Billing Frequency</label>
          <select value={form.billingCycle} onChange={set("billingCycle")} className={field}>
            {CYCLES.map((c) => (
              <option key={c} value={c} className="bg-white dark:bg-zinc-800 capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Next Renewal Date</label>
          <input
            value={form.renewalDate}
            onChange={set("renewalDate")}
            type="date"
            required
            className={field}
          />
        </div>
        <div>
          <label className={label}>Category (optional)</label>
          <input
            value={form.category}
            onChange={set("category")}
            placeholder="e.g. Entertainment, Work, Utilities"
            className={field}
          />
        </div>
        {initial && (
          <div>
            <label className={label}>Status</label>
            <select value={form.status} onChange={set("status")} className={field}>
              <option value="active" className="bg-white dark:bg-zinc-800">Active</option>
              <option value="cancelled" className="bg-white dark:bg-zinc-800">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 px-5 py-2 text-xs font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition shadow-sm"
        >
          {busy ? "Saving…" : initial ? "Save Changes" : "Create Subscription"}
        </button>
      </div>
    </form>
  );
}
