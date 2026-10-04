import { create } from "zustand";

const CART_KEY = "cm_cart";

const loadCart = () => {
  try { return JSON.parse(sessionStorage.getItem(CART_KEY)) || []; } catch { return []; }
};

const saveCart = (items) => {
  sessionStorage.setItem(CART_KEY, JSON.stringify(items));
};

export const useCartStore = create((set, get) => ({
  items: loadCart(),

  // The Fidelx pilot is one-store-per-cart (see addItem below) — every
  // item in the cart always shares one vendor_id once it's non-empty.
  getCartVendorId: () => get().items[0]?.vendor_id || null,

  // item shape: { product_id, variant_id, name, price, image, vendor_id, vendor_name, quantity }
  // Returns { ok: true } on success, or { ok: false, conflictVendorName }
  // if the cart already holds items from a different store — the
  // caller (UI) is responsible for asking the customer whether to
  // clear the cart and switch, then calling replaceCartWithItem.
  // This mirrors the backend's own one-store-per-order enforcement in
  // subOrderController.createOrderWithSubOrders — the frontend check
  // is a UX convenience, not the actual guarantee.
  addItem: (item) => {
    const items = get().items;
    const cartVendorId = items[0]?.vendor_id;

    if (cartVendorId && cartVendorId !== item.vendor_id) {
      return { ok: false, conflictVendorName: items[0]?.vendor_name };
    }

    const key = `${item.product_id}_${item.variant_id || ""}`;
    const existing = items.find(
      (i) => `${i.product_id}_${i.variant_id || ""}` === key
    );
    const next = existing
      ? items.map((i) =>
          `${i.product_id}_${i.variant_id || ""}` === key
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      : [...items, { ...item, quantity: item.quantity || 1 }];
    saveCart(next);
    set({ items: next });
    return { ok: true };
  },

  // Clears the existing cart (a different store's items) and starts a
  // fresh one with this item — used after the customer confirms the
  // "start a new cart to shop from this store?" prompt.
  replaceCartWithItem: (item) => {
    const next = [{ ...item, quantity: item.quantity || 1 }];
    saveCart(next);
    set({ items: next });
  },

  removeItem: (product_id, variant_id) => {
    const key = `${product_id}_${variant_id || ""}`;
    const next = get().items.filter(
      (i) => `${i.product_id}_${i.variant_id || ""}` !== key
    );
    saveCart(next);
    set({ items: next });
  },

  updateQuantity: (product_id, variant_id, quantity) => {
    const key = `${product_id}_${variant_id || ""}`;
    if (quantity <= 0) { get().removeItem(product_id, variant_id); return; }
    const next = get().items.map((i) =>
      `${i.product_id}_${i.variant_id || ""}` === key ? { ...i, quantity } : i
    );
    saveCart(next);
    set({ items: next });
  },

  clearCart: () => {
    sessionStorage.removeItem(CART_KEY);
    set({ items: [] });
  },

  // Reconciles cart quantities against live stock (fetched by the caller
  // just before this runs). Cart items are only ever updated by the
  // customer's own actions, so a stale tab can sit for hours with stock
  // numbers that no longer match reality — checkout still correctly
  // rejects an oversell, but the customer wouldn't see why until they hit
  // "place order". Called from CartPage/CheckoutPage on mount. Returns a
  // summary so the caller can show what changed.
  syncWithStock: (liveProductsById) => {
    const items = get().items;
    const removed = [];
    const reduced = [];

    const next = items
      .map((item) => {
        const live = liveProductsById[item.product_id];
        if (!live) return item; // couldn't fetch it — leave as-is, checkout will still catch a real problem
        const liveStock = item.variant_id
          ? (live.variants || []).find((v) => v.id === item.variant_id)?.stock_quantity ?? 0
          : live.stock_quantity ?? 0;

        if (liveStock <= 0) {
          removed.push(item.name);
          return null;
        }
        if (item.quantity > liveStock) {
          reduced.push({ name: item.name, from: item.quantity, to: liveStock });
          return { ...item, quantity: liveStock };
        }
        return item;
      })
      .filter(Boolean);

    saveCart(next);
    set({ items: next });
    return { removed, reduced, changed: removed.length > 0 || reduced.length > 0 };
  },

  // Derived
  totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
  subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),

  // Group items by vendor for sub-order creation
  itemsByVendor: () => {
    const groups = {};
    for (const item of get().items) {
      if (!groups[item.vendor_id]) {
        groups[item.vendor_id] = { vendor_id: item.vendor_id, vendor_name: item.vendor_name, items: [] };
      }
      groups[item.vendor_id].items.push(item);
    }
    return Object.values(groups);
  },

  // Format for POST /api/sub-orders/create
  toOrderPayload: () =>
    get().items.map(({ product_id, variant_id, quantity }) => ({
      product_id,
      ...(variant_id ? { variant_id } : {}),
      quantity,
    })),
}));
