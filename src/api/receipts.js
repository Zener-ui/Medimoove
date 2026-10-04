/**
 * RECEIPTS API
 * IMPORTANT: GET /api/receipts/:id returns text/html — open in iframe or new tab
 * GET /api/receipts/:id/pdf returns a downloadable PDF (same design, rendered via Puppeteer)
 */
import client from "./client";

export const getMyReceipts = () => client.get("/receipts");

// The order/withdrawal/refund's own ID isn't the same as the
// receipt's internal receipt_id — use this to resolve one to the
// other before building an HTML/PDF receipt URL.
export const getReceiptByReference = (referenceId) =>
  client.get(`/receipts/by-reference/${referenceId}`);

// Returns text/html — do not parse
// Authenticated receipt requests. Do not open these URLs directly with
// window.open()/an <a href>: browser navigation does not receive the JWT
// injected by src/api/client.js.
export const getReceiptHtml = (receiptId) =>
  client.get(`/receipts/${receiptId}`, { responseType: "text" });

export const getReceiptPdf = (receiptId) =>
  client.get(`/receipts/${receiptId}/pdf`, { responseType: "blob" });
