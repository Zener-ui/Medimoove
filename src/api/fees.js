import client from "./client";

export const getFeeSettings = () => client.get("/fees/settings");
