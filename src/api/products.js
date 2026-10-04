/**
 * PRODUCTS API
 * Backend: controllers/productController.js
 * Routes:  /api/products/*
 */
import client from "./client";

// GET /api/products/mine  [vendor]
// Returns the vendor's FULL catalog — including out-of-stock and
// paused items — unlike the public listing below, which only shows
// available + in-stock products. Pass { include_deleted: true } to
// also see soft-deleted products.
export const getMyProducts = (params) => client.get("/products/mine", { params });

// GET /api/products/:id
// response: { success, product: { ...product, variants[] } }
export const getProduct = (id) => client.get(`/products/${id}`);

// POST /api/products  [vendor]
// payload: { name, description, price, category, images[], stock_quantity, variants[] }
export const createProduct = (payload) => client.post("/products", payload);

// PUT /api/products/:id  [vendor]
export const updateProduct = (id, payload) => client.put(`/products/${id}`, payload);

// DELETE /api/products/:id  [vendor] — soft delete
export const deleteProduct = (id) => client.delete(`/products/${id}`);
