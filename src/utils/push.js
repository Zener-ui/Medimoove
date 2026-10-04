import { getVapidKey, savePushSubscription, removePushSubscription } from "@/api/push";

export const isPushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

// Requests permission (this is the browser's native prompt — must be
// called from a real user gesture, e.g. a button click, or most
// browsers silently ignore it) and, if granted, creates a push
// subscription and saves it to the backend. Safe to call even if a
// subscription already exists — pushManager.subscribe() returns the
// existing one instead of creating a duplicate, and the backend
// upserts on endpoint either way.
export const enablePushNotifications = async () => {
  if (!isPushSupported()) return { success: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { success: false, reason: "denied" };

  const vapidData = await getVapidKey();
  if (!vapidData?.success || !vapidData?.key) {
    throw new Error(vapidData?.message || "Push notifications are not configured on the server.");
  }

  // Be explicit about service-worker registration. vite-plugin-pwa normally
  // injects the registration script, but the push flow should not depend on
  // timing/race conditions around that injected registration.
  let registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) {
    registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }
  registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidData.key),
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("The browser did not return a valid push subscription.");
  }

  const saved = await savePushSubscription({ endpoint: json.endpoint, keys: json.keys });
  if (!saved?.success) {
    throw new Error(saved?.message || "The server could not save this device for notifications.");
  }

  return { success: true };
};

export const disablePushNotifications = async () => {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await removePushSubscription(subscription.endpoint);
  await subscription.unsubscribe();
};

export const getPushPermissionState = () => {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission; // "granted" | "denied" | "default"
};
