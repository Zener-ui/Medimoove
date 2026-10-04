import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { Link } from "react-router-dom";
import { getMyOrders } from "@/api/orders";
import { formatNaira, formatDate, getStatusDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });
  const orders = data?.orders || [];

  return (
    <div className="min-h-screen">
      <TopBar title="Supply orders" />
      <div className="px-4 py-3 space-y-3">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : orders.length === 0
            ? <EmptyState icon={Package} title="No orders yet" description="Your medical supply order history will appear here" />
            : orders.map((order) => {
                const status = getStatusDisplay(order.status);
                return (
                  <Link key={order.id} to={`/customer/orders/${order.id}`}>
                    <div className="p-4 bg-surface rounded-2xl border border-surface-border hover:border-navy-light transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-ink font-semibold text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-slate-muted text-xs mt-0.5">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-slate-muted text-xs">{order.sub_orders?.length || 0} supplier{order.sub_orders?.length !== 1 ? "s" : ""}</p>
                        <p className="text-teal font-bold">{formatNaira(order.total)}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
      </div>
    </div>
  );
}
