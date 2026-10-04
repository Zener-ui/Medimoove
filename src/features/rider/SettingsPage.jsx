import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMyRiderProfile } from "@/api/riders";
import { useAuthStore } from "@/store/authStore";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import ChangePinSection from "@/components/common/ChangePinSection";
import { Skeleton } from "@/components/common/Loader";

export default function RiderSettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ["my-rider-profile"], queryFn: getMyRiderProfile });
  const rider = data?.rider;

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen">
      <TopBar title="Account" />
      <div className="px-4 py-3 space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 rounded-2xl" />
        ) : (
          <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-1">
            <p className="text-ink font-semibold">{user?.full_name}</p>
            <p className="text-slate-muted text-sm">{rider?.phone}</p>
            <p className="text-slate-muted text-sm capitalize">{rider?.vehicle_type}</p>
          </div>
        )}

        <ChangePinSection />

        <Link to="/terms" className="block text-center text-slate-muted text-sm hover:text-teal py-2">
          Terms &amp; Conditions
        </Link>

        <Button variant="danger" size="lg" className="w-full" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
