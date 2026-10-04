/**
 * AUTH API
 * Backend: controllers/authController.js
 * Routes:  /api/auth/*
 */
import client from "./client";

// POST /api/auth/register
// payload: { full_name, email, phone, password, role, invite_code? }
export const register = (payload) => client.post("/auth/register", payload);

// POST /api/auth/login
// payload: { identifier, password } — identifier can be email OR phone
export const login = (payload) => client.post("/auth/login", payload);

// GET /api/auth/me
// response: { success, user: { id, email, phone, role, full_name } }
export const getMe = () => client.get("/auth/me");

// PUT /api/auth/change-password
// payload: { current_password, new_password }
export const changePassword = (payload) => client.put("/auth/change-password", payload);

// POST /api/auth/forgot-password
// payload: { email }
// Always returns a generic success message, regardless of whether the email exists.
export const forgotPassword = (payload) => client.post("/auth/forgot-password", payload);

// POST /api/auth/reset-password
// payload: { token, new_password }
export const resetPassword = (payload) => client.post("/auth/reset-password", payload);
