import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/authStore";
import OnboardingTour, { hasSeenOnboarding } from "@/components/common/OnboardingTour";
import PushPermissionPrompt, { hasSeenPushPrompt } from "@/components/common/PushPermissionPrompt";
import WhatsAppChannelPrompt from "@/components/common/WhatsAppChannelPrompt";
import UrgentNoticePopup from "@/components/common/UrgentNoticePopup";
import { shouldShowWhatsAppChannelPrompt } from "@/utils/whatsapp";
import Modal from "@/components/common/Modal";
import { getActiveNotices } from "@/api/notifications";
import { getUndismissedNotices, markNoticeDismissed } from "@/utils/urgentNotices";

/**
 * AppShell — the one responsive navigation pattern for the whole app.
 *
 * Mobile (< md): content fills the viewport, a fixed bottom tab bar
 * provides navigation — the familiar delivery-app pattern.
 *
 * Desktop (>= md): a fixed left sidebar carries navigation and the
 * wordmark; content gets real breathing room instead of being stranded
 * in a narrow column in the middle of a wide screen.
 *
 * navItems: [{ to, icon: LucideComponent, label, badge? }]
 * subtitle: small text under the wordmark in the desktop sidebar (e.g. "Admin Panel")
 * contentMaxWidth: tailwind max-w-* class for the content column (default max-w-3xl)
 *
 * Logout lives here rather than on each role's own settings page —
 * vendor, rider, and admin all render through this one shell, so a
 * single button here guarantees it's reachable everywhere instead of
 * depending on every role happening to have (and someone remembering
 * to build) its own settings page.
 */
export default function AppShell({ navItems, subtitle, contentMaxWidth = "max-w-3xl" }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  // Urgent admin notices take priority over everything else below —
  // that's the whole point of "urgent." null means "haven't checked
  // yet" (fetch in flight); the three prompts below all explicitly
  // wait for urgentNoticesClear (checked AND empty) rather than just
  // chaining off each other's state, so none of them can race ahead
  // of an in-flight notices fetch they have no visibility into.
  const [urgentQueue, setUrgentQueue] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    getActiveNotices()
      .then((res) => setUrgentQueue(getUndismissedNotices(user.id, res.notices)))
      .catch(() => setUrgentQueue([])); // fail open — a failed fetch shouldn't block every other prompt forever
  }, [user?.id]);
  const urgentNoticesClear = urgentQueue !== null && urgentQueue.length === 0;
  const dismissCurrentNotice = () => {
    const [current, ...rest] = urgentQueue;
    markNoticeDismissed(user.id, current.id);
    setUrgentQueue(rest);
  };

  // First-run walkthrough — shown once per account, mounted here so
  // every role (customer/vendor/rider/admin) gets it automatically
  // from the one shared shell instead of needing it wired into each
  // role's own layout separately.
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (user?.id && urgentNoticesClear && !hasSeenOnboarding(user.id)) setShowOnboarding(true);
  }, [user?.id, urgentNoticesClear]);

  // Push permission prompt — shown once per account, and only after
  // the onboarding tour has already been dismissed, so a brand-new
  // user isn't hit with two overlays back to back.
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  useEffect(() => {
    if (user?.id && urgentNoticesClear && !showOnboarding && !hasSeenPushPrompt(user.id)) setShowPushPrompt(true);
  }, [user?.id, urgentNoticesClear, showOnboarding]);

  // WhatsApp channel popup — unlike the two above, this ISN'T a
  // one-time dismiss. It queues after both of them so a brand-new
  // user doesn't get three overlays stacked at once, then recurs on
  // its own schedule from then on (every open until joined, then
  // occasionally after — see shouldShowWhatsAppChannelPrompt).
  // Skipped for admin — this is a customer/vendor/rider engagement
  // channel, not something internal staff need nudged about.
  const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(false);
  useEffect(() => {
    if (
      user?.id &&
      urgentNoticesClear &&
      user.role !== "admin" &&
      !showOnboarding &&
      !showPushPrompt &&
      shouldShowWhatsAppChannelPrompt(user.id)
    ) {
      setShowWhatsAppPrompt(true);
    }
  }, [user?.id, urgentNoticesClear, user?.role, showOnboarding, showPushPrompt]);

  // The mobile bottom bar only has room for ~5 icons + logout. Any
  // role whose nav grows past that (admin currently has 12 sections)
  // used to just lose everything past the 5th item — not hidden
  // behind anything, genuinely unreachable from a phone. When there's
  // overflow, the 5th slot becomes a "More" button opening the rest
  // in a sheet instead of silently dropping them.
  const [showMore, setShowMore] = useState(false);
  const hasOverflow = navItems.length > 5;
  const mobileVisibleItems = hasOverflow ? navItems.slice(0, 4) : navItems;
  const mobileOverflowItems = hasOverflow ? navItems.slice(4) : [];
  const overflowBadgeTotal = mobileOverflowItems.reduce((sum, i) => sum + (i.badge || 0), 0);

  return (
    <div className="min-h-screen bg-navy md:flex">
      {urgentQueue && urgentQueue.length > 0 && (
        <UrgentNoticePopup notice={urgentQueue[0]} queueLength={urgentQueue.length} onDismiss={dismissCurrentNotice} />
      )}
      {showOnboarding && <OnboardingTour onDone={() => setShowOnboarding(false)} />}
      {showPushPrompt && <PushPermissionPrompt userId={user?.id} onDone={() => setShowPushPrompt(false)} />}
      {showWhatsAppPrompt && <WhatsAppChannelPrompt userId={user?.id} onDone={() => setShowWhatsAppPrompt(false)} />}
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-surface-border fixed h-full z-30">
        <div className="p-5 border-b border-surface-border">
          <h1 className="text-xl font-display font-semibold tracking-tight text-ink">
            Medimoove
          </h1>
          {subtitle && <p className="text-slate-muted text-xs mt-0.5">{subtitle}</p>}
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive ? "bg-teal/10 text-teal" : "text-slate-muted hover:text-ink hover:bg-navy-light"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <span className="flex-1">{label}</span>
              {!!badge && (
                <span className="bg-teal text-navy text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-surface-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-60 min-h-screen overflow-y-auto pb-20 md:pb-0">
        <div className={clsx("mx-auto", contentMaxWidth)}>
          <Outlet />
        </div>
      </main>

      {/* Bottom tab bar — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-surface-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileVisibleItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                "relative flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-150 min-w-0",
                isActive ? "text-teal" : "text-slate-muted"
              )}
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon className={clsx("w-[22px] h-[22px] transition-transform duration-150", isActive && "scale-110")} strokeWidth={2} />
                    {!!badge && (
                      <span className="absolute -top-1 -right-1.5 bg-teal text-navy text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          {hasOverflow && (
            <button
              onClick={() => setShowMore(true)}
              className="relative flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl min-w-0 text-slate-muted"
            >
              <span className="relative">
                <Menu className="w-[22px] h-[22px]" strokeWidth={2} />
                {!!overflowBadgeTotal && (
                  <span className="absolute -top-1 -right-1.5 bg-teal text-navy text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {overflowBadgeTotal > 9 ? "9+" : overflowBadgeTotal}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium truncate max-w-full">More</span>
            </button>
          )}
          {/* Always present, outside the visible/overflow split above, so
              logout never gets crowded out or buried by a role's growing nav list */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl min-w-0 text-slate-muted"
          >
            <LogOut className="w-[22px] h-[22px]" strokeWidth={2} />
            <span className="text-[10px] font-medium">Log Out</span>
          </button>
        </div>
      </nav>

      {/* Overflow menu — mobile only, holds whatever didn't fit in the
          bottom bar. Same items the desktop sidebar shows in full. */}
      <Modal open={showMore} onClose={() => setShowMore(false)} title="More">
        <div className="space-y-1">
          {mobileOverflowItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setShowMore(false)}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all",
                isActive ? "bg-teal/10 text-teal" : "text-slate-muted hover:text-ink hover:bg-navy-light"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <span className="flex-1">{label}</span>
              {!!badge && (
                <span className="bg-teal text-navy text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </Modal>
    </div>
  );
}
