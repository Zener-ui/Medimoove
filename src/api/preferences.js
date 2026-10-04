import client from "./client";
export const getNotificationPrefs = () => client.get("/preferences/notifications");
export const updateNotificationPrefs = (payload) => client.put("/preferences/notifications", payload);
