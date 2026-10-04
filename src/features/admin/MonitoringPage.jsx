import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { getAlerts, resolveAlert, getStuckOrders, getFailedWebhooks, logManualIntervention } from "@/api/admin";
import { formatDateTime } from "@/utils";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";

const SEVERITY_COLORS = { low:"text-slate-muted", medium:"text-yellow-400", high:"text-orange-400", critical:"text-red-400" };

export default function AdminMonitoringPage() {
  const qc = useQueryClient();
  const [resolving, setResolving] = useState(null); // the stuck order being resolved, or null
  const [actionTaken, setActionTaken] = useState("");
  const [resolution, setResolution] = useState("");

  const { data: alertsData, isLoading: alertsLoading } = useQuery({ queryKey: ["admin-alerts-all"], queryFn: () => getAlerts({ resolved: "false" }), refetchInterval: 30000 });
  const { data: stuckData } = useQuery({ queryKey: ["stuck-orders"], queryFn: getStuckOrders, refetchInterval: 60000 });
  const { data: webhookData } = useQuery({ queryKey: ["failed-webhooks"], queryFn: getFailedWebhooks });

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => { toast.success("Alert resolved"); qc.invalidateQueries(["admin-alerts-all"]); },
    onError: (err) => toast.error(err.message),
  });

  // logManualIntervention does double duty here: it writes a real
  // audit-log entry (what was done, and why) AND marks the stuck_orders
  // row resolved in the same call — richer than a bare "resolve" with
  // no record of what actually happened.
  const interveneMutation = useMutation({
    mutationFn: logManualIntervention,
    onSuccess: () => {
      toast.success("Logged and resolved.");
      qc.invalidateQueries(["stuck-orders"]);
      setResolving(null);
      setActionTaken("");
      setResolution("");
    },
    onError: (err) => toast.error(err.message),
  });

  const alerts = alertsData?.alerts || [];
  const stuckOrders = stuckData?.stuck_orders || [];
  const failedWebhooks = webhookData?.failed_webhooks || [];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Monitoring & Alerts</h1>

      {/* Active alerts */}
      <section className="mb-6">
        <h2 className="text-ink font-semibold text-sm mb-3">Active Alerts ({alerts.length})</h2>
        {alertsLoading ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl mb-2" />)
          : alerts.length === 0 ? <div className="p-4 bg-teal/5 border border-teal/20 rounded-2xl text-center flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal" /><p className="text-teal text-sm">All clear</p></div>
          : alerts.map((a) => (
              <div key={a.id} className="p-4 bg-surface rounded-2xl border border-surface-border mb-2">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-ink font-semibold text-sm">{a.title}</p>
                  <span className={`text-xs font-bold uppercase ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</span>
                </div>
                <p className="text-slate-muted text-xs">{a.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-slate-muted text-xs">{formatDateTime(a.created_at)}</p>
                  <Button size="sm" variant="ghost" onClick={() => resolveMutation.mutate(a.id)}>Resolve</Button>
                </div>
              </div>
            ))}
      </section>

      {/* Stuck orders */}
      <section className="mb-6">
        <h2 className="text-ink font-semibold text-sm mb-3">Stuck Orders ({stuckOrders.length})</h2>
        {stuckOrders.length === 0
          ? <p className="text-slate-muted text-sm">No stuck orders</p>
          : stuckOrders.map((o) => (
              <div key={o.id} className="p-3 bg-surface rounded-xl border border-orange-400/20 mb-2">
                <p className="text-ink text-xs font-semibold">Order #{o.order_id?.slice(0,8).toUpperCase()}</p>
                <p className="text-slate-muted text-xs">{o.reason}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-slate-muted text-xs">{formatDateTime(o.detected_at)}</p>
                  <Button size="sm" variant="ghost" onClick={() => { setResolving(o); setResolution(""); setActionTaken(""); }}>
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
      </section>

      {/* Failed webhooks */}
      <section>
        <h2 className="text-ink font-semibold text-sm mb-3">Failed Webhooks ({failedWebhooks.length})</h2>
        {failedWebhooks.length === 0
          ? <p className="text-slate-muted text-sm">No failed webhooks</p>
          : failedWebhooks.map((w) => (
              <div key={w.id} className="p-3 bg-surface rounded-xl border border-red-400/20 mb-2">
                <p className="text-ink text-xs font-semibold">{w.event_type}</p>
                <p className="text-red-400 text-xs">{w.error_message}</p>
                <p className="text-slate-muted text-xs">Retries: {w.retry_count} · {formatDateTime(w.created_at)}</p>
              </div>
            ))}
      </section>

      <Modal open={!!resolving} onClose={() => setResolving(null)} title="Resolve Stuck Order">
        <div className="space-y-3">
          <p className="text-slate-muted text-xs">
            Order #{resolving?.order_id?.slice(0,8).toUpperCase()} — {resolving?.reason}
          </p>
          <Input label="What did you do?" value={actionTaken} onChange={(e) => setActionTaken(e.target.value)}
            placeholder="e.g. Called the rider, confirmed delivery in person" />
          <Input label="Outcome" value={resolution} onChange={(e) => setResolution(e.target.value)}
            placeholder="e.g. Delivered successfully, marking resolved" />
          <Button size="xl" disabled={!actionTaken.trim() || !resolution.trim()} loading={interveneMutation.isPending}
            onClick={() => interveneMutation.mutate({
              order_id: resolving.order_id,
              sub_order_id: resolving.sub_order_id,
              reason: resolving.reason,
              action_taken: actionTaken,
              resolution,
            })}>
            Log & Resolve
          </Button>
        </div>
      </Modal>
    </div>
  );
}
