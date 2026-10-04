import { useState } from "react";
import toast from "react-hot-toast";
import { Bell, X } from "lucide-react";
import { enablePushNotifications, isPushSupported, getPushPermissionState } from "@/utils/push";

const flagKey = (userId) => `cm_push_prompt_seen_${userId}`;

export const hasSeenPushPrompt = (userId) => {
  if (!userId) return true;
  return localStorage.getItem(flagKey(userId)) === "seen";
};

// Shown once per account (same dismiss-once pattern as OnboardingTour),
// and only when notifications are actually available and not already
// decided — no point prompting someone who's already granted or
// permanently denied permission at the browser level.
export default function PushPermissionPrompt({ userId, onDone }) {
  const [loading, setLoading] = useState(false);

  const dismiss = () => {
    if (userId) localStorage.setItem(flagKey(userId), "seen");
    onDone();
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const result = await enablePushNotifications();
      if (!result?.success) {
        const messages = {
          unsupported: "This browser does not support push notifications.",
          denied: "Notifications are blocked for Medimoove in your browser settings.",
        };
        toast.error(messages[result?.reason] || "Notifications could not be enabled.");
        return;
      }

      toast.success("Notifications enabled successfully.");
      dismiss();
    } catch (error) {
      // Keep the prompt visible when setup fails so the user can retry.
      // The push API requests suppress the generic global 500 toast, so this
      // message can expose the actual backend/configuration problem.
      toast.error(error?.message || "Could not enable notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isPushSupported() || getPushPermissionState() !== "default") return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-surface border border-surface-border rounded-2xl p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
          <Bell className="w-[18px] h-[18px] text-teal" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-ink text-sm font-semibold">Stay in the loop</p>
          <p className="text-slate-muted text-xs mt-0.5">Get notified instantly about order updates, deliveries, and account activity.</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="text-xs font-semibold bg-teal text-navy px-3 py-1.5 rounded-lg disabled:opacity-60"
            >
              {loading ? "Enabling…" : "Enable notifications"}
            </button>
            <button onClick={dismiss} className="text-xs font-medium text-slate-muted px-3 py-1.5">
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="text-slate-muted shrink-0" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
