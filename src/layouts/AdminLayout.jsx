import AppShell from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Store, Bike, Package, Scale, Banknote, MessageCircle, Bell, Rocket, Star, RotateCcw } from "lucide-react";
import { getNotifications } from "@/api/notifications";
import { getStuckCancellationRefunds } from "@/api/admin";

export default function AdminLayout() {
  // Polls every 30s rather than only on mount — an admin can leave this
  // tab open all day, and a new dispute notification should surface
  // without needing a manual refresh to notice it arrived.
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });
  const unreadNotifications = (data?.notifications || []).filter((n) => !n.is_read).length;

  const { data: stuckRefundsData } = useQuery({
    queryKey: ["admin-cancellation-refunds"],
    queryFn: getStuckCancellationRefunds,
    refetchInterval: 30000,
  });
  const stuckRefundCount = stuckRefundsData?.stuck?.length || 0;

  const NAV = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/vendors", icon: Store, label: "Vendors" },
    { to: "/admin/riders", icon: Bike, label: "Riders" },
    { to: "/admin/orders", icon: Package, label: "Orders" },
    { to: "/admin/disputes", icon: Scale, label: "Disputes" },
    { to: "/admin/cancellation-refunds", icon: RotateCcw, label: "Cancellation Refunds", badge: stuckRefundCount || null },
    { to: "/admin/withdrawals", icon: Banknote, label: "Payouts" },
    { to: "/admin/reviews", icon: Star, label: "Reviews" },
    { to: "/admin/support", icon: MessageCircle, label: "Support" },
    { to: "/admin/notifications", icon: Bell, label: "Notifications", badge: unreadNotifications || null },
    { to: "/admin/monitoring", icon: Rocket, label: "Alerts" },
    { to: "/admin/pilot", icon: Rocket, label: "Pilot" },
  ];

  return <AppShell navItems={NAV} subtitle="Admin Panel" contentMaxWidth="max-w-6xl" />;
}
