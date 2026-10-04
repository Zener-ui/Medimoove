// Unlike the WhatsApp channel popup (which recurs on a schedule),
// each urgent notice is its own one-time thing: show it until the
// user dismisses it, then never show that specific notice again —
// but a NEW notice created later has its own id and shows fresh.
const DISMISSED_KEY = (userId) => `cm_dismissed_notices_${userId}`;

const readDismissed = (userId) => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getUndismissedNotices = (userId, notices) => {
  if (!userId) return [];
  const dismissed = new Set(readDismissed(userId));
  return (notices || []).filter((n) => !dismissed.has(n.id));
};

export const markNoticeDismissed = (userId, noticeId) => {
  try {
    const dismissed = readDismissed(userId);
    if (!dismissed.includes(noticeId)) {
      dismissed.push(noticeId);
      localStorage.setItem(DISMISSED_KEY(userId), JSON.stringify(dismissed));
    }
  } catch {
    // Storage can fail — worst case the notice shows again next visit,
    // not worth breaking the page over.
  }
};
