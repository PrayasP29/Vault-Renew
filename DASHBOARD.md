# User Dashboard — Implementation Report

## 1. Existing functionality reused (nothing duplicated)

| Area | Reused as-is |
|---|---|
| Auth | `AuthContext` + axios JWT/refresh interceptor in `client/src/services/api.js`, `authMiddleware` on the server. No second auth path. |
| Identity | `GET /api/auth/me` — name, email, `_id`, `emailVerified`. Displayed read-only; the frontend never sends `userId`. |
| Subscriptions | `GET/POST /api/subscriptions`, `GET/PUT/DELETE /api/subscriptions/:id`. Ownership is derived server-side from the JWT. |
| Upload + extraction | `UploadPage` → `POST /api/uploads` → `POST /api/uploads/:id/extract` (real Groq extraction that creates a subscription). Dashboard links into it; it was not re-implemented. |
| Reminders | `createRemindersForSubscription` / `syncRemindersForSubscription` / `deleteRemindersForSubscription` and the scheduler were left untouched. The dashboard only *reads* status. |
| Push | `notificationService` + `POST/GET /api/notifications/devices`, `DELETE /api/notifications/devices/:id`. |

## 2. New frontend functionality

- `ProtectedRoute` wraps the whole authenticated app; unauthenticated → `/login` with `state.from`, authenticated users landing on `/login` are redirected straight to the dashboard.
- `useSubscriptions` — single owner of subscription data so overview/list/timeline cannot drift.
- `/dashboard` — per-currency monthly/yearly estimates, active/cancelled counts, due-in-30-days, next 6 renewals, renewal timeline.
- `/dashboard/subscriptions` — full CRUD + status toggle against the existing endpoints.
- `/dashboard/reminders` — read-only reminder status (type, scheduled/sent dates, attempts, failure reason).
- `/dashboard/settings` — profile from `/me`, user ID, email verification status, change password, logout, notification devices.
- `NotificationSettings` — permission is requested **only** when the user clicks Enable. Devices can be disabled; nothing is automatic.
- Login and Navbar now point to `/dashboard`; `/upload` after a successful extraction links back into the dashboard.
- `Reveal` (the landing scroll animation) is deliberately **not** used inside the dashboard — an app surface should not hide content until scrolled, and it made interactive cards `inert`.

## 3. New backend required (minimal)

- `GET /api/reminders` — `server/src/routes/reminderRoutes.js` + `controller/reminderController.js`. JWT-scoped, optional `subscriptionId`/`status` filters, populates the subscription and aliases it to `subscription` for the UI, and strips `userId` from the response.
- `POST /api/auth/change-password` — bcrypt-verified current password, Zod-validated (min 8), re-hashes, and **revokes the stored refresh token** so every other session must sign in again. The client logs out on success.

No existing auth, subscription, upload, extraction, notification, or scheduling logic was changed.

## 4. Files created

```
client/src/components/ProtectedRoute.jsx
client/src/components/dashboard/DashboardLayout.jsx
client/src/components/dashboard/SummaryCards.jsx
client/src/components/dashboard/UpcomingRenewals.jsx
client/src/components/dashboard/RenewalTimeline.jsx
client/src/components/dashboard/SubscriptionForm.jsx
client/src/components/dashboard/SubscriptionTable.jsx
client/src/components/dashboard/ReminderList.jsx
client/src/components/dashboard/NotificationSettings.jsx
client/src/hooks/useSubscriptions.js
client/src/lib/subscriptions.js
client/src/pages/Dashboard.jsx
client/src/pages/Subscriptions.jsx
client/src/pages/Reminders.jsx
client/src/pages/Settings.jsx
client/scripts/check-subs.mjs
server/src/controllers/reminderController.js
server/src/routes/reminderRoutes.js
```

## 5. Files modified (this task)

- `client/src/App.jsx` — mounted the guarded dashboard routes.
- `client/src/pages/Login.jsx` — post-login and already-authenticated redirects to `/dashboard`, honours `state.from`.
- `client/src/components/Navbar.jsx` — "Dashboard" points to `/dashboard`, added an Upload entry.
- `client/src/pages/UploadPage.jsx` — "View in dashboard" link after a real extraction.
- `client/package.json` — added `check:subs` script (no new dependencies).
- `server/src/server.js` — mounted `/api/reminders`.
- `server/src/controllers/authController.js` — added `changePassword` + Zod schema.
- `server/src/routes/authRoutes.js` — registered `POST /change-password` behind `authMiddleware`.

The landing page, `Reveal`, and `WarpTunnel` work from the previous task (now committed as `18eb9b5`) was not touched. `Reveal` is intentionally unused inside the dashboard — see section 2.

## 6. APIs used

`GET /api/auth/me` · `POST /api/auth/change-password` · `POST /api/auth/logout` · `GET|POST /api/subscriptions` · `GET|PUT|DELETE /api/subscriptions/:id` · `GET /api/reminders` · `POST /api/uploads` · `POST /api/uploads/:id/extract` · `GET|POST /api/notifications/devices` · `DELETE /api/notifications/devices/:id`

## 7. APIs that did not exist and were added

`GET /api/reminders` · `POST /api/auth/change-password`

## 8. Verification

- `npm run check:subs` → `subscriptions math OK` (cycle math, per-currency grouping, upcoming ordering, date handling).
- `npm run lint` → clean.
- `npm run build` → clean, 441 kB / 135 kB gzip.
- `node --check` on all touched server files → clean.
- Route table walked from the mounted Express routers to confirm `/api/auth/change-password` and `/api/reminders` are registered.

## 9. Limitations

- No live E2E run: this needs a running MongoDB plus Firebase credentials, and booting the server also starts the reminder scheduler.
- Analytics are estimates. `custom` billing cycles have no period in the schema, so they are **excluded** from totals and counted separately instead of being guessed at.
- Totals are grouped per currency and never summed across currencies.
- "Monthly" means billed monthly; a yearly ₹12,000 plan shows as ₹1,000/month estimated.
