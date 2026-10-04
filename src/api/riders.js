/**
 * RIDERS API
 * Backend: controllers/riderController.js
 * Routes:  /api/riders/*
 */
import client from "./client";

// POST /api/riders/register  [rider]
// payload: { nin, phone, vehicle_type }
// response includes { verification: { verified, message } } — the result
// comes back synchronously since Prembly is called during registration
export const registerRider = (payload) => client.post("/riders/register", payload);

// POST /api/riders/verify-nin/retry  [rider]
// payload: { nin } — omit to retry verification with the NIN already on file
export const retryNinVerification = (nin) =>
  client.post("/riders/verify-nin/retry", nin ? { nin } : {});

// GET /api/riders/me  [rider]
export const getMyRiderProfile = () => client.get("/riders/me");

// GET /api/riders/me/earnings  [rider]
// response: { success, available_balance, pending_balance, total_earned, total_withdrawn, sub_orders[] }
export const getRiderEarnings = () => client.get("/riders/me/earnings");

// PUT /api/riders/availability  [rider]
// payload: { is_active: true | false }
export const toggleAvailability = (is_active) =>
  client.put("/riders/availability", { is_active });

// PUT /api/riders/location  [rider]
// payload: { lat, lng }
export const updateLocation = (lat, lng) =>
  client.put("/riders/location", { lat, lng });
