import { useNavigate, Link } from "react-router-dom";
import { User, Lock, Package, Receipt, MessageCircle, Gift } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getNotificationPrefs, updateNotificationPrefs } from "@/api/preferences";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";

const PREF_LABELS = [
  { key: "email_order_updates",    label: "Order updates (email)" },
  { key: "email_payment_updates",  label: "Payment updates (email)" },
  { key: "push_order_updates",     label: "Order updates (push)" },
  { key: "push_delivery_updates",  label: "Delivery tracking (push)" },
  { key: "email_marketing",        label: "Promotions (email)" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();

  const { data: prefData, isLoading: prefsLoading, isError: prefsError, refetch: refetchPrefs } =
    useQuery({ queryKey: ["notif-prefs"], queryFn: getNotificationPrefs });
  const prefs = prefData?.preferences || {};

  const prefMutation = useMutation({
    mutationFn: updateNotificationPrefs,
    onSuccess: () => { toast.success("Preferences saved"); qc.invalidateQueries(["notif-prefs"]); },
    onError: (err) => toast.error(err.message),
  });

  const togglePref = (key) => {
    prefMutation.mutate({ [key]: !prefs[key] });
  };

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen pb-8">
      <TopBar title="Profile" />
      <div className="px-4 py-3 space-y-4">
        {/* User card */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center text-2xl">
              <User className="w-7 h-7" />
            </div>
            <div>
              <p className="text-ink font-bold text-lg">{user?.full_name}</p>
              <p className="text-slate-muted text-sm">{user?.email}</p>
              <p className="text-teal text-xs font-medium capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="space-y-2">
          {[
            { icon: Lock, label: "Change Password",  onClick: () => navigate("/change-password") },
            { icon: Package, label: "Supply orders",         onClick: () => navigate("/customer/orders") },
            { icon: Receipt, label: "Receipts",          onClick: () => navigate("/customer/receipts") },
            { icon: Gift, label: "Refer Friends",        onClick: () => navigate("/customer/refer") },
            { icon: MessageCircle, label: "Support",           onClick: () => navigate("/customer/support") },
          ].map(({ icon: Icon, label, onClick }) => (
            <button key={label} onClick={onClick}
              className="w-full flex items-center gap-3 p-4 bg-surface rounded-2xl border border-surface-border hover:border-navy-light transition-all text-left">
              <Icon className="w-5 h-5 text-slate-muted flex-shrink-0" />
              <span className="text-ink text-sm font-medium flex-1">{label}</span>
              <span className="text-slate-muted">→</span>
            </button>
          ))}
        </div>

        {/* Notification preferences */}
        <Card className="p-4">
          <h3 className="text-ink font-semibold text-sm mb-3">Notification Preferences</h3>
          {prefsLoading ? (
            <div className="space-y-3">
              {PREF_LABELS.map(({ key }) => (
                <div key={key} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          ) : prefsError ? (
            <ErrorState message="Couldn't load your notification preferences." onRetry={refetchPrefs} />
          ) : (
            <div className="space-y-3">
              {PREF_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-muted text-sm">{label}</span>
                  <button onClick={() => togglePref(key)}
                    className={`w-11 h-6 rounded-full transition-all ${prefs[key] ? "bg-teal" : "bg-surface-raised"} relative`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${prefs[key] ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

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
