/**
 * POLICIES API
 * Backend: controllers/pilotAndOpsController.js
 * Routes:  /api/policies/*
 */
import client from "./client";

// GET /api/policies/:type  [public]
// response: { success, policy: { id, type, title, content, version, ... } }
// GET /api/policies  [public]
// response: { success, policies: [{ id, type, title, version, published_at, updated_at }] }
export const getAllPolicies = () => client.get("/policies");

// PUT /api/policies/admin/:type  [admin]
// payload: { title, content, version }
export const updatePolicyAdmin = (type, payload) => client.put(`/policies/admin/${type}`, payload);

export const getPolicyByType = (type) => client.get(`/policies/${type}`);

// GET /api/policies/:type/status  [authenticated]
// response: { success, accepted: boolean }
export const getPolicyAcceptanceStatus = (type) => client.get(`/policies/${type}/status`);

// POST /api/policies/accept  [authenticated]
// payload: { policy_id, policy_version }
export const acceptPolicy = (payload) => client.post("/policies/accept", payload);
