import { useQuery } from "@tanstack/react-query";
import { Wallet, Store, Bike, Package, CheckCircle2, Banknote, Scale, Bell, MessageCircle, Rocket, AlertTriangle, Megaphone, Ticket, CloudRain, FileText, Percent, ShieldCheck, Send, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { getAnalytics, getAlerts } from "@/api/admin";
import { formatNaira } from "@/utils";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";

export default function AdminDashboard() {
  const { data: analyticsData, isLoading } = useQuery({ queryKey: ["admin-analytics"], queryFn: getAnalytics });
  const { data: alertsData } = useQuery({ queryKey: ["admin-alerts", { resolved: "false" }], queryFn: () => getAlerts({ resolved: "false" }), refetchInterval: 60000 });

  const a = analyticsData?.analytics;
  const unresolved = alertsData?.alerts?.length || 0;

  const stats = [
    { label: "Total Revenue",      value: formatNaira(a?.total_revenue),          icon: Wallet, color: "text-teal" },
    { label: "Active Vendors",     value: a?.approved_vendors,                     icon: Store, color: "text-blue-accent" },
    { label: "Active Riders",      value: a?.approved_riders,                      icon: Bike, color: "text-blue-accent" },
    { label: "Total Orders",       value: a?.total_orders,                         icon: Package, color: "text-ink" },
    { label: "Delivered",          value: a?.delivered_orders,                     icon: CheckCircle2, color: "text-green-400" },
    { label: "Pending Vendors",    value: (a?.total_vendors || 0) - (a?.approved_vendors || 0), icon: AlertTriangle, color: "text-yellow-400" },
  ];

  const quickLinks = [
    { to: "/admin/vendors",     icon: Store, label: "Vendors",     badge: (a?.total_vendors || 0) - (a?.approved_vendors || 0) },
    { to: "/admin/riders",      icon: Bike, label: "Riders",      badge: null },
    { to: "/admin/withdrawals", icon: Banknote, label: "Payouts",     badge: null },
    { to: "/admin/platform-revenue", icon: Wallet, label: "Platform Revenue", badge: null },
    { to: "/admin/promotions-budget", icon: Megaphone, label: "Promotions Budget", badge: null },
    { to: "/admin/coupons", icon: Ticket, label: "Coupons", badge: null },
    { to: "/admin/delivery-settings", icon: CloudRain, label: "Delivery & Weather", badge: null },
    { to: "/admin/policies", icon: FileText, label: "Legal & Policies", badge: null },
    { to: "/admin/fee-settings", icon: Percent, label: "Fee Settings", badge: null },
    { to: "/admin/reconciliation", icon: ShieldCheck, label: "Reconciliation", badge: null },
    { to: "/admin/broadcast", icon: Send, label: "Send Notification", badge: null },
    { to: "/admin/referral-program", icon: Gift, label: "Customer Referrals", badge: null },
    { to: "/admin/disputes",    icon: Scale,  label: "Disputes",    badge: null },
    { to: "/admin/monitoring",  icon: Bell, label: "Alerts",      badge: unresolved || null },
    { to: "/admin/support",     icon: MessageCircle, label: "Support",     badge: null },
    { to: "/admin/orders",      icon: Package, label: "Orders",      badge: null },
    { to: "/admin/pilot",       icon: Rocket, label: "Pilot",       badge: null },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-ink text-2xl font-black">Admin Dashboard</h1>
        <p className="text-slate-muted text-sm mt-1">Medimoove operations overview</p>
      </div>

      {unresolved > 0 && (
        <Link to="/admin/monitoring">
          <div className="mb-4 p-3 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-red-400 text-sm font-semibold">{unresolved} unresolved alert{unresolved > 1 ? "s" : ""} require attention</p>
            <span className="ml-auto text-red-400 text-xs">View →</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-slate-muted text-xs">{label}</span>
            </div>
            {isLoading ? <Skeleton className="h-8 w-20" /> : (
              <p className={`text-2xl font-black ${color}`}>{value ?? "—"}</p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickLinks.map(({ to, icon: Icon, label, badge }) => (
          <Link key={to} to={to}>
            <Card hover className="p-4 flex items-center gap-3 relative">
              <Icon className="w-6 h-6 text-teal flex-shrink-0" />
              <span className="text-ink text-sm font-medium">{label}</span>
              {badge > 0 && (
                <span className="absolute top-2 right-2 bg-red-400 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">{badge}</span>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
