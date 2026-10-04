/**
 * VENDORS API
 * Backend: controllers/vendorController.js
 * Routes:  /api/vendors/*
 */
import client from "./client";

// GET /api/vendors/:id  [public]
// response: { success, vendor: { ...vendor, users: { full_name, email } } }
export const getVendor = (id) => client.get(`/vendors/${id}`);

// GET /api/vendors/me  [vendor]
export const getMyVendorProfile = () => client.get("/vendors/me");

// POST /api/vendors/register  [vendor]
// payload: { business_name, category, location, address, phone, whatsapp?, cac_number?, region_id? }
export const registerVendor = (payload) => client.post("/vendors/register", payload);

// PUT /api/vendors/me  [vendor]
// payload: { business_name, category, location, address, phone, whatsapp }
export const updateVendorProfile = (payload) => client.put("/vendors/me", payload);

// GET /api/vendors/me/earnings  [vendor]
// response: { success, available_balance, pending_balance, total_earned, total_withdrawn, sub_orders[] }
export const getVendorEarnings = () => client.get("/vendors/me/earnings");
export const getReferralStats = () => client.get("/vendors/me/referrals");

// PUT /api/vendors/me/availability  [vendor]
// payload: { availability_status, unavailable_until?, unavailable_reason? }
// availability_status: OPEN | BUSY | CLOSED | TEMPORARILY_UNAVAILABLE
export const updateAvailability = (payload) => client.put("/vendors/me/availability", payload);
