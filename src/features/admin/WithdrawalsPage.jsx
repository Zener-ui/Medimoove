import { useState } from "react";
import { Banknote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllWithdrawals, approveWithdrawal, rejectWithdrawal } from "@/api/withdrawals";
import { formatNaira, formatDate } from "@/utils";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Loader";

const STATUS_COLORS = { PENDING:"text-yellow-400", COMPLETED:"text-teal", REJECTED:"text-red-400", APPROVED:"text-blue-accent", PROCESSING:"text-yellow-400", FAILED:"text-red-400", REVERSED:"text-red-400" };

export default function AdminWithdrawalsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("PENDING");
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState("");
  const [proof, setProof] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["admin-withdrawals", tab], queryFn: () => getAllWithdrawals(tab) });
  const withdrawals = data?.withdrawals || [];

  const approveMutation = useMutation({
    mutationFn: (id) => approveWithdrawal(id, proof),
    onSuccess: () => { toast.success("Withdrawal approved"); qc.invalidateQueries(["admin-withdrawals"]); setProof(""); },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => rejectWithdrawal(id, reason),
    onSuccess: () => { toast.success("Withdrawal rejected"); qc.invalidateQueries(["admin-withdrawals"]); setRejectModal(null); setReason(""); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Payouts</h1>
      <div className="flex gap-2 mb-4">
        {["PENDING","PROCESSING","COMPLETED","FAILED","REVERSED","REJECTED"].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-xs font-medium border capitalize transition-all ${tab === t ? "bg-teal text-navy border-teal" : "border-surface-border text-slate-muted bg-surface"}`}>
            {t}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <ErrorState message={error?.message} onRetry={refetch} />
      ) : withdrawals.length === 0 ? (
        <EmptyState icon={Banknote} title={`No ${tab.toLowerCase()} withdrawals`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {withdrawals.map((w) => (
              <div key={w.id} className="p-4 bg-surface rounded-2xl border border-surface-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-ink font-semibold">{w.account_name}</p>
                    <p className="text-slate-muted text-xs">{w.bank_name} · {w.bank_account}</p>
                    <p className="text-slate-muted text-xs">{w.users?.full_name} ({w.requester_type})</p>
                    <p className="text-slate-muted text-xs">{formatDate(w.requested_at)}</p>
                  </div>
                  <span className={`text-xs font-semibold ${STATUS_COLORS[w.status]}`}>{w.status}</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-muted">Net payout</span>
                  <span className="text-teal font-black text-base">{formatNaira(w.net_payout)}</span>
                </div>
                <p className="text-slate-muted text-xs mb-3">Gross: {formatNaira(w.gross_amount)} · Fee: {formatNaira(w.withdrawal_fee)}</p>
                {w.paystack_status && <p className="text-slate-muted text-xs mb-1">Paystack: {w.paystack_status}</p>}
                {w.failure_reason && <p className="text-red-400 text-xs mb-3">{w.failure_reason}</p>}
                {w.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="danger" className="flex-1" onClick={() => { setRejectModal(w); setReason(""); }}>Reject</Button>
                    <Button size="sm" className="flex-1" onClick={() => approveMutation.mutate(w.id)} loading={approveMutation.isPending}>Approve & Send</Button>
                  </div>
                )}
              </div>
          ))}
        </div>
      )}

      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Withdrawal">
        <div className="space-y-3">
          <p className="text-slate-muted text-sm">Rejecting {formatNaira(rejectModal?.gross_amount)} request from <span className="text-ink">{rejectModal?.account_name}</span></p>
          <Input label="Reason" placeholder="e.g. Insufficient documentation" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button size="xl" variant="danger" onClick={() => { if (!reason.trim()) { toast.error("Reason required"); return; } rejectMutation.mutate({ id: rejectModal.id, reason }); }} loading={rejectMutation.isPending}>
            Confirm Rejection
          </Button>
        </div>
      </Modal>
    </div>
  );
}
