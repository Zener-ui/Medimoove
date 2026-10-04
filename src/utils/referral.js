// Remembers which vendor's shared storefront link a visitor first
// arrived through, so that if they later create an account, the
// vendor gets credit for the referral. Deliberately simple:
// last-touch attribution (whichever vendor's page they most recently
// browsed wins), stored in localStorage so it survives the trip
// through /login or /register and back.
const REF_KEY = "medimoove_referred_vendor_id";

export const setReferredVendor = (vendorId) => {
  if (!vendorId) return;
  try {
    localStorage.setItem(REF_KEY, vendorId);
  } catch {
    // Storage can fail (private browsing, quota, etc.) — referral
    // attribution is a nice-to-have, never worth breaking the page over.
  }
};

export const getReferredVendor = () => {
  try {
    return localStorage.getItem(REF_KEY) || null;
  } catch {
    return null;
  }
};

export const clearReferredVendor = () => {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // no-op
  }
};
