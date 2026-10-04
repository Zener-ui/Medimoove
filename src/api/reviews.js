/**
 * REVIEWS API
 * Backend: controllers/reviewController.js
 * IMPORTANT: reviews use sub_order_id — NOT order_id
 */
import client from "./client";

// POST /api/reviews  [customer]
// payload: { sub_order_id, vendor_rating, rider_rating, title, comment }
export const createReview = (payload) => client.post("/reviews", payload);

// PUT /api/reviews/:id  [customer, own review only]
export const updateReview = (id, payload) => client.put(`/reviews/${id}`, payload);

// POST /api/reviews/:id/helpful
export const markReviewHelpful = (id) => client.post(`/reviews/${id}/helpful`);

// PUT /api/reviews/:id/reply  [vendor, own store only]
export const replyToReview = (id, reply) => client.put(`/reviews/${id}/reply`, { reply });

// GET /api/reviews/vendor/me  [vendor]
export const getMyVendorReviews = (params) => client.get("/reviews/vendor/me", { params });

// GET /api/reviews/vendor/:vendorId
// params: { page, limit, sort: 'recent'|'highest'|'lowest', with_photos: 'true' }
export const getVendorReviews = (vendorId, params) =>
  client.get(`/reviews/vendor/${vendorId}`, { params });

// GET /api/reviews/vendor/:vendorId/summary
// response: { summary: { average, total_reviews, breakdown: {5:n,4:n,...}, completed_orders } }
export const getVendorRatingSummary = (vendorId) =>
  client.get(`/reviews/vendor/${vendorId}/summary`);
