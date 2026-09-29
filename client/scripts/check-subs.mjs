// one runnable check for the money/date math: node scripts/check-subs.mjs
import assert from "node:assert/strict";
import {
  monthlyEquivalent,
  summarize,
  daysUntil,
  upcomingRenewals,
  formatMoney,
  toDateInput,
} from "../src/lib/subscriptions.js";

const sub = (over = {}) => ({
  name: "X",
  amount: 100,
  currency: "INR",
  billingCycle: "monthly",
  renewalDate: new Date().toISOString(),
  status: "active",
  ...over,
});

// cycle normalization
assert.equal(monthlyEquivalent(sub({ billingCycle: "monthly" })), 100);
assert.equal(monthlyEquivalent(sub({ billingCycle: "quarterly", amount: 300 })), 100);
assert.equal(monthlyEquivalent(sub({ billingCycle: "yearly", amount: 1200 })), 100);
assert.equal(monthlyEquivalent(sub({ billingCycle: "custom" })), null, "custom must not be guessed");

// totals: mixed currencies stay separate, cancelled excluded, custom counted
const s = summarize([
  sub({ name: "Netflix", amount: 649 }),
  sub({ name: "Spotify", amount: 119, billingCycle: "quarterly" }),
  sub({ name: "Domain", amount: 1200, billingCycle: "yearly" }),
  sub({ name: "Odd", amount: 77, billingCycle: "custom" }),
  sub({ name: "Dead", amount: 999, status: "cancelled" }),
  sub({ name: "USD one", amount: 10, currency: "USD" }),
]);
assert.equal(s.total, 6);
assert.equal(s.active, 5);
assert.equal(s.cancelled, 1);
assert.equal(s.customCycles, 1);
const inr = s.monthly.find((m) => m.currency === "INR");
assert.equal(Math.round(inr.amount), 649 + 40 + 100); // 649 + 119/3 + 1200/12
assert.equal(inr.yearly, inr.amount * 12); // estimate derives from the unrounded sum
assert.equal(s.monthly.find((m) => m.currency === "USD").amount, 10);

// days until: today = 0, tomorrow = 1, past = negative
assert.equal(daysUntil(new Date()), 0);
assert.equal(daysUntil(new Date(Date.now() + 86400000)), 1);
assert.equal(daysUntil(new Date(Date.now() - 86400000)), -1);

// upcoming: sorted, active-only, past excluded
const up = upcomingRenewals([
  sub({ name: "far", renewalDate: new Date(Date.now() + 10 * 86400000) }),
  sub({ name: "past", renewalDate: new Date(Date.now() - 86400000) }),
  sub({ name: "soon", renewalDate: new Date(Date.now() + 86400000) }),
  sub({ name: "dead", renewalDate: new Date(Date.now() + 86400000), status: "cancelled" }),
]);
assert.deepEqual(up.map((x) => x.name), ["soon", "far"]);

// money formatting must not throw on a junk currency code from the DB
assert.ok(formatMoney(649, "INR").length > 0);
assert.ok(formatMoney(10, "NOT_A_CODE").includes("10"));

// date input round-trip stays local
assert.equal(toDateInput(new Date(2026, 11, 31)), "2026-12-31");

console.log("subscriptions math OK");
