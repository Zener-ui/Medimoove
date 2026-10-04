/**
 * PAYMENTS API
 * Backend: controllers/paymentController.js
 * Routes:  /api/payments/*
 *
 * Flow:
 * 1. createOrder() → get order_id
 * 2. initializePayment(order_id) → get authorization_url + reference
 * 3. Redirect to authorization_url (Paystack)
 * 4. Paystack redirects to /payment/verify?reference=xxx
 * 5. verifyPayment(reference) → confirm success
 */
import client from "./client";

// POST /api/payments/initialize
// payload: { order_id }
// response: { success, authorization_url, reference }
export const initializePayment = (order_id) =>
  client.post("/payments/initialize", { order_id });

// GET /api/payments/verify/:reference
// response: { success, message, order_id, already_processed? }
export const verifyPayment = (reference) =>
  client.get(`/payments/verify/${reference}`);
