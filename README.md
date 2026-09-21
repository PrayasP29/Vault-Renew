# Vault-Renew

Subscription renewal reminder — college internal project.

## Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node + Express
- DB: MongoDB (Mongoose)
- Auth: JWT

## Structure
```
Vault-Renew/
├── client/  # React + Vite
└── server/  # Express API
```

## Run

Frontend:
```bash
cd client
npm install
npm run dev
```

Backend:
```bash
cd server
npm install
npm run dev
```

Health check: `GET http://localhost:5000/api/health` → `{ "success": true, "message": "Vault-Renew server is running" }`

## Roadmap
1. Project setup + health check (current)
2. MongoDB connection
3. Auth (User model, register/login, JWT)
4. Subscription CRUD + Dashboard
5. Image upload → OCR → extraction → verification
6. Reminder + notifications
7. Testing & deployment
