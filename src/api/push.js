import client from "./client";

export const getVapidKey = () => client.get("/push/vapid-key", { suppressToast: true });
export const savePushSubscription = (subscription) => client.post("/push/subscribe", subscription, { suppressToast: true });
export const removePushSubscription = (endpoint) => client.post("/push/unsubscribe", { endpoint }, { suppressToast: true });
