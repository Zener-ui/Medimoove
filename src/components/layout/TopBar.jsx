import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/common/NotificationBell";

export default function TopBar({ title, showBack = false, right }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  return (
    <header className="sticky top-0 z-30 bg-navy/90 backdrop-blur-sm border-b border-surface-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="text-slate-muted hover:text-ink transition-colors w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-raised"
            >
              <ArrowLeft className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          )}
          {title && <h1 className="text-ink font-display font-medium text-lg tracking-tight">{title}</h1>}
        </div>
        <div className="flex items-center gap-2">
          {right}
          {/* Admin has no /admin/notifications route yet — skip the
              bell there rather than link to a page that doesn't exist. */}
          {user?.role && user.role !== "admin" && <NotificationBell role={user.role} />}
        </div>
      </div>
    </header>
  );
}
