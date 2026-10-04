import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingBag, Wallet, Landmark, Star, Settings, Bell, Share2 } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { getVendorEarnings } from "@/api/vendors";
import { getVendorSubOrders } from "@/api/orders";
import { updateAvailability } from "@/api/vendors";
import { getMyVendorProfile } from "@/api/vendors";
import { getReferralStats } from "@/api/vendors";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatNaira, getStatusDisplay, getAvailabilityDisplay } from "@/utils";
import { useAuthStore } from "@/store/authStore";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";
import Loader from "@/components/common/Loader";
import toast from "react-hot-toast";

const AVAIL_OPTIONS = ["OPEN","BUSY","CLOSED","TEMPORARILY_UNAVAILABLE"];

export default function VendorDashboard() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data: profileData, isLoading: profileLoading } = useQuery({ queryKey: ["vendor-profile"], queryFn: getMyVendorProfile });
  const vendor = profileData?.vendor;
  const isApproved = vendor?.status === "approved";

  // Login routes here regardless of approval status, but /me/earnings
  // is gated to approved vendors only server-side. An unapproved
  // vendor landing here previously just sat on failed/retrying
  // queries with no indication why. Vendor onboarding already renders
  // the correct state (pending / rejected / failed verification).
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["vendor-earnings"], queryFn: getVendorEarnings, enabled: isApproved,
  });
  const { data: ordersData } = useQuery({
    queryKey: ["vendor-suborders"], queryFn: getVendorSubOrders, refetchInterval: 30000, enabled: isApproved,
  });
  const { data: referralData } = useQuery({
    queryKey: ["vendor-referrals"], queryFn: getReferralStats, enabled: isApproved,
  });

  const availMutation = useMutation({
    mutationFn: updateAvailability,
    onSuccess: () => { toast.success("Availability updated"); qc.invalidateQueries(["vendor-profile"]); },
    onError: (err) => toast.error(err.message),
  });

  const earnings = earningsData;
  const activeOrders = ordersData?.sub_orders?.filter((o) => !["DELIVERED","CANCELLED","REFUNDED"].includes(o.status)) || [];
  const avail = getAvailabilityDisplay(vendor?.availability_status);

  // The link a vendor shares (WhatsApp status, etc.) to send people
  // straight to their public storefront — no account needed to browse.
  // Uses navigator.share on devices that support it (native share
  // sheet straight to WhatsApp/etc.), falls back to copy-to-clipboard
  // everywhere else.
  const storeLink = vendor?.id ? `${window.location.origin}/s/${vendor.id}` : "";
  const handleShareStore = async () => {
    if (!storeLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: vendor?.business_name || "My pharmacy on Medimoove", url: storeLink });
        return;
      } catch {
        // User cancelled the native share sheet, or it's unsupported for
        // this content — clipboard fallback below still gets them a usable link.
      }
    }
    try {
      await navigator.clipboard.writeText(storeLink);
      toast.success("Pharmacy link copied!");
    } catch {
      toast.error("Couldn't copy the link — try again.");
    }
  };

  if (profileLoading) return <Loader fullscreen />;
  if (!isApproved) return <Navigate to="/vendor/onboarding" replace />;

  return (
    <div className="min-h-screen">
      <TopBar title="Pharmacy Dashboard" right={
        <div className="flex items-center gap-2">
          <Link to="/vendor/notifications" className="w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center">
            <Bell className="w-4 h-4 text-ink" strokeWidth={1.75} />
          </Link>
          <span className={`text-xs font-semibold ${avail.color}`}>{avail.label}</span>
        </div>
      } />

      <div className="px-4 py-3 space-y-4">
        {/* Pharmacy status */}
        <Card className="p-4">
          <p className="text-slate-muted text-xs mb-2 font-medium uppercase tracking-wide">Pharmacy Status</p>
          <div className="flex gap-2 flex-wrap">
            {AVAIL_OPTIONS.map((s) => (
              <button key={s} onClick={() => availMutation.mutate({ availability_status: s })}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${vendor?.availability_status === s ? "border-teal bg-teal/10 text-teal" : "border-surface-border text-slate-muted"}`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </Card>

        {/* Share pharmacy link — the provider-acquisition channel: a
            vendor posts this on their own WhatsApp status/socials,
            and anyone who taps it lands on a public store page with
            no account required to browse. */}
        <Card className="p-4">
          <p className="text-slate-muted text-xs mb-2 font-medium uppercase tracking-wide">Your Pharmacy Link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-app border border-surface-border">
              <p className="text-ink text-xs truncate">{storeLink}</p>
            </div>
            <button onClick={handleShareStore}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal text-white text-xs font-semibold flex-shrink-0">
              <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
              Share
            </button>
          </div>
          <p className="text-slate-muted text-[11px] mt-2">Share this on your WhatsApp status — healthcare providers can browse your pharmacy and available supplies.</p>
          {referralData?.total_referred > 0 && (
            <p className="text-teal text-xs font-semibold mt-3 pt-3 border-t border-surface-border">
              {referralData.total_referred} {referralData.total_referred === 1 ? "person has" : "people have"} joined Medimoove through your link
            </p>
          )}
        </Card>

        {/* Earnings summary */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Available", value: earnings?.available_balance, color: "text-teal" },
            { label: "Pending",   value: earnings?.pending_balance,   color: "text-yellow-400" },
            { label: "Total Earned",   value: earnings?.total_earned,     color: "text-ink" },
            { label: "Withdrawn", value: earnings?.total_withdrawn,  color: "text-slate-muted" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className="text-slate-muted text-xs mb-1">{label}</p>
              {earningsLoading ? <Skeleton className="h-7 w-24" /> : (
                <p className={`text-xl font-black ${color}`}>{formatNaira(value)}</p>
              )}
            </Card>
          ))}
        </div>

        {/* Active orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-ink font-semibold text-sm">Active Supply Orders ({activeOrders.length})</h2>
            <Link to="/vendor/orders" className="text-teal text-xs">See all supply orders →</Link>
          </div>
          {activeOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-slate-muted text-sm">No active supply orders</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeOrders.slice(0, 3).map((o) => {
                const s = getStatusDisplay(o.status);
                return (
                  <Card key={o.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-ink text-xs font-semibold">#{o.id.slice(0,8).toUpperCase()}</p>
                      <p className="text-slate-muted text-[10px]">{o.delivery_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { to: "/vendor/products",    icon: Package, label: "Medical Supplies" },
            { to: "/vendor/orders",      icon: ShoppingBag, label: "Supply Orders" },
            { to: "/vendor/earnings",    icon: Wallet, label: "Payouts" },
            { to: "/vendor/withdrawals", icon: Landmark, label: "Withdraw Funds" },
            { to: "/vendor/reviews",     icon: Star, label: "Provider Feedback" },
            { to: "/vendor/settings",    icon: Settings, label: "Settings" },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}>
              <Card hover className="p-4 flex items-center gap-3">
                <Icon className="w-6 h-6 text-teal flex-shrink-0" />
                <span className="text-ink text-sm font-medium">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
