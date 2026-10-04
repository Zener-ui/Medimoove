import { create } from "zustand";

const TOKEN_KEY = "cm_token";
const USER_KEY = "cm_user";
const LAST_ACTIVE_KEY = "cm_last_active";

// How long the app can sit closed/backgrounded/idle before the next
// visit forces a fresh login. Previously this used sessionStorage,
// which the browser wipes the instant a tab or app closes — that's
// what made every reopen demand a fresh login, not any deliberate
// timeout. localStorage plus this explicit idle check replaces that
// with a real, intentional idle window instead.
//
// 30 minutes, not 4 — 4 minutes proved too aggressive in practice:
// switching away to check WhatsApp for a delivery update, or a bank
// app to send money, routinely exceeds it and reads as a random
// logout bug rather than a deliberate timeout. 30 minutes is the
// common idle-session convention for apps handling payments (long
// enough to survive a normal task-switch, short enough to still mean
// something on a shared/lost device).
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

const isExpired = () => {
  const last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY), 10);
  if (!last) return false; // no record yet (e.g. very first load) — don't punish that
  return Date.now() - last > IDLE_TIMEOUT_MS;
};

const clearStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_ACTIVE_KEY);
};

// Read once at module load — if the stored session is already past
// the idle window, don't restore it at all; start logged out.
const initialExpired = isExpired();
if (initialExpired) clearStorage();

export const useAuthStore = create((set, get) => ({
  token: !initialExpired ? localStorage.getItem(TOKEN_KEY) : null,
  user: !initialExpired ? (() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  })() : null,
  isAuthenticated: !initialExpired && !!localStorage.getItem(TOKEN_KEY),

  login: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    clearStorage();
    set({ token: null, user: null, isAuthenticated: false });
  },

  setUser: (user) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  // Called on user activity (see IdleLogoutWatcher) to push the idle
  // window forward. Only actually writes to storage a few times a
  // minute at most — see the throttling in that component, not here.
  touchActivity: () => {
    if (get().isAuthenticated) localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()));
  },

  // Returns true (and logs out) if the idle window has elapsed since
  // the last recorded activity. Safe to call repeatedly/cheaply.
  checkIdleExpiry: () => {
    if (!get().isAuthenticated) return false;
    if (isExpired()) {
      clearStorage();
      set({ token: null, user: null, isAuthenticated: false });
      return true;
    }
    return false;
  },

  hydrate: () => {
    if (isExpired()) {
      clearStorage();
      set({ token: null, user: null, isAuthenticated: false });
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    try {
      const user = raw ? JSON.parse(raw) : null;
      set({ token, user, isAuthenticated: !!token });
    } catch {
      set({ token: null, user: null, isAuthenticated: false });
    }
  },

  // Derived helpers
  role: () => get().user?.role || null,
  isRole: (r) => get().user?.role === r,
}));
