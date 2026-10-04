import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: inject JWT ──────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize errors ───────────────────
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || "Something went wrong.";
    const code = data?.code;
    const requestId = error.response?.headers?.["x-request-id"] || null;
    const requestUrl = error.config?.url || "";
    const suppressToast = error.config?.suppressToast === true;

    // A failed login is a normal authentication error, not an expired
    // session. Never clear an existing session just because /auth/login
    // returned 401. This also prevents an invalid login attempt on one
    // screen from looking like a session-expiry event.
    const isLoginRequest = /\/auth\/login(?:$|[?])/i.test(requestUrl);

    // Only force logout when the protected API explicitly tells us the
    // presented session token is unusable. Other 401s are returned to the
    // caller untouched so the UI can handle them without destroying a
    // perfectly valid local session.
    const shouldLogoutForAuth =
      status === 401 &&
      !isLoginRequest &&
      [
        "AUTH_TOKEN_MISSING",
        "AUTH_TOKEN_INVALID",
        "AUTH_TOKEN_EXPIRED",
        "AUTH_USER_NOT_FOUND",
      ].includes(code);

    if (shouldLogoutForAuth) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
      return Promise.reject({
        status,
        code,
        requestId,
        message: "Your session has expired or is no longer valid. Please log in again.",
      });
    }

    // Server error
    if (status >= 500 && !suppressToast) {
      toast.error("Server error. Please try again shortly.");
    }

    return Promise.reject({ status, code, requestId, message, data });
  }
);

export default client;
