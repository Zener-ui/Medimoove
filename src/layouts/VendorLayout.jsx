import { useQuery } from "@tanstack/react-query";
import { useLocation, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Loader from "@/components/common/Loader";
import { getMyVendorProfile } from "@/api/vendors";
import { LayoutDashboard, Package, ShoppingBag, Wallet, Star, Settings } from "lucide-react";

const NAV = [
  { to: "/vendor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vendor/products", icon: Package, label: "Products" },
  { to: "/vendor/orders", icon: ShoppingBag, label: "Orders" },
  { to: "/vendor/earnings", icon: Wallet, label: "Earnings" },
  { to: "/vendor/reviews", icon: Star, label: "Reviews" },
  { to: "/vendor/settings", icon: Settings, label: "Settings" },
];

// Enforced here (not just by the backend) so a pending/rejected
// vendor lands on a clear status screen instead of a dashboard full
// of failed API calls. The backend's own requireApprovedVendor
// middleware is the real security boundary — this is UX only.
export default function VendorLayout() {
  const location = useLocation();
  const { data, isLoading } = useQuery({ queryKey: ["vendor-profile"], queryFn: getMyVendorProfile, retry: false });
  const vendor = data?.vendor;

  if (isLoading) return <Loader fullscreen />;

  const isOnboardingRoute = location.pathname.startsWith("/vendor/onboarding");
  if (vendor?.status !== "approved" && !isOnboardingRoute) {
    return <Navigate to="/vendor/onboarding" replace />;
  }

  return <AppShell navItems={NAV} subtitle="Vendor Panel" />;
}
