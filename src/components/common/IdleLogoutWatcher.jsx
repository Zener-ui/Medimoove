import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const CHECK_INTERVAL_MS = 15 * 1000;
// Don't write to localStorage on every single mousemove — once every
// 10s of real activity is plenty to keep the idle window pushed
// forward without hammering storage.
const ACTIVITY_THROTTLE_MS = 10 * 1000;
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

/**
 * Mounted once at the app root. Handles the 4-minute idle/away
 * timeout: if the app sits closed, backgrounded, or untouched for
 * longer than IDLE_TIMEOUT_MS, the next check logs the person out and
 * sends them back to /login — instead of the old behavior where
 * closing the tab wiped the session immediately every single time.
 *
 * Three triggers, since relying on just one is unreliable:
 * - a periodic interval, for someone who leaves the tab open and idle
 * - a visibilitychange check, since background tabs get throttled by
 *   the browser and timers may not fire reliably while hidden — this
 *   is what actually catches "closed the app for 5 minutes"
 * - activity listeners, to keep pushing the window forward while the
 *   person is genuinely using the app
 */
export default function IdleLogoutWatcher() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const touchActivity = useAuthStore((s) => s.touchActivity);
  const checkIdleExpiry = useAuthStore((s) => s.checkIdleExpiry);
  const lastTouchRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const runCheck = () => {
      if (checkIdleExpiry()) {
        navigate("/login", { replace: true });
      }
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastTouchRef.current > ACTIVITY_THROTTLE_MS) {
        lastTouchRef.current = now;
        touchActivity();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") runCheck();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, navigate, touchActivity, checkIdleExpiry]);

  return null;
}
