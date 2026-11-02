import crypto from "crypto";

// Refresh tokens are JWTs signed with JWT_REFRESH_SECRET. MongoDB only ever sees
// this SHA-256 digest, so a database dump cannot be replayed as a live session.
export const hashRefreshToken = (raw) =>
  crypto.createHash("sha256").update(String(raw)).digest("hex");

// Pre-phase-2 rows stored the raw JWT. Recognize that shape explicitly so a legacy
// value is invalidated instead of being compared to a hash and treated as theft.
export const isLegacyRawToken = (stored) =>
  typeof stored === "string" &&
  (stored.startsWith("eyJ") || stored.split(".").length === 3);

export function refreshTokenMatchesHash(storedHash, raw) {
  if (typeof storedHash !== "string" || storedHash.length !== 64) return false;
  const a = Buffer.from(storedHash, "hex");
  const b = Buffer.from(hashRefreshToken(raw), "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
