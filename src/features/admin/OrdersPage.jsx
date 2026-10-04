import { useState } from "react";
import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAdminOrders } from "@/api/admin";
import { formatNaira, formatDateTime, getStatusDisplay } from "@/utils";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Loader";

const STATUSES = ["","PENDING_PAYMENT","PAYMENT_CONFIRMED","PREPARING","WAITING_RIDER","RIDER_ASSIGNED","DELIVERING","DELIVERED","CANCELLED"];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["admin-orders", status], queryFn: () => getAdminOrders(status || undefined) });
  const orders = data?.orders || [];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Orders</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${status === s ? "bg-teal text-navy border-teal" : "border-surface-border text-slate-muted bg-surface"}`}>
            {s || "All"}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} />
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {orders.map((o) => {
              const s = getStatusDisplay(o.status);
              // An order can span multiple vendors — sub_orders carries
              // the real vendor relationship, orders has no vendor_id at all.
              const vendorNames = (o.sub_orders || []).map((so) => so.vendors?.business_name).filter(Boolean);
              const vendorLabel = vendorNames.length > 1
                ? `${vendorNames[0]} +${vendorNames.length - 1} more`
                : vendorNames[0] || "—";
              return (
                <div key={o.id} className="p-4 bg-surface rounded-2xl border border-surface-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-ink font-semibold text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-slate-muted text-xs">{o.users?.full_name} · {formatDateTime(o.created_at)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-slate-muted text-xs truncate">{vendorLabel}</p>
                    <p className="text-teal font-bold text-sm shrink-0 ml-2">{formatNaira(o.total)}</p>
                  </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  );
}
