import rateLimit, { ipKeyGenerator, HOUR, DAY } from "express-rate-limit";

// one generic 429 body for every limiter, so a 429 can never reveal that an email exists
const blocked = (_req, res) =>
  res.status(429).json({ success: false, message: "Too many requests. Please try again later." });

const emailKey = (req) => {
  const raw = req.body?.email;
  return (typeof raw === "string" ? raw : "").trim().toLowerCase().slice(0, 254) || "none";
};

// ponytail: in-memory store, so counters reset on restart and are per-process. Move to a
// Redis store (express-rate-limit `store`) if the API ever runs on more than one instance.
const opts = { standardHeaders: "draft-7", legacyHeaders: false, handler: blocked };

// LOGIN - 5 failures per (IP + email) per 24h. skipSuccessfulRequests frees the slot on a
// good password, so a real user who fat-fingers a few times is never locked out.
export const loginLimiter = rateLimit({
  ...opts,
  windowMs: DAY,
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${emailKey(req)}`,
});

// the (IP + email) key alone cannot stop one host spraying many different accounts
export const loginIpLimiter = rateLimit({ ...opts, windowMs: DAY, limit: 50 });

// REGISTRATION - each hit sends a real Resend email, so this is the email-bombing valve
export const registerLimiter = rateLimit({ ...opts, windowMs: DAY, limit: 5 });

// RESEND - same valve for the resend path; the per-account 1/min throttle stays in the controller
export const resendLimiter = rateLimit({ ...opts, windowMs: DAY, limit: 3 });

// VERIFY - the token is 32 random bytes, so guessing is hopeless; this only stops a flood.
// Deliberately generous so a shared NAT / campus wifi can still verify several people.
export const verifyLimiter = rateLimit({ ...opts, windowMs: HOUR, limit: 30 });

// REFRESH - keyed by IP because the user is established only after verification.
// Generous enough for normal rotation, tight enough to blunt token brute force.
export const refreshLimiter = rateLimit({ ...opts, windowMs: HOUR, limit: 60 });

// per-user limits - keyed on the JWT identity, run after authMiddleware
const perUser = (limit, windowMs) => ({
  ...opts,
  windowMs,
  limit,
  keyGenerator: (req) => req.user?.userId || ipKeyGenerator(req.ip),
});

// UPLOAD - request-rate only. The 30-file quota is phase 2.
export const uploadLimiter = rateLimit(perUser(20, HOUR));

// EXTRACT - every hit bills the AI provider, so this is the cost valve
export const extractLimiter = rateLimit(perUser(10, HOUR));