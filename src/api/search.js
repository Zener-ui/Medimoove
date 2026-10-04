/**
 * SEARCH API
 * Backend: controllers/searchController.js
 * Routes:  /api/search/*
 */
import client from "./client";

// GET /api/search/products
// params: { q, category, category_id, min_price, max_price, sort, page, limit, vendor_id, featured, region_id }
// response: { success, products[], pagination: { page, limit, total, pages, has_next, has_prev }, empty_state }
export const searchProducts = (params) => client.get("/search/products", { params });

// GET /api/search/vendors
// params: { q, category, region_id, featured, sort, page, limit }
// response: { success, vendors[], pagination }
export const searchVendors = (params) => client.get("/search/vendors", { params });

// GET /api/search/categories
// response: { success, categories: [{ id, name, slug, icon }] }
export const getCategories = () => client.get("/search/categories");

// GET /api/search/homepage
// params: { region_id? }
// response: { success, categories: [{ id, name, slug, icon, vendors[] }], featured_products[] }
export const getHomepageData = (params) => client.get("/search/homepage", { params });
