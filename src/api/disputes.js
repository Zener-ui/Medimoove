/**
 * DISPUTES API
 * Backend: controllers/disputeController.js
 * Routes:  /api/disputes/*
 */
import client from "./client";

// POST /api/disputes
// payload: { order_id, reason, evidence_urls: string[] }
// Rules enforced server-side: order must be DELIVERED, caller must own
// it, must be within 24 hours of the last sub-order's delivered_at,
// and at least one evidence URL is required.
export const createDispute = (payload) => client.post("/disputes", payload);

// GET /api/disputes/my
export const getMyDisputes = () => client.get("/disputes/my");

// PUT /api/disputes/:id/appeal
// payload: { additional_evidence }
export const appealDispute = (id, payload) => client.put(`/disputes/${id}/appeal`, payload);
