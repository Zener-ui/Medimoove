import { RefreshCw, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getStuckCancellationRefunds, retryCancellationRefund } from "@/api/admin";
import { formatDateTime } from "@/utils";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function AdminCancellationRefundsPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-cancellation-refunds"],
    queryFn: getStuckCancellationRefunds,
  });
  const stuck = data?.stuck || [];

  const retryMutation = useMutation({
    mutationFn: (subOrderId) => retryCancellationRefund(subOrderId),
    onSuccess: () => {
      toast.success("Refund re-initiated. It'll show as processed once Paystack confirms it.");
      qc.invalidateQueries(["admin-cancellation-refunds"]);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Retry failed."),
  });

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-display font-bold text-ink">Cancellation Refunds</h1>
        <p className="text-sm text-slate-muted mt-1">
          Orders cancelled after payment (by a customer or a vendor) where the automatic refund
          never went through. Nothing here is "still processing" — a refund that's actually in
          flight or already completed won't appear on this list at all.
        </p>
      </div>

      {isLoading && <Skeleton className="h-24 w-full" />}
      {isError && <p className="text-red-500 text-sm">{error?.message}</p>}

      {!isLoading && stuck.length === 0 && (
        <EmptyState
          icon={AlertTriangle}
          title="Nothing stuck right now"
          description="Every cancelled, paid sub-order has a refund that's processing or already completed."
        />
      )}

      {stuck.map((item) => (
        <div key={item.sub_order_id} className="bg-surface border border-surface-border rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-ink font-semibold truncate">{item.vendor_name || "Unknown vendor"}</p>
            <p className="text-slate-muted text-xs mt-0.5">Sub-order {item.sub_order_id.slice(0, 8)} · Cancelled {formatDateTime(item.cancelled_at)}</p>
            <p className="text-ink text-sm mt-1 font-medium">{formatNaira(item.refundable_amount)} owed back to the customer</p>
          </div>
          <Button
            size="sm"
            onClick={() => retryMutation.mutate(item.sub_order_id)}
            disabled={retryMutation.isPending}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Retry refund
          </Button>
        </div>
      ))}
    </div>
  );
}
