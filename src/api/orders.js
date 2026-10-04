/**
 * ORDERS API
 * Backend: controllers/orderController.js + subOrderController.js
 * IMPORTANT: Use sub-orders for ALL order creation and management
 */
import client from "./client";
import { v4 as uuidv4 } from "uuid";

// POST /api/sub-orders/create  [customer]
// payload: { items[], delivery_type, delivery_address, delivery_lat, delivery_lng, idempotency_key }
// response: { success, order: { id, subtotal, platform_fee, delivery_fee, total, vendor_count, sub_order_count, status } }
export const createOrder = (payload) =>
  client.post("/sub-orders/create", {
    ...payload,
    idempotency_key: payload.idempotency_key || uuidv4(),
  });

// GET /api/orders  [customer/vendor/rider]
// response: { success, orders[] }
export const getMyOrders = () => client.get("/orders");

// GET /api/orders/:id  [customer]
// response: { success, order: { ...order, sub_orders[] } }
export const getOrderById = (id) => client.get(`/orders/${id}`);

// GET /api/sub-orders/order/:orderId  [customer]
// response: { success, order: { ...order, sub_orders[] } }
export const getOrderWithSubOrders = (orderId) => client.get(`/sub-orders/order/${orderId}`);

// GET /api/sub-orders/vendor  [vendor]
export const getVendorSubOrders = () => client.get("/sub-orders/vendor");

// GET /api/sub-orders/rider  [rider]
export const getRiderSubOrders = () => client.get("/sub-orders/rider");

// GET /api/riders/available-orders  [rider]
export const getAvailableOrders = () => client.get("/riders/available-orders");

// POST /api/sub-orders/:subOrderId/accept  [rider]
export const acceptOrder = (subOrderId) => client.post(`/sub-orders/${subOrderId}/accept`);

// PUT /api/sub-orders/:subOrderId/status  [vendor/rider/admin]
// payload: { status, delivery_code? } — must be uppercase WAITING_RIDER, PICKED_UP, DELIVERING, DELIVERED etc
// delivery_code is required when a rider marks a real delivery DELIVERED.
export const updateSubOrderStatus = (subOrderId, status, deliveryCode) =>
  client.put(`/sub-orders/${subOrderId}/status`, {
    status,
    ...(deliveryCode ? { delivery_code: deliveryCode } : {}),
  });

// POST /api/sub-orders/:subOrderId/cancel  [customer]
export const cancelSubOrder = (subOrderId) => client.post(`/sub-orders/${subOrderId}/cancel`);
