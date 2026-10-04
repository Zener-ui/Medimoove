import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getNotifications } from "@/api/notifications";

// Polling (every 20s) is a deliberate fallback/complement to push, not
// a replacement — push delivers the instant a notification is created,
// but this keeps the badge count correct even if push permission was
// never granted, a subscription silently expired, or the OS suppressed
// it. Both together give an accurate badge either way.
export default function NotificationBell({ role }) {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getNotifications,
    refetchInterval: 20000,
  });

  const unreadCount = (data?.notifications || []).filter((n) => !n.is_read).length;

  return (
    <button
      onClick={() => navigate(`/${role}/notifications`)}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-muted hover:text-ink hover:bg-navy-light transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-[19px] h-[19px]" strokeWidth={2} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 bg-teal text-navy text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
