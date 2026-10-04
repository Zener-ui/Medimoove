import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

// Medimoove production API. Keep this explicit so an old VITE_API_URL,
// .env.local, or Vite proxy cannot redirect API calls to localhost.
const BASE_URL = "https://medimoove-backend.onrender.com/api";

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
    const isLoginRequest = /\/auth\/login(?:$|[?])/i.test(requestUrl);

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

    if (status >= 500 && !suppressToast) {
      toast.error("Server error. Please try again shortly.");
    }

    return Promise.reject({ status, code, requestId, message, data });
  }
);

export default client;
