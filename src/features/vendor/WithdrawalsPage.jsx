import { useState } from "react";
import { Banknote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMyWithdrawals, requestVendorWithdrawal, getFeePreview, getPinStatus } from "@/api/withdrawals";
import { getVendorEarnings } from "@/api/vendors";
import { formatNaira, formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import BankAccountFields from "@/components/common/BankAccountFields";
import WithdrawalPinModal from "@/components/common/WithdrawalPinModal";

const STATUS_COLORS = { PENDING:"text-yellow-400", APPROVED:"text-teal", PROCESSING:"text-yellow-400", COMPLETED:"text-teal", REJECTED:"text-red-400", FAILED:"text-red-400", REVERSED:"text-red-400" };

export default function VendorWithdrawalsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", bank_account: "", bank_code: "", bank_name: "", account_name: "" });
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const { data: earningsData } = useQuery({ queryKey: ["vendor-earnings"], queryFn: getVendorEarnings });
  const { data: withdrawalData, isLoading } = useQuery({ queryKey: ["my-withdrawals"], queryFn: getMyWithdrawals });
  const { data: pinStatusData } = useQuery({ queryKey: ["withdrawal-pin-status"], queryFn: getPinStatus });
  const available = earningsData?.available_balance || 0;
  const withdrawals = withdrawalData?.withdrawals || [];
  const hasPin = !!pinStatusData?.pin_set;

  const previewMutation = useMutation({
    mutationFn: (amount) => getFeePreview(amount),
    onSuccess: (d) => setPreview(d.breakdown),
    onError: () => setPreview(null),
  });

  const withdrawMutation = useMutation({
    mutationFn: requestVendorWithdrawal,
    onSuccess: () => {
      toast.success("Payout request submitted");
      qc.invalidateQueries(["my-withdrawals"]);
      qc.invalidateQueries(["vendor-earnings"]);
      setModalOpen(false);
      setPinModalOpen(false);
      setForm({ amount: "", bank_account: "", bank_code: "", bank_name: "", account_name: "" });
      setVerifiedAccount(null);
      setPreview(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (Number(form.amount) > available) e.amount = `Exceeds available balance of ${formatNaira(available)}`;
    if (!verifiedAccount) e.bank_account = "Verify your bank account before submitting";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleAmountBlur = () => {
    if (form.amount && Number(form.amount) > 0) previewMutation.mutate(Number(form.amount));
  };

  // Validate the request details first, then gate the actual submission
  // behind the withdrawal PIN — entered fresh on every withdrawal.
  const handleSubmit = () => {
    if (!validate()) return;
    setPinModalOpen(true);
  };

  const handlePinVerified = (pin) => {
    withdrawMutation.mutate({ ...form, amount: Number(form.amount), pin });
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Payouts" />
      <div className="px-4 py-3 space-y-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-slate-muted text-xs">Available Balance</p>
            <p className="text-teal text-2xl font-black">{formatNaira(available)}</p>
          </div>
          <Button onClick={() => setModalOpen(true)} disabled={available <= 0}>Request Payout</Button>
        </Card>

        <div>
          <h3 className="text-ink font-semibold text-sm mb-3">Payout History</h3>
          {isLoading ? null : withdrawals.length === 0
            ? <EmptyState icon={Banknote} title="No payouts yet" />
            : withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border mb-2">
                  <div>
                    <p className="text-ink text-xs font-semibold">{formatNaira(w.net_payout)}</p>
                    <p className="text-slate-muted text-[10px]">Fee: {formatNaira(w.withdrawal_fee)} {w.fee_was_capped ? "(capped)" : ""}</p>
                    <p className="text-slate-muted text-[10px]">{formatDate(w.requested_at)}</p>
                  </div>
                  <span className={`text-xs font-semibold ${STATUS_COLORS[w.status] || "text-slate-muted"}`}>{w.status}</span>
                </div>
              ))}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request Payout">
        <div className="space-y-3">
          <div className="p-3 bg-teal/5 border border-teal/20 rounded-xl">
            <p className="text-teal text-xs font-medium">Available: {formatNaira(available)}</p>
          </div>
          <Input label="Amount (₦)" type="number" min="1" max={available}
            value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            onBlur={handleAmountBlur} error={errors.amount} />

          {preview && (
            <div className="p-3 bg-surface rounded-xl border border-surface-border text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-muted">Gross</span><span className="text-ink">{formatNaira(preview.gross_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-muted">Fee (1%{preview.fee_was_capped ? " capped" : ""})</span><span className="text-red-400">-{formatNaira(preview.withdrawal_fee)}</span></div>
              <div className="flex justify-between font-bold border-t border-surface-border pt-1"><span className="text-ink">You receive</span><span className="text-teal">{formatNaira(preview.net_payout)}</span></div>
            </div>
          )}

          <BankAccountFields form={form} setForm={setForm} errors={errors} verifiedAccount={verifiedAccount} setVerifiedAccount={setVerifiedAccount} />
          <Button size="xl" onClick={handleSubmit} loading={withdrawMutation.isPending}>Submit Payout Request</Button>
        </div>
      </Modal>

      <WithdrawalPinModal
        open={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        hasPin={hasPin}
        onVerified={handlePinVerified}
        verifying={withdrawMutation.isPending}
      />
    </div>
  );
}
