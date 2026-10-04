// Support/admin WhatsApp numbers used for the vendor/rider
// verification contact button. Medimoove Verification Team numbers.
const VERIFICATION_NUMBERS = ["2348134195646", "2348143664378"];

/**
 * Builds a wa.me link pre-filled with a message matching the
 * verification-team template, using the applicant's name and
 * application/vendor(or rider) ID where available. Falls back
 * gracefully if either is missing rather than sending a broken
 * template.
 */
export function buildVerificationWhatsAppLink({ role, name, applicationId, numberIndex = 0 }) {
  const number = VERIFICATION_NUMBERS[numberIndex] || VERIFICATION_NUMBERS[0];

  const namePart = name || "[Name]";
  const idPart = applicationId || "[ID]";

  const text =
    role === "rider"
      ? `Hello Medimoove Verification Team, I have registered as a rider and would like to complete my verification. My name is ${namePart} and my application/rider ID is ${idPart}.`
      : `Hello Medimoove Verification Team, I have registered as a vendor and would like to complete my verification. My name is ${namePart} and my application/vendor ID is ${idPart}.`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const VERIFICATION_WHATSAPP_NUMBERS = VERIFICATION_NUMBERS;
export const hasSupportWhatsApp = () => true;

// The official Fidelx WhatsApp channel — a broadcast channel, not a
// support number, so this is a completely separate concern from
// VERIFICATION_NUMBERS above (which are for the vendor/rider
// verification chat flow).
export const FIDELX_WHATSAPP_CHANNEL_LINK = "https://whatsapp.com/channel/0029Vb9DGaE5a246WXVsoQ2k";

// ============================================================
// WhatsApp channel popup — recurring, not a one-time dismiss like
// OnboardingTour/PushPermissionPrompt. There's no API to actually
// verify someone joined a WhatsApp channel, so "joined" here means
// "tapped the join button" — a self-report, same limitation as any
// app doing this. Before that tap: show on every app open. After:
// keep showing, just much less often, rather than stopping outright —
// per the actual ask, this is meant to keep nudging non-openers and
// gently remind people who joined a while back, not just fire once.
// ============================================================
const CHANNEL_STORAGE_KEY = (userId) => `cm_whatsapp_channel_${userId}`;
const REDUCED_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days, once joined

const readChannelState = (userId) => {
  try {
    const raw = localStorage.getItem(CHANNEL_STORAGE_KEY(userId));
    return raw ? JSON.parse(raw) : { joined: false, lastShownAt: 0 };
  } catch {
    return { joined: false, lastShownAt: 0 };
  }
};

const writeChannelState = (userId, state) => {
  try {
    localStorage.setItem(CHANNEL_STORAGE_KEY(userId), JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota) — this is a nice-to-have
    // engagement nudge, never worth breaking the page over.
  }
};

export const shouldShowWhatsAppChannelPrompt = (userId) => {
  if (!userId) return false;
  const state = readChannelState(userId);
  if (!state.joined) return true; // every app open, until they actually tap join
  return Date.now() - (state.lastShownAt || 0) >= REDUCED_INTERVAL_MS;
};

export const recordWhatsAppChannelPromptShown = (userId) => {
  const state = readChannelState(userId);
  writeChannelState(userId, { ...state, lastShownAt: Date.now() });
};

export const markWhatsAppChannelJoined = (userId) => {
  writeChannelState(userId, { joined: true, lastShownAt: Date.now() });
};
