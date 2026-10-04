import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getRiderEarnings } from "@/api/riders";
import { formatNaira, formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";

export default function RiderEarningsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["rider-earnings"], queryFn: getRiderEarnings });

  return (
    <div className="min-h-screen">
      <TopBar title="Earnings" />
      <div className="px-4 py-3 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Available", value: data?.available_balance, color: "text-teal", desc: "Ready to withdraw" },
            { label: "Pending",   value: data?.pending_balance,   color: "text-yellow-400", desc: "After delivery" },
            { label: "Total",     value: data?.total_earned,      color: "text-ink", desc: "All time" },
            { label: "Withdrawn", value: data?.total_withdrawn,   color: "text-slate-muted", desc: "All time" },
          ].map(({ label, value, color, desc }) => (
            <Card key={label} className="p-4">
              <p className="text-slate-muted text-xs">{label}</p>
              {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : <p className={`text-xl font-black mt-1 ${color}`}>{formatNaira(value)}</p>}
              <p className="text-slate-muted text-[10px] mt-1">{desc}</p>
            </Card>
          ))}
        </div>
        {!isLoading && Number(data?.outstanding_refund_liability || 0) > 0 && (
          <Card className="p-4 border border-yellow-500/30">
            <p className="text-ink text-sm font-bold">Outstanding refund liability</p>
            <p className="text-yellow-500 text-xl font-black mt-1">{formatNaira(data.outstanding_refund_liability)}</p>
            <p className="text-slate-muted text-[11px] mt-1">Future eligible earnings will be applied toward this amount.</p>
          </Card>
        )}

        <Button size="lg" className="w-full" onClick={() => navigate("/rider/withdrawals")}>Withdraw Earnings</Button>
        <div>
          <h3 className="text-ink font-semibold text-sm mb-3">Delivery History</h3>
          {isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl mb-2" />) :
            data?.sub_orders?.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border mb-2">
                <div>
                  <p className="text-ink text-xs font-semibold">#{o.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-slate-muted text-[10px]">{formatDate(o.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${o.status === "DELIVERED" ? "text-teal" : "text-slate-muted"}`}>{formatNaira(o.rider_payout)}</p>
                  <p className="text-[10px] text-slate-muted">{o.status === "DELIVERED" ? "Paid" : "Locked"}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
