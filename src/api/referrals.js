/**
 * REFERRALS API
 * Backend: controllers/customerReferralController.js
 * Routes:  /api/referrals/*
 */
import client from "./client";

// GET /api/referrals/me
// response: { success, total_credited, total_pending, threshold, progress_toward_next, rewards_enabled }
export const getMyReferralStats = () => client.get("/referrals/me");
