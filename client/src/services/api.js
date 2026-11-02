import axios from "axios";

// no localhost fallback on purpose: a production bundle must never quietly point at
// localhost. Fail loudly instead, and name the file to fix.
const API_BASE = import.meta.env.VITE_API_URL;
if (!API_BASE) {
  throw new Error(
    "VITE_API_URL is not set. Add VITE_API_URL=http://localhost:5000 to client/.env (see client/.env.example)."
  );
}

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

// attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("vault_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// refresh on 401 once
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem("vault_refresh_token");
      if (!refreshToken) return Promise.reject(error);
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
          refreshToken,
        });
        const newToken = data.accessToken;
        if (!newToken) throw new Error("Refresh response missing access token");
        // Rotation returns both tokens. Persist the new refresh token before any
        // queued request retries, so a later refresh cannot fall back to the old one.
        if (data.refreshToken) {
          localStorage.setItem("vault_refresh_token", data.refreshToken);
        }
        localStorage.setItem("vault_access_token", newToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        // Another tab may have rotated the token first (same origin storage).
        // Retry once with its fresh access token instead of signing both tabs out.
        const latestAccess = localStorage.getItem("vault_access_token");
        const latestRefresh = localStorage.getItem("vault_refresh_token");
        if (latestAccess && latestRefresh && latestRefresh !== refreshToken) {
          processQueue(null, latestAccess);
          original.headers.Authorization = `Bearer ${latestAccess}`;
          return api(original);
        }
        processQueue(e, null);
        localStorage.removeItem("vault_access_token");
        localStorage.removeItem("vault_refresh_token");
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const API_URL = API_BASE;
