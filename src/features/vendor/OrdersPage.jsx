import { useState } from "react";
import { Package } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getVendorSubOrders, updateSubOrderStatus } from "@/api/orders";
import { formatNaira, formatDateTime, getStatusDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Loader";

const TABS = ["All","Active","Completed"];

export default function VendorOrdersPage() {
  const [tab, setTab] = useState("All");
  const qc = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["vendor-suborders"],
    queryFn: getVendorSubOrders,
    refetchInterval: 20000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => updateSubOrderStatus(id, status),
    onSuccess: () => { toast.success("Supply order status updated"); qc.invalidateQueries(["vendor-suborders"]); },
    onError: (err) => toast.error(err.message),
  });

  const orders = data?.sub_orders || [];
  const filtered = orders.filter((o) => {
    if (tab === "Active") return !["DELIVERED","CANCELLED","REFUNDED"].includes(o.status);
    if (tab === "Completed") return o.status === "DELIVERED";
    return true;
  });

  return (
    <div className="min-h-screen">
      <TopBar title="Supply Orders" />
      <div className="flex gap-2 px-4 md:px-8 py-3">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${tab === t ? "bg-teal text-navy border-teal" : "bg-surface border-surface-border text-slate-muted"}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-8 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="No supply orders" description={`No ${tab.toLowerCase()} supply orders`} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((order) => {
              const s = getStatusDisplay(order.status);
              const canStartPreparing = order.status === "PAYMENT_CONFIRMED";
              // Locks in cancellation-proof territory the moment the
              // vendor accepts — see orderStateMachine.js. A customer
              // can no longer cancel once this happens.
              const canMarkReady = order.status === "PREPARING";
              // For a genuine self-pickup order, the vendor can now confirm
              // the customer actually collected it — this transition didn't
              // exist at all before, so pickup orders had no way to ever be
              // marked complete.
              const canConfirmPickedUp = order.status === "READY_FOR_PICKUP" && order.delivery_type === "pickup";
              return (
                <div key={order.id} className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-ink font-semibold text-sm">#{order.id.slice(0,8).toUpperCase()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.color}`}>{s.label}</span>
                  </div>
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs border-b border-surface-border pb-1">
                      <span className="text-slate-muted">{item.products?.name} × {item.quantity}</span>
                      <span className="text-ink">{formatNaira(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-1">
                    <p className="text-slate-muted text-xs">{formatDateTime(order.created_at)}</p>
                    <p className="text-teal font-bold text-sm">{formatNaira(order.vendor_payout)}</p>
                  </div>
                  {canStartPreparing && (
                    <button
                      onClick={() => updateMutation.mutate({ id: order.id, status: "PREPARING" })}
                      className="w-full py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-sm font-semibold hover:bg-yellow-400/20 transition-all"
                    >
                      Accept &amp; Start Preparing Supply
                    </button>
                  )}
                  {canMarkReady && (
                    <button
                      onClick={() => updateMutation.mutate({ id: order.id, status: "READY_FOR_PICKUP" })}
                      className="w-full py-2 rounded-xl bg-teal/10 border border-teal/30 text-teal text-sm font-semibold hover:bg-teal/20 transition-all"
                    >
                      {order.delivery_type === "pickup" ? "Mark Ready for Pickup" : "Mark Ready — Handoff to Rider"}
                    </button>
                  )}
                  {canConfirmPickedUp && (
                    <button
                      onClick={() => updateMutation.mutate({ id: order.id, status: "DELIVERED" })}
                      className="w-full py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-sm font-semibold hover:bg-green-500/20 transition-all"
                    >
                      Confirm Provider Picked Up
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
