import { useState } from "react";
import { Store } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAdminVendors, approveVendor, rejectVendor, suspendVendor, reactivateVendor } from "@/api/admin";
import { formatDate } from "@/utils";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Loader";

const TABS = ["pending","approved","rejected","suspended"];
const STATUS_COLORS = { pending:"text-yellow-400", approved:"text-teal", rejected:"text-red-400", suspended:"text-slate-muted" };

export default function AdminVendorsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [rejectModal, setRejectModal] = useState(null);
  const [suspendModal, setSuspendModal] = useState(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["admin-vendors", tab], queryFn: () => getAdminVendors(tab) });
  const vendors = data?.vendors || [];

  const approveMutation = useMutation({
    mutationFn: approveVendor,
    onSuccess: () => { toast.success("Vendor approved"); qc.invalidateQueries(["admin-vendors"]); },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectVendor(id, reason),
    onSuccess: () => { toast.success("Vendor rejected"); qc.invalidateQueries(["admin-vendors"]); setRejectModal(null); setReason(""); },
    onError: (err) => toast.error(err.message),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }) => suspendVendor(id, reason),
    onSuccess: () => { toast.success("Vendor suspended"); qc.invalidateQueries(["admin-vendors"]); setSuspendModal(null); setReason(""); },
    onError: (err) => toast.error(err.message),
  });

  const reactivateMutation = useMutation({
    mutationFn: reactivateVendor,
    onSuccess: () => { toast.success("Vendor reactivated"); qc.invalidateQueries(["admin-vendors"]); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Vendors</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium border capitalize transition-all ${tab === t ? "bg-teal text-navy border-teal" : "border-surface-border text-slate-muted bg-surface"}`}>
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} />
      ) : vendors.length === 0 ? (
        <EmptyState icon={Store} title={`No ${tab} vendors`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {vendors.map((v) => (
              <div key={v.id} className="p-4 bg-surface rounded-2xl border border-surface-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-ink font-semibold">{v.business_name}</p>
                    <p className="text-slate-muted text-xs">{v.category} · {v.location}</p>
                    <p className="text-slate-muted text-xs">{v.users?.email} · {v.users?.phone}</p>
                  </div>
                  <span className={`text-xs font-semibold capitalize ${STATUS_COLORS[v.status]}`}>{v.status}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-slate-muted text-xs">{formatDate(v.created_at)}</p>
                  {v.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" onClick={() => { setRejectModal(v); setReason(""); }}>Reject</Button>
                      <Button size="sm" onClick={() => approveMutation.mutate(v.id)} loading={approveMutation.isPending && approveMutation.variables === v.id}>Approve</Button>
                    </div>
                  )}
                  {v.status === "approved" && (
                    <Button size="sm" variant="danger" onClick={() => { setSuspendModal(v); setReason(""); }}>Suspend</Button>
                  )}
                  {v.status === "suspended" && (
                    <Button size="sm" onClick={() => reactivateMutation.mutate(v.id)} loading={reactivateMutation.isPending && reactivateMutation.variables === v.id}>Reactivate</Button>
                  )}
                </div>
                {v.rejection_reason && <p className="text-red-400 text-xs mt-2 p-2 bg-red-400/10 rounded-lg">Reason: {v.rejection_reason}</p>}
                {v.suspension_reason && <p className="text-red-400 text-xs mt-2 p-2 bg-red-400/10 rounded-lg">Suspended: {v.suspension_reason}</p>}
              </div>
          ))}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Vendor">
        <div className="space-y-3">
          <p className="text-slate-muted text-sm">Rejecting: <span className="text-ink font-semibold">{rejectModal?.business_name}</span></p>
          <Input label="Reason for rejection" placeholder="e.g. Incomplete documents" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button size="xl" variant="danger" onClick={() => { if (!reason.trim()) { toast.error("Reason required"); return; } rejectMutation.mutate({ id: rejectModal.id, reason }); }} loading={rejectMutation.isPending}>
            Confirm Rejection
          </Button>
        </div>
      </Modal>

      <Modal open={!!suspendModal} onClose={() => setSuspendModal(null)} title="Suspend Vendor">
        <div className="space-y-3">
          <p className="text-slate-muted text-sm">Suspending: <span className="text-ink font-semibold">{suspendModal?.business_name}</span></p>
          <p className="text-slate-muted text-xs">This immediately blocks them from their dashboard and receiving new orders, until reactivated.</p>
          <Input label="Reason for suspension" placeholder="e.g. Repeated quality complaints" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button size="xl" variant="danger" onClick={() => { if (!reason.trim()) { toast.error("Reason required"); return; } suspendMutation.mutate({ id: suspendModal.id, reason }); }} loading={suspendMutation.isPending}>
            Confirm Suspension
          </Button>
        </div>
      </Modal>
    </div>
  );
}
