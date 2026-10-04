import { useQuery } from "@tanstack/react-query";
import { useLocation, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Loader from "@/components/common/Loader";
import { getMyRiderProfile } from "@/api/riders";
import { Bike, Package, Wallet, Landmark, Settings } from "lucide-react";

const NAV = [
  { to: "/rider/dashboard", icon: Bike, label: "Dashboard" },
  { to: "/rider/orders", icon: Package, label: "Orders" },
  { to: "/rider/earnings", icon: Wallet, label: "Earnings" },
  { to: "/rider/withdrawals", icon: Landmark, label: "Withdraw" },
  { to: "/rider/settings", icon: Settings, label: "Account" },
];

// Enforced here (not just by the backend) so a pending/rejected
// rider lands on a clear status screen instead of a dashboard full
// of failed API calls. The backend's own requireApprovedRider
// middleware is the real security boundary — this is UX only.
export default function RiderLayout() {
  const location = useLocation();
  const { data, isLoading } = useQuery({ queryKey: ["my-rider-profile"], queryFn: getMyRiderProfile, retry: false });
  const rider = data?.rider;

  if (isLoading) return <Loader fullscreen />;

  const isOnboardingRoute = location.pathname.startsWith("/rider/onboarding");
  if (rider?.status !== "approved" && !isOnboardingRoute) {
    return <Navigate to="/rider/onboarding" replace />;
  }

  return <AppShell navItems={NAV} subtitle="Rider Panel" />;
}
