# Vault-Ren

## Subscription renewal reminders, with document-assisted setup

Vault-Ren helps users keep track of subscriptions, renewal dates, billing cycles, and notification devices in one place. Users can enter subscriptions manually or upload an invoice, receipt, billing screenshot, or supported document for structured extraction.

The repository contains a React/Vite client and an Express/MongoDB API.

## Contents

- [Overview](#overview)
- [Key features](#key-features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and setup](#installation-and-setup)
- [Environment variables](#environment-variables)
- [API](#api)
- [Authentication and data flow](#authentication-and-data-flow)
- [Testing and verification](#testing-and-verification)
- [Security considerations](#security-considerations)
- [Current status and limitations](#current-status-and-limitations)
- [Possible future improvements](#possible-future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Overview

The implemented workflow is:

1. A user registers with a name, email address, and password.
2. The API sends an email-verification link when a Resend API key is configured. The account must be verified before login.
3. The user signs in and receives a short-lived access token and a refresh token.
4. The dashboard can create, list, update, cancel, and delete user-owned subscriptions.
5. A user can upload one JPEG, PNG, WebP, or PDF file at a time.
6. The extraction endpoint sends the file to the configured mock provider or OpenAI-compatible provider, validates and normalizes the returned subscription data, and creates a subscription for the authenticated user.
7. Creating or changing an active subscription schedules reminders for two days and one day before its renewal date.
8. A server-side scheduler polls due reminders every 60 seconds and sends them to enabled Firebase Cloud Messaging devices. Failed sends can be retried once before the reminder is marked failed.

## Key features

### Authentication and account management

- Registration with Zod input validation and bcrypt password hashing.
- Email verification with expiring, hashed verification tokens.
- JWT access tokens and refresh-token handling.
- Protected client routes and bearer-token authorization on protected API routes.
- Password changes revoke the stored refresh token.
- Profile, email-verification status, logout, and device settings in the dashboard.

### Subscription management

- Create, list, read, update, cancel, and delete subscriptions.
- Track name, amount, currency, renewal date, billing cycle, category, notes, and active/cancelled status.
- User-scoped subscription queries; the API takes ownership from the verified JWT rather than from request data.
- Dashboard summaries, upcoming renewals, a renewal timeline, and reminder status views.

### Document processing

- Authenticated uploads stored under `server/uploads/`.
- Accepted MIME types: JPEG, PNG, WebP, and PDF.
- One file per request with a 10 MB size limit.
- Mock extraction for local development.
- OpenAI-compatible vision request support through configurable provider URL and model settings.
- Normalization and validation of amounts, currencies, billing cycles, dates, and required fields.
- A successful extraction creates an active subscription and marks the upload as processed.

### Renewal notifications

- Two reminder records per active subscription: two days before and one day before renewal.
- Browser/device registration through Firebase Cloud Messaging.
- Enabled-device lookup scoped to the owning user.
- Failed sends are retried after one hour; invalid device registrations are disabled.
- Reminder status, attempts, failure timestamps, and failure reasons are available through the reminders API.

## Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19 | User interface and dashboard |
| Frontend tooling | Vite 8 | Development server and production build |
| Frontend styling | Tailwind CSS 4 | Utility-based styling |
| Frontend HTTP | Axios | API requests and token refresh interceptor |
| Backend | Node.js, Express 5 | REST API and middleware |
| Database | MongoDB with Mongoose 9 | Users, subscriptions, uploads, reminders, and devices |
| Validation | Zod | Request and extracted-data validation |
| Authentication | JSON Web Tokens and bcryptjs | Access/refresh tokens and password hashing |
| Uploads | Multer | Validated local multipart file storage |
| Email | Resend | Verification email delivery |
| AI/OCR integration | Mock provider or OpenAI-compatible API | Structured subscription extraction |
| Notifications | Firebase Web SDK and Firebase Admin SDK | Device registration and push delivery |

## Architecture

```mermaid
flowchart LR
    Browser["React + Vite client"]
    API["Express REST API"]
    Auth["JWT authentication\nand user ownership"]
    DB[("MongoDB")]
    Uploads["Multer uploads\nserver/uploads"]
    Extract["Extraction service\nmock or AI provider"]
    Scheduler["Reminder scheduler\n60-second poll"]
    FCM["Firebase Cloud Messaging"]
    Device["Registered browser/device"]
    Email["Resend verification email"]

    Browser --> API
    API --> Auth
    Auth --> DB
    API --> Uploads
    Uploads --> Extract
    Extract --> DB
    DB --> Scheduler
    Scheduler --> FCM
    FCM --> Device
    API --> Email
```

## Project structure

```text
Vault-Renew/
├── client/
│   ├── public/
│   │   ├── firebase-messaging-sw.js
│   │   └── icons.svg
│   ├── scripts/
│   │   └── check-subs.mjs
│   └── src/
│       ├── components/          # Landing, navigation, upload, and shared UI
│       ├── components/dashboard/ # Dashboard cards, tables, forms, and settings
│       ├── config/firebase.js   # Firebase browser configuration
│       ├── context/AuthContext.jsx
│       ├── hooks/useSubscriptions.js
│       ├── lib/                 # Subscription calculations and shared utilities
│       ├── pages/               # Landing, auth, upload, and dashboard pages
│       └── services/            # Axios API client and notification registration
├── server/
│   ├── uploads/                 # Runtime local upload storage
│   └── src/
│       ├── config/              # MongoDB and Firebase Admin setup
│       ├── controllers/         # Request handlers
│       ├── middleware/          # JWT and multipart-upload middleware
│       ├── models/              # Mongoose schemas
│       ├── routes/              # Express route definitions
│       ├── services/             # Email, extraction, FCM, and reminders
│       ├── utils/jwt.js
│       └── server.js            # API bootstrap and scheduler startup
├── DASHBOARD.md
└── README.md
```

## Prerequisites

- Git
- Node.js and npm (the repository does not declare a specific Node.js version)
- A running MongoDB instance and connection string
- A Resend account/API key for real verification-email delivery
- Firebase project configuration for browser notifications
- Firebase Admin Application Default Credentials for server-side FCM sends
- An OpenAI-compatible AI API key if real document extraction is required; the default mock provider can be used without one

## Installation and setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Vault-Renew
```

### 2. Configure the backend

```bash
cd server
npm install
cp .env.example .env
```

Set `MONGO_URI`, both JWT secrets, and `CLIENT_URL` in `server/.env`. Configure Resend, Firebase Admin credentials, and the AI provider if you need those integrations. `AI_PROVIDER=mock` is suitable for a local extraction flow without an external AI account.

Start the API:

```bash
npm run dev
```

The development server listens on port 5000 by default. It connects to MongoDB and starts the reminder scheduler during startup.

### 3. Configure the frontend

Open a second terminal:

```bash
cd client
npm install
cp .env.example .env
```

Set the Firebase browser values in `client/.env`. Set `VITE_API_URL` if the API is not available at `http://localhost:5000`; this variable is read by the client even though it is not included in the current client example file.

Start the client:

```bash
npm run dev
```

The Vite development server normally runs at `http://localhost:5173`.

### 4. External services

- MongoDB is required for the API to start.
- Without `RESEND_API_KEY`, registration succeeds but verification email delivery is mocked; use a configured Resend account for a real email flow.
- The default extraction mode is deterministic mock extraction. Set `AI_PROVIDER=openai` (or configure an AI key with a non-mock provider) for an OpenAI-compatible vision request.
- Firebase browser configuration and a service-account/Application Default Credentials setup are required for real push notifications.
- Keep all credentials and service-account JSON files outside version control.

## Environment variables

### Backend: `server/.env`

| Variable | Purpose | Required |
| --- | --- | --- |
| `PORT` | API listening port; defaults to `5000` | No |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Signs access tokens | Yes |
| `JWT_REFRESH_SECRET` | Signs refresh tokens | Yes |
| `CLIENT_URL` | Base URL used in verification links | Yes for usable email links |
| `RESEND_API_KEY` | Enables real verification-email delivery | No for local mock email behavior |
| `EMAIL_FROM` | Sender address passed to Resend | Yes when Resend is enabled |
| `AI_PROVIDER` | Extraction mode, such as `mock` or `openai` | No; mock behavior is the fallback |
| `AI_API_KEY` | AI provider credential | Required for real AI extraction |
| `AI_BASE_URL` | OpenAI-compatible API base URL | No; defaults to OpenAI's API URL |
| `AI_MODEL` | Model sent to the provider | No; defaults to `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | AI request timeout in milliseconds | No; defaults to `30000` |
| `AI_MOCK_BEHAVIOR` | Mock result mode: `success`, `malformed`, `missing`, or `failure` | No |
| `FIREBASE_PROJECT_ID` | Firebase Admin project ID | Required for server FCM setup |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase/GCP Application Default Credentials | Required for local server FCM setup |
| `ENABLE_DEV_TEST_AUTH` | Enables development-only test routes when set to `true` outside production | No |
| `TEST_FCM_MOCK` | Enables the FCM mock branches used by notification tests | No |

`OPENAI_API_KEY` is also accepted by the extraction service as a fallback key name, although it is not listed in the example file.

Example placeholders:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/vault-renew
JWT_SECRET=replace_with_a_random_access_secret
JWT_REFRESH_SECRET=replace_with_a_random_refresh_secret
CLIENT_URL=http://localhost:5173
AI_PROVIDER=mock
```

### Frontend: `client/.env`

| Variable | Purpose | Required |
| --- | --- | --- |
| `VITE_API_URL` | API origin; defaults to `http://localhost:5000` | Only when the API uses another origin |
| `VITE_FIREBASE_API_KEY` | Firebase browser app configuration | Required for browser FCM |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase browser app configuration | Required for browser FCM |
| `VITE_FIREBASE_PROJECT_ID` | Firebase browser app configuration | Required for browser FCM |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase browser app configuration | Required for browser FCM |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase browser app configuration | Required for browser FCM |
| `VITE_FIREBASE_APP_ID` | Firebase browser app configuration | Required for browser FCM |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase measurement configuration | Optional if unused by the selected Firebase features |
| `VITE_FIREBASE_VAPID_KEY` | Web Push VAPID key used when registering a browser device | Required for browser push registration |

Do not commit either `.env` file, API keys, JWT secrets, database credentials, or Firebase service-account private keys.

## API

All paths below are relative to the API origin and are mounted under `/api`. Except for health and the explicitly public authentication endpoints, routes require `Authorization: Bearer <access-token>`.

### Health and authentication

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Check that the server is running | No |
| `POST` | `/api/auth/register` | Create an account and begin email verification | No |
| `GET` | `/api/auth/verify-email?token=...` | Verify an email address | No |
| `POST` | `/api/auth/resend-verification` | Send a new verification email | No |
| `POST` | `/api/auth/login` | Sign in and receive access/refresh tokens | No |
| `POST` | `/api/auth/refresh` | Exchange a valid stored refresh token for an access token | No |
| `GET` | `/api/auth/me` | Read the authenticated profile | Yes |
| `POST` | `/api/auth/change-password` | Change the password and revoke the refresh token | Yes |
| `POST` | `/api/auth/logout` | Revoke the supplied refresh token | Refresh token |

### Subscriptions

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/subscriptions` | Create a subscription and schedule reminders | Yes |
| `GET` | `/api/subscriptions` | List the current user's subscriptions | Yes |
| `GET` | `/api/subscriptions/:id` | Read one owned subscription | Yes |
| `PUT` | `/api/subscriptions/:id` | Update an owned subscription and resync reminders | Yes |
| `DELETE` | `/api/subscriptions/:id` | Delete an owned subscription and its reminders | Yes |

### Uploads and extraction

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/uploads` | Upload one multipart file in the `file` field | Yes |
| `GET` | `/api/uploads` | List the current user's uploads | Yes |
| `GET` | `/api/uploads/:id` | Read upload metadata | Yes |
| `GET` | `/api/uploads/:id/download` | Download an owned upload | Yes |
| `DELETE` | `/api/uploads/:id` | Delete an owned upload and local file | Yes |
| `POST` | `/api/uploads/:id/extract` | Extract and create a subscription from an uploaded file | Yes |

Uploads accept JPEG, PNG, WebP, and PDF files up to 10 MB. Extraction is single-use for a processed upload.

### Reminders and notification devices

| Method | Route | Purpose | Auth |
| --- | --- | --- | --- |
| `GET` | `/api/reminders` | List up to 200 reminders for the current user | Yes |
| `POST` | `/api/notifications/devices` | Register or re-enable a device installation | Yes |
| `GET` | `/api/notifications/devices` | List the user's registered devices | Yes |
| `DELETE` | `/api/notifications/devices/:id` | Disable a registered device | Yes |

Example authenticated request:

```bash
curl http://localhost:5000/api/subscriptions \
  -H "Authorization: Bearer replace_with_access_token"
```

The development-only `/api/dev/test-login` and `/api/dev/test-notification` routes are disabled unless explicitly enabled and are not part of the production API.

## Authentication and data flow

The client stores the access and refresh tokens locally. It attaches the access token to API requests and attempts one refresh request after a `401` response. The server verifies access tokens in `authMiddleware`; protected controllers use the decoded user ID in their database filters.

Passwords are hashed with bcrypt. Login is rejected until `emailVerified` is true. Refresh tokens are stored per user, so a new login replaces the previous stored refresh token. A password change or logout clears the stored refresh token.

Uploads are stored with generated filenames, and the upload record is associated with the authenticated user. Extraction reads only an upload selected with both its ID and the authenticated user ID. The normalized extraction result is used to create a subscription with the authenticated user ID; clients cannot choose another owner.

Creating or updating an active subscription synchronizes two reminder records. The scheduler claims due pending reminders, checks that the subscription is still active, finds enabled devices for the same user, and sends through Firebase Admin. Successful reminders are marked sent; a failed first attempt is retried after one hour, then marked failed.

## Testing and verification

There is no backend test runner configured in `server/package.json`. The client includes one executable calculation check:

```bash
cd client
npm run check:subs
```

The client also provides the following validation commands:

```bash
npm run lint
npm run build
```

To check API availability while the server is running:

```bash
curl http://localhost:5000/api/health
```

The response should indicate that the Vault-Renew server is running. End-to-end authentication, email, AI extraction, MongoDB persistence, and push-notification checks require the corresponding external services and credentials.

## Security considerations

The current implementation provides:

- JWT access-token verification for protected API routes.
- Bcrypt password hashing.
- Expiring, hashed email-verification tokens.
- Zod validation for authentication, subscriptions, extraction output, and device registration.
- User-scoped queries for subscriptions, uploads, reminders, and notification devices.
- MIME/extension checks and a 10 MB single-file upload limit.
- Secrets supplied through environment variables rather than source code.

The current Express bootstrap uses the `cors` package with its default configuration. It does not currently configure Helmet or a general request-rate-limiting middleware. Email resend has a simple per-user expiry-window guard, but this is not a general rate-limiting system. Review these areas before exposing the API publicly.

Never commit `.env` files, API keys, JWT secrets, database passwords, or Firebase service-account files.

## Current status and limitations

### Implemented

- React dashboard and authentication pages.
- MongoDB-backed users, subscriptions, uploads, reminders, and notification devices.
- Manual subscription CRUD and cancellation.
- Mock extraction and OpenAI-compatible extraction integration.
- Local upload storage and authenticated downloads.
- Email verification integration through Resend.
- Firebase browser registration and server-side FCM delivery.
- Reminder scheduling and limited retry handling.

### Known limitations

- Uploads are stored on the local server filesystem; they are not moved to durable object storage.
- The scheduler is an in-process 60-second polling loop with a batch limit of 50 due reminders, not a distributed job queue.
- One refresh token is stored per user, so multiple active sessions are not independently retained.
- The default AI mode is mock extraction; real provider behavior depends on an external API.
- No automated backend test suite or CI configuration is included.
- CORS is not restricted to a configured origin in the current server bootstrap.
- No license file or license declaration has been specified for this repository.

## Possible future improvements

- Add focused backend and integration tests, plus continuous integration.
- Move uploads to durable, access-controlled object storage.
- Replace in-process polling with a durable queue and distributed scheduler.
- Add explicit CORS, security-header, and request-rate-limit configuration for deployment.
- Support more document formats and provider-specific extraction adapters.
- Model recurring subscription lifecycles and renewal history more explicitly.
- Add structured monitoring, alerting, and delivery metrics.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make the smallest focused change that addresses the issue.
4. Run the relevant client checks and manually verify affected API behavior.
5. Open a pull request describing the change and verification performed.

No additional contribution policy or automated CI requirement is currently defined in the repository.

## License

No license has been specified in the repository. Add an appropriate license before distributing or reusing the project outside its intended academic context.
