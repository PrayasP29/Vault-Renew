import { initializeApp, applicationDefault } from "firebase-admin/app";

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

export default app;
