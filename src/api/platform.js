import client from "./client";

export const getPlatformBalance = () => client.get("/platform-revenue/balance");
export const getPlatformLedger = () => client.get("/platform-revenue/ledger");
export const getPlatformWithdrawals = () => client.get("/platform-revenue/withdrawals");
export const requestPlatformWithdrawal = (payload) => client.post("/platform-revenue/withdrawals", payload);
export const approvePlatformWithdrawal = (id) => client.put(`/platform-revenue/withdrawals/${id}/approve`);

export const getPromotionsBudget = () => client.get("/promotions/budget");
export const depositPromotionsBudget = (payload) => client.post("/promotions/budget/deposit", payload);
export const verifyPromotionsFunding = (reference) => client.get(`/promotions/budget/funding/verify/${encodeURIComponent(reference)}`);
export const getAllCoupons = () => client.get("/coupons");
export const createCoupon = (payload) => client.post("/coupons", payload);
export const toggleCoupon = (id) => client.put(`/coupons/${id}/toggle`);
