// Format naira
export const formatNaira = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

// Format date
export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

export const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// Order status display
const STATUS_MAP = {
  PENDING_PAYMENT:   { label: "Awaiting Payment",  color: "text-yellow-400", bg: "bg-yellow-400/10" },
  PAYMENT_CONFIRMED: { label: "Payment Confirmed",  color: "text-teal",       bg: "bg-teal/10" },
  PREPARING:         { label: "Preparing",          color: "text-yellow-400", bg: "bg-yellow-400/10" },
  READY_FOR_PICKUP:  { label: "Ready for Pickup",     color: "text-teal",       bg: "bg-teal/10" },
  WAITING_RIDER:     { label: "Finding Rider",      color: "text-blue-accent", bg: "bg-blue-accent/10" },
  RIDER_ASSIGNED:    { label: "Rider Assigned",     color: "text-blue-accent", bg: "bg-blue-accent/10" },
  PICKED_UP:         { label: "Picked Up",          color: "text-teal",       bg: "bg-teal/10" },
  DELIVERING:        { label: "On the Way",         color: "text-teal",       bg: "bg-teal/10" },
  DELIVERED:         { label: "Delivered",          color: "text-green-400",  bg: "bg-green-400/10" },
  DISPUTED:          { label: "Disputed",           color: "text-red-400",    bg: "bg-red-400/10" },
  REFUNDED:          { label: "Refunded",           color: "text-slate-muted", bg: "bg-slate-muted/10" },
  CANCELLED:         { label: "Cancelled",          color: "text-slate-muted", bg: "bg-slate-muted/10" },
};

export const getStatusDisplay = (status) =>
  STATUS_MAP[status] || { label: status, color: "text-slate-muted", bg: "bg-slate-muted/10" };

// Vendor availability
const AVAIL_MAP = {
  OPEN:                  { label: "Open",             color: "text-green-400" },
  BUSY:                  { label: "Busy",             color: "text-yellow-400" },
  CLOSED:                { label: "Closed",           color: "text-red-400" },
  TEMPORARILY_UNAVAILABLE: { label: "Unavailable",    color: "text-red-400" },
};

export const getAvailabilityDisplay = (status) =>
  AVAIL_MAP[status] || { label: status, color: "text-slate-muted" };

// Truncate text
export const truncate = (str, n = 60) =>
  str?.length > n ? str.slice(0, n) + "…" : str;

// Validate Nigerian phone number
export const isValidNigerianPhone = (phone) =>
  /^(0|\+234)[789]\d{9}$/.test(phone.replace(/\s/g, ""));

// Role → home route
export const roleHomePath = (role) => ({
  customer: "/customer/home",
  vendor:   "/vendor/dashboard",
  rider:    "/rider/dashboard",
  admin:    "/admin/dashboard",
}[role] || "/login");
