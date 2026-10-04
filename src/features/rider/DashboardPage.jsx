import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bike, Circle, MapPin, Home, Bell } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyRiderProfile, toggleAvailability, getRiderEarnings } from "@/api/riders";
import { getAvailableOrders, acceptOrder, getRiderSubOrders } from "@/api/orders";
import { formatNaira, getStatusDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";
import Loader from "@/components/common/Loader";

export default function RiderDashboard() {
  const qc = useQueryClient();

  const { data: profileData, isLoading: profileLoading } = useQuery({ queryKey: ["rider-profile"], queryFn: getMyRiderProfile });
  const rider = profileData?.rider;
  const isApproved = rider?.status === "approved";

  // Login sends every rider straight here (roleHomePath doesn't know
  // approval status) — but /me/earnings, /available-orders, and
  // /accept-order are all gated server-side to approved riders only.
  // Without this check, an unapproved rider landed here and every one
  // of the queries below just failed against a 403, retried
  // (React Query's default), and sat on skeleton loaders / empty
  // sections indefinitely — reported as "a scrolling page that goes
  // on for a long while" after login. Onboarding is the correct place
  // for them regardless of why they aren't approved yet (pending,
  // failed verification, rejected) — that page already renders the
  // right state for each case.
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["rider-earnings"], queryFn: getRiderEarnings, enabled: isApproved,
  });
  const { data: availableData, isLoading: ordersLoading } = useQuery({
    queryKey: ["available-orders"], queryFn: getAvailableOrders, refetchInterval: 15000, enabled: isApproved,
  });
  const { data: myOrdersData } = useQuery({
    queryKey: ["rider-suborders"], queryFn: getRiderSubOrders, refetchInterval: 20000, enabled: isApproved,
  });

  const isActive = rider?.is_active;

  const toggleMutation = useMutation({
    mutationFn: () => toggleAvailability(!isActive),
    onSuccess: () => { toast.success(isActive ? "You are now offline" : "You are now online"); qc.invalidateQueries(["rider-profile"]); },
    onError: (err) => toast.error(err.message),
  });

  const acceptMutation = useMutation({
    mutationFn: acceptOrder,
    onSuccess: () => { toast.success("Order accepted! Head to the pharmacy."); qc.invalidateQueries(["available-orders"]); qc.invalidateQueries(["rider-suborders"]); },
    onError: (err) => toast.error(err.message || "Order was just taken by another rider"),
  });

  const availableOrders = availableData?.orders || [];
  const activeDeliveries = myOrdersData?.sub_orders?.filter((o) => !["DELIVERED","CANCELLED"].includes(o.status)) || [];

  if (profileLoading) return <Loader fullscreen />;
  if (!isApproved) return <Navigate to="/rider/onboarding" replace />;

  return (
    <div className="min-h-screen">
      <TopBar title="Rider Dashboard" right={
        <div className="flex items-center gap-2">
          <Link to="/rider/notifications" className="w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center">
            <Bell className="w-4 h-4 text-ink" strokeWidth={1.75} />
          </Link>
          <button onClick={() => toggleMutation.mutate()}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${isActive ? "bg-teal text-navy border-teal" : "border-surface-border text-slate-muted"}`}>
            <span className="flex items-center gap-1.5">{isActive ? <><Circle className="w-2 h-2 fill-teal text-teal" />Online</> : <><Circle className="w-2 h-2 fill-slate-soft text-slate-soft" />Offline</>}</span>
          </button>
        </div>
      } />

      <div className="px-4 py-3 space-y-4">
        {/* Earnings */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Available",  value: earningsData?.available_balance, color: "text-teal" },
            { label: "Pending",    value: earningsData?.pending_balance,   color: "text-yellow-400" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="p-4">
              <p className="text-slate-muted text-xs">{label}</p>
              {earningsLoading ? <Skeleton className="h-7 w-20 mt-1" /> : (
                <p className={`text-xl font-black mt-1 ${color}`}>{formatNaira(value)}</p>
              )}
            </Card>
          ))}
        </div>

        {/* Active delivery */}
        {activeDeliveries.length > 0 && (
          <div>
            <h3 className="text-ink font-semibold text-sm mb-2">Active Delivery</h3>
            {activeDeliveries.map((o) => {
              const s = getStatusDisplay(o.status);
              return (
                <Card key={o.id} className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <p className="text-ink font-semibold text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                    <span className={`text-xs ${s.color}`}>{s.label}</span>
                  </div>
                  {o.vendors && <p className="text-slate-muted text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> From: {o.vendors.business_name}</p>}
                  {o.delivery_address && <p className="text-slate-muted text-xs flex items-center gap-1"><Home className="w-3 h-3" /> To: {o.delivery_address}</p>}
                  <p className="text-teal font-bold text-sm">Earning: {formatNaira(o.rider_payout)}</p>
                </Card>
              );
            })}
          </div>
        )}

        {/* Available orders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-ink font-semibold text-sm">Available Orders</h3>
            {ordersLoading && <span className="text-xs text-slate-muted">Refreshing...</span>}
          </div>
          {!isActive ? (
            <Card className="p-6 text-center">
              <p className="text-slate-muted text-sm">Go online to see available orders</p>
              <Button className="mt-3" size="sm" onClick={() => toggleMutation.mutate()}>Go Online</Button>
            </Card>
          ) : availableOrders.length === 0 ? (
            <EmptyState icon={Bike} title="No orders right now" description="New orders will appear here" />
          ) : (
            availableOrders.map((o) => (
              <Card key={o.id} className="p-4 mb-3 space-y-2">
                <div className="flex justify-between">
                  <p className="text-ink font-semibold text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-teal font-bold text-sm">{formatNaira(o.delivery_fee)}</p>
                </div>
                {o.vendors && <p className="text-slate-muted text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Pickup: {o.vendors.business_name}, {o.vendors.location}</p>}
                {o.delivery_address && <p className="text-slate-muted text-xs flex items-center gap-1"><Home className="w-3 h-3" /> Drop-off: {o.delivery_address}</p>}
                <Button size="md" className="w-full" onClick={() => acceptMutation.mutate(o.id)} loading={acceptMutation.isPending}>
                  Accept Order
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
