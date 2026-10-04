import client from "./client";

// Analytics
export const getAnalytics = () => client.get("/admin/analytics");

// Vendors
export const getAdminVendors = (status) =>
  client.get("/admin/vendors", { params: status ? { status } : {} });
export const approveVendor = (id) => client.put(`/admin/vendors/${id}/approve`);
export const rejectVendor = (id, reason) =>
  client.put(`/admin/vendors/${id}/reject`, { reason });
export const suspendVendor = (id, reason) =>
  client.put(`/admin/vendors/${id}/suspend`, { reason });
export const reactivateVendor = (id) => client.put(`/admin/vendors/${id}/reactivate`);

// Riders
export const getAdminRiders = (status) =>
  client.get("/admin/riders", { params: status ? { status } : {} });
export const approveRider = (id, payload = {}) =>
  client.put(`/admin/riders/${id}/approve`, payload);
export const rejectRider = (id, reason) =>
  client.put(`/admin/riders/${id}/reject`, { reason });
export const strikeRider = (id) => client.put(`/admin/riders/${id}/strike`);

// Orders + Disputes
export const getAdminOrders = (status) =>
  client.get("/admin/orders", { params: status ? { status } : {} });
export const getAdminDisputes = () => client.get("/admin/disputes");
export const resolveDispute = (id, payload) =>
  client.put(`/admin/disputes/${id}/resolve`, payload);

// Cancellation refunds — sub-orders cancelled after payment where the
// automatic refund never went through and needs a human to retry it.
export const getStuckCancellationRefunds = () => client.get("/admin/cancellation-refunds");
export const retryCancellationRefund = (subOrderId) =>
  client.post(`/admin/cancellation-refunds/${subOrderId}/retry`);

// Support
export const getAdminTickets = () => client.get("/admin/support-tickets");
export const replyToAdminTicket = (id, message) =>
  client.put(`/admin/support-tickets/${id}/reply`, { message });

// Monitoring
export const getAlerts = (params) => client.get("/monitoring/alerts", { params });
export const resolveAlert = (id) => client.put(`/monitoring/alerts/${id}/resolve`);
export const getStuckOrders = () => client.get("/monitoring/stuck-orders");
export const getFailedWebhooks = () => client.get("/monitoring/failed-webhooks");
export const logManualIntervention = (payload) => client.post("/monitoring/manual-intervention", payload);

// Financial integrity tools — read/trigger only, never move money
// automatically. reconcileBalances compares each user's balances-table
// total against the sum of their actual ledger entries and flags any
// drift; reconcilePayments manually forces the same stale-payment
// check pg_cron runs on a schedule, instead of waiting for the next run.
export const reconcileBalances = () => client.get("/admin/reconcile-balances");
export const reconcilePayments = () => client.post("/admin/reconcile-payments");
export const broadcastNotification = (payload) => client.post("/admin/notifications/broadcast", payload);
export const createNotice = (payload) => client.post("/admin/notices", payload);
export const getAllNotices = () => client.get("/admin/notices");
export const deactivateNotice = (id) => client.put(`/admin/notices/${id}/deactivate`);

export const getReferralSettings = () => client.get("/admin/referral-settings");
export const updateReferralSettings = (payload) => client.put("/admin/referral-settings", payload);
export const getReferralMilestones = (rewardSent) =>
  client.get("/admin/referral-milestones", { params: rewardSent !== undefined ? { reward_sent: rewardSent } : {} });
export const sendReferralReward = (id, payload) => client.post(`/admin/referral-milestones/${id}/reward`, payload);

// Pilot
export const getPilotSettings = () => client.get("/pilot/settings");
export const updatePilotSettings = (payload) =>
  client.put("/pilot/admin/settings", payload);
export const generateInviteCode = (payload) =>
  client.post("/pilot/admin/invite-codes/generate", payload);

// Review moderation
export const getAllReviewsAdmin = (flagged) =>
  client.get("/admin/reviews", { params: flagged ? { flagged: "true" } : {} });
export const flagReview = (id) => client.put(`/admin/reviews/${id}/flag`);
export const removeReview = (id, reason) => client.put(`/admin/reviews/${id}/remove`, { reason });
export const restoreReview = (id) => client.put(`/admin/reviews/${id}/restore`);
