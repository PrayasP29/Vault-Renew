# Vault-Renew Deployment Checklist

## 1. Start MongoDB locally

Keep MongoDB bound to localhost and do not create a Cloudflare Tunnel for port `27017`.

- If MongoDB is installed as a Windows service: `net start MongoDB`
- Otherwise: `mongod --dbpath C:\data\db`
- Confirm the server `MONGO_URI` points to the local database, for example `mongodb://127.0.0.1:27017/vault-renew`.

## 2. Configure and start the backend

1. Copy `server/.env.example` to `server/.env` and fill in real values. Do not commit `server/.env` or Firebase service-account credentials.
2. Set `NODE_ENV=production` when testing the production deployment.
3. Set `CLIENT_URL` to the Vercel URL used in email links.
4. Set `FRONTEND_URLS` to the exact Vercel origin, plus any localhost origins still needed for development. Use comma-separated origins with no trailing slash.
5. Start from the server directory:

   ```powershell
   Set-Location .\server
   npm start
   ```

6. Check `http://localhost:5000/api/health`.

Firebase Admin reads the service-account path from `GOOGLE_APPLICATION_CREDENTIALS`. The reminder scheduler starts once when this process starts; keep only one backend process connected to the local database.

## 3. Start Cloudflare Tunnel

In a second PowerShell window:

```powershell
cloudflared tunnel --url http://localhost:5000
```

Set the returned HTTPS origin in Vercel as `VITE_API_BASE_URL`, for example:

```text
VITE_API_BASE_URL=https://quiz-image-specifics-bibliography.trycloudflare.com
```

Quick Tunnel hostnames can change whenever the tunnel restarts. Use a named Cloudflare Tunnel with a stable domain for long-term use. Never tunnel MongoDB.

## 4. Configure frontend and deploy to Vercel

In Vercel:

- Root Directory: `client`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Set these Production environment variables:

- `VITE_API_BASE_URL`: the current HTTPS backend origin, without `/api`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (if used by the Firebase project)
- `VITE_FIREBASE_VAPID_KEY`

Firebase web configuration and the VAPID public key are client-side values. Do not add MongoDB credentials, Firebase Admin private keys, JWT secrets, AI private keys, or Resend credentials to Vercel `VITE_*` variables.

The committed `client/vercel.json` supplies the Vite build settings and React Router fallback. `public/firebase-messaging-sw.js` is served at `/firebase-messaging-sw.js`; after deployment, verify that URL returns JavaScript rather than the SPA HTML.

## 5. Configure production CORS

Set `FRONTEND_URLS` in `server/.env` to the exact Vercel origin, such as `https://your-project.vercel.app`. Add a custom production domain when it is available. Localhost development origins are always preserved by the server.

The current frontend uses bearer access and refresh tokens in local storage, not cookies, so Axios does not send credentials and the server does not enable credentialed CORS. If the authentication architecture later moves to cookies, update both settings together and use exact origins only.

## 6. Functional checks

1. Open the Vercel URL and register a user.
2. Verify the email link points to `CLIENT_URL`, then log in and refresh the page.
3. Confirm an expired access token causes one refresh-token rotation and the protected request succeeds.
4. Log out and confirm a subsequent protected request requires login.
5. Upload a supported image, run extraction, and confirm the subscription and reminders are created.
6. Enable browser notifications, confirm `/firebase-messaging-sw.js` is available, register the device, and use the notification test.
7. Confirm a reminder is delivered by FCM and that foreground/background notification click navigation works.
8. Test the health endpoint through both `http://localhost:5000/api/health` and the current HTTPS tunnel URL.

The upload middleware currently accepts JPEG, PNG, and WEBP images up to 10 MB. The existing extraction service recognizes PDF input, but the upload route does not currently accept PDFs; this is an existing product limitation, not a deployment change.

## 7. Laptop availability and Quick Tunnel limitations

The backend, local MongoDB, reminder scheduler, uploaded files, and FCM dispatch stop when the laptop, Node process, MongoDB service, or tunnel stops. Vercel can still serve the frontend, but API requests will fail until the backend and tunnel are running again. Quick Tunnel URLs are temporary and unsuitable as a permanent production endpoint; a stable named tunnel/domain is recommended.
