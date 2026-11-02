import test from "node:test";
import assert from "node:assert/strict";
import {
  addMonthsClamped,
  parseCalendarDate,
  zonedTimeToUtc,
} from "../src/utils/dates.js";
import { advanceRenewalDate, calculateReminderDates } from "../src/services/reminderService.js";

const iso = (date) => date.toISOString();

test("date-only input becomes UTC midnight, never a local timestamp", () => {
  assert.equal(iso(parseCalendarDate("2026-12-31")), "2026-12-31T00:00:00.000Z");
  assert.equal(iso(parseCalendarDate("2026-12-31T23:59:59.000Z")), "2026-12-31T00:00:00.000Z");
  assert.equal(parseCalendarDate("2026-02-30"), null);
  assert.equal(parseCalendarDate("31/12/2026"), null);
});

test("T-2 and T-1 reminders land at 09:00 Asia/Kolkata", () => {
  const [twoDay, oneDay] = calculateReminderDates("2026-06-15", "Asia/Kolkata");
  assert.equal(twoDay.type, "renewal_2_day");
  assert.equal(iso(twoDay.scheduledFor), "2026-06-13T03:30:00.000Z");
  assert.equal(iso(oneDay.scheduledFor), "2026-06-14T03:30:00.000Z");
});

test("reminder instants follow DST in the user's timezone", () => {
  const [beforeDst] = calculateReminderDates("2026-03-09", "America/New_York");
  const [afterDst] = calculateReminderDates("2026-03-10", "America/New_York");
  assert.equal(iso(beforeDst.scheduledFor), "2026-03-07T14:00:00.000Z"); // EST
  assert.equal(iso(afterDst.scheduledFor), "2026-03-08T13:00:00.000Z"); // EDT
});

test("zoned wall clock converts correctly across a DST boundary", () => {
  assert.equal(iso(zonedTimeToUtc(2026, 3, 8, 9, 0, "America/New_York")), "2026-03-08T13:00:00.000Z");
  assert.equal(iso(zonedTimeToUtc(2026, 3, 7, 9, 0, "America/New_York")), "2026-03-07T14:00:00.000Z");
});

test("monthly math clamps month-end instead of rolling over", () => {
  assert.equal(iso(addMonthsClamped(parseCalendarDate("2026-01-31"), 1)), "2026-02-28T00:00:00.000Z");
  assert.equal(iso(addMonthsClamped(parseCalendarDate("2024-01-31"), 1)), "2024-02-29T00:00:00.000Z");
  assert.equal(iso(addMonthsClamped(parseCalendarDate("2024-02-29"), 12)), "2025-02-28T00:00:00.000Z");
});

test("billing cycles advance as calendar dates, custom is not guessed", () => {
  const base = parseCalendarDate("2026-01-15");
  assert.equal(iso(advanceRenewalDate(base, "monthly")), "2026-02-15T00:00:00.000Z");
  assert.equal(iso(advanceRenewalDate(base, "quarterly")), "2026-04-15T00:00:00.000Z");
  assert.equal(iso(advanceRenewalDate(base, "yearly")), "2027-01-15T00:00:00.000Z");
  assert.equal(advanceRenewalDate(base, "custom"), null);
});
