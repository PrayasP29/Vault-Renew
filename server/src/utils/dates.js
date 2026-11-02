// Calendar-date handling for date-only renewals.
//
// A renewal date has no time-of-day. It is stored as UTC midnight whose UTC Y-M-D
// components are the user's calendar date. Reminder times are then materialised in
// the user's IANA timezone, never in the server's local timezone.

export const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || "Asia/Kolkata";

const formatterCache = new Map();

function resolveTimeZone(timeZone) {
  const tz = typeof timeZone === "string" && timeZone.trim() ? timeZone.trim() : DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function partsFormatter(timeZone) {
  const tz = resolveTimeZone(timeZone);
  let fmt = formatterCache.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatterCache.set(tz, fmt);
  }
  return fmt;
}

function zonedParts(date, timeZone) {
  const parts = partsFormatter(timeZone).formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour) === 24 ? 0 : Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function offsetMs(date, timeZone) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const ms = date.getTime();
  return asUtc - (ms - (ms % 1000));
}

// Convert a wall-clock time in `timeZone` to the matching UTC instant.
// Two passes handle the DST offset changing between the guess and the result.
export function zonedTimeToUtc(year, month, day, hour, minute, timeZone) {
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const firstOffset = offsetMs(new Date(wall), timeZone);
  let utc = wall - firstOffset;
  const secondOffset = offsetMs(new Date(utc), timeZone);
  if (secondOffset !== firstOffset) utc -= secondOffset - firstOffset;
  return new Date(utc);
}

// Parse a date-only value (YYYY-MM-DD, or a Date) into UTC midnight.
// Invalid dates (2026-02-30) return null rather than silently rolling over.
export function parseCalendarDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function utcCalendarParts(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function addCalendarDays(date, days) {
  const { year, month, day } = utcCalendarParts(date);
  return new Date(Date.UTC(year, month - 1, day + days));
}

// Month arithmetic is clamped to the target month's last day (Jan 31 + 1 month
// => Feb 28/29), which is how subscription billing cycles behave.
export function addMonthsClamped(date, months) {
  const { year, month, day } = utcCalendarParts(date);
  const total = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(total / 12);
  const targetMonth = total % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, targetMonth, Math.min(day, lastDay)));
}

export function calendarKeyUtc(date) {
  const { year, month, day } = utcCalendarParts(date);
  return year * 10000 + month * 100 + day;
}

export function calendarKeyInTimeZone(date, timeZone) {
  const p = zonedParts(date, timeZone);
  return p.year * 10000 + p.month * 100 + p.day;
}

export function isCalendarDateBeforeToday(date, now, timeZone) {
  return calendarKeyUtc(date) < calendarKeyInTimeZone(now, timeZone);
}
