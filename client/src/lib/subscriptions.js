// pure helpers for the dashboard — no React, no API, so they stay testable
const MS_DAY = 86400000;

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// ponytail: monthly/yearly math only for cycles the data actually defines. "custom" has no
// period stored, so it is excluded from totals (and counted) instead of being faked
export function monthlyEquivalent(sub) {
  switch (sub.billingCycle) {
    case "monthly":
      return sub.amount;
    case "quarterly":
      return sub.amount / 3;
    case "yearly":
      return sub.amount / 12;
    default:
      return null;
  }
}

export function isActive(sub) {
  return sub.status === "active";
}

export function daysUntil(dateStr) {
  return Math.round((startOfDay(new Date(dateStr)) - startOfDay(new Date())) / MS_DAY);
}

export function activeSubs(subs) {
  return subs.filter(isActive);
}

export function sortedByRenewal(subs) {
  return [...subs].sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));
}

// totals are grouped per currency — adding ₹ and $ together would be a lie
export function summarize(subs) {
  const active = activeSubs(subs);
  const perCurrency = new Map();
  let customCycles = 0;

  for (const s of active) {
    const monthly = monthlyEquivalent(s);
    if (monthly === null) {
      customCycles += 1;
      continue;
    }
    const currency = s.currency || "INR";
    perCurrency.set(currency, (perCurrency.get(currency) || 0) + monthly);
  }

  return {
    total: subs.length,
    active: active.length,
    cancelled: subs.length - active.length,
    customCycles,
    monthly: [...perCurrency.entries()].map(([currency, amount]) => ({
      currency,
      amount,
      yearly: amount * 12,
    })),
  };
}

export function upcomingRenewals(subs, limit = 8) {
  return sortedByRenewal(subs.filter((s) => isActive(s) && daysUntil(s.renewalDate) >= 0)).slice(0, limit);
}

export function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // unknown currency code from the DB — show it raw rather than throwing
    return `${currency || ""} ${Number(amount).toFixed(2)}`;
  }
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDayMonth(value) {
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// for <input type="date"> — local date, not toISOString() which shifts by timezone
export function toDateInput(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
