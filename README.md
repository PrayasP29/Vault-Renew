# Vault-Ren — Subscription Renewal Reminder

A full-stack application that tracks your subscriptions and reminds you before they renew. Upload invoices or documents, and OCR/AI extracts the subscription details automatically. Renewal reminders are delivered as push notifications.

## Features

- User authentication (register / login)
- Email verification
- Subscription management (CRUD)
- Invoice/document upload
- OCR/AI-based subscription detail extraction
- Renewal reminders
- Push notifications via Firebase Cloud Messaging
- Dashboard

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Tailwind CSS, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Authentication | JWT |
| AI/OCR | OpenAI-compatible API / Groq |
| Notifications | Firebase Cloud Messaging |

## Project Structure

```
Vault-Renew/
├── client/               # React + Vite frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/        # Dashboard, Subscriptions, Upload, etc.
│       ├── services/     # API client
│       └── ...
└── server/               # Express backend
    ├── uploads/          # Stored uploads
    └── src/
        ├── config/       # DB, Firebase Admin
        ├── controllers/
        ├── middleware/   # Auth, rate limit, upload
        ├── models/       # Mongoose schemas
        ├── routes/
        ├── services/     # Extraction, email, FCM, reminders
        └── server.js
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd Vault-Renew
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Copy the example files and fill in your values:

```bash
cd ../client
cp .env.example .env

cd ../server
cp .env.example .env
```

See [Environment Variables](#environment-variables) below.

### 5. Start the backend

```bash
cd server
npm run dev
```

Server runs on `http://localhost:5000` by default.

### 6. Start the frontend

```bash
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## Environment Variables

### Client (`client/.env`)

```
VITE_API_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_FIREBASE_VAPID_KEY
```

### Server (`server/.env`)

```
PORT
NODE_ENV
MONGO_URI
JWT_SECRET
JWT_REFRESH_SECRET
RESEND_API_KEY
EMAIL_FROM
CLIENT_URL
AI_PROVIDER
AI_API_KEY
AI_BASE_URL
AI_MODEL
AI_TIMEOUT_MS
FIREBASE_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS
```

Never commit real keys or secrets — only fill these in your local `.env` files.

## API

Main API areas:

- `/api/auth` — register, login, email verification, token refresh
- `/api/subscriptions` — subscription CRUD
- `/api/uploads` — document upload and AI extraction
- `/api/notifications` — device registration for push notifications

## Security Notes

- JWT authentication (access + refresh tokens)
- Password validation and hashing (bcrypt)
- Rate limiting on sensitive endpoints
- Helmet HTTP headers
- CORS restricted to the configured client origin
- User-owned resource isolation (users can only access their own data)

## Development Status

| Area | Status |
|------|--------|
| Authentication | Implemented |
| Subscription management | Implemented |
| Uploads | Implemented |
| AI extraction | Implemented |
| FCM notifications | Implemented |
| Reminder scheduler | Implemented |
| Security hardening | Phase 1 completed |

## License

This project is developed for academic purposes.
