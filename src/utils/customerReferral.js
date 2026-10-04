// Customer referral links go straight to /register?ref=<referrer-id>
// (unlike the vendor program, which lands on a storefront to browse
// first) — so capture happens right on the register page itself, but
// still persisted in case someone reads Terms or bounces around
// before actually finishing signup.
const REF_KEY = "medimoove_referred_customer_id";

export const setReferredCustomer = (customerId) => {
  if (!customerId) return;
  try {
    localStorage.setItem(REF_KEY, customerId);
  } catch {
    // Storage can fail — referral attribution is a nice-to-have, never
    // worth breaking the signup page over.
  }
};

export const getReferredCustomer = () => {
  try {
    return localStorage.getItem(REF_KEY) || null;
  } catch {
    return null;
  }
};

export const clearReferredCustomer = () => {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // no-op
  }
};
