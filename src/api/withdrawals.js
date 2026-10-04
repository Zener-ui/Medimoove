/**
 * WITHDRAWALS API
 * Backend: controllers/withdrawalController.js
 * Routes:  /api/withdrawals/*
 */
import client from "./client";

// GET /api/withdrawals/banks
export const getBanks = () => client.get("/withdrawals/banks");

// POST /api/withdrawals/resolve-account
export const resolveAccount = (payload) => client.post("/withdrawals/resolve-account", payload);

// GET /api/withdrawals/fee-preview?amount=N
// response: { success, breakdown: { gross_amount, withdrawal_fee, net_payout, fee_percentage, fee_was_capped } }
export const getFeePreview = (amount) =>
  client.get("/withdrawals/fee-preview", { params: { amount } });

// GET /api/withdrawals/my
// response: { success, withdrawals[] }
export const getMyWithdrawals = () => client.get("/withdrawals/my");

// GET /api/withdrawals/pin/status
// response: { success, pin_set: boolean }
export const getPinStatus = () => client.get("/withdrawals/pin/status");

// POST /api/withdrawals/pin/set
// First-time setup: { pin }. Changing an existing PIN: { pin, current_pin }.
export const setWithdrawalPin = (payload) => client.post("/withdrawals/pin/set", payload);

// POST /api/withdrawals/vendor  [vendor]
// payload: { amount, bank_account, bank_code, bank_name, account_name, pin }
export const requestVendorWithdrawal = (payload) =>
  client.post("/withdrawals/vendor", payload);

// POST /api/withdrawals/rider  [rider]
// payload: { amount, bank_account, bank_code, bank_name, account_name, pin }
export const requestRiderWithdrawal = (payload) =>
  client.post("/withdrawals/rider", payload);

// Admin
export const getAllWithdrawals = (status) =>
  client.get("/withdrawals/admin/all", { params: status ? { status } : {} });

export const approveWithdrawal = (id, proof_of_payout) =>
  client.put(`/withdrawals/admin/${id}/approve`, { proof_of_payout });

export const rejectWithdrawal = (id, reason) =>
  client.put(`/withdrawals/admin/${id}/reject`, { reason });

// PUT /api/withdrawals/admin/fee-settings  [admin]
// payload: { withdrawal_fee_percentage, withdrawal_fee_cap }
// Note: this controls the fee vendors/riders pay to withdraw their
// balance — separate from platform_fee_percentage (the cut taken on
// each sale), which has no admin-write endpoint yet.
export const updateWithdrawalFeeSettings = (payload) =>
  client.put("/withdrawals/admin/fee-settings", payload);
