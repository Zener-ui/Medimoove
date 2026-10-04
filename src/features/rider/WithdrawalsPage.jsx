import { useState } from "react";
import { Banknote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMyWithdrawals, requestRiderWithdrawal, getFeePreview, getPinStatus } from "@/api/withdrawals";
import { getRiderEarnings } from "@/api/riders";
import { formatNaira, formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import BankAccountFields from "@/components/common/BankAccountFields";
import WithdrawalPinModal from "@/components/common/WithdrawalPinModal";

const STATUS_COLORS = { PENDING:"text-yellow-400", PROCESSING:"text-yellow-400", COMPLETED:"text-teal", REJECTED:"text-red-400", FAILED:"text-red-400", REVERSED:"text-red-400" };

export default function RiderWithdrawalsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [form, setForm] = useState({ amount:"", bank_account:"", bank_code:"", bank_name:"", account_name:"" });
  const [verifiedAccount, setVerifiedAccount] = useState(null);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);

  const { data: earningsData } = useQuery({ queryKey: ["rider-earnings"], queryFn: getRiderEarnings });
  const { data: historyData, isLoading } = useQuery({ queryKey: ["my-withdrawals"], queryFn: getMyWithdrawals });
  const { data: pinStatusData } = useQuery({ queryKey: ["withdrawal-pin-status"], queryFn: getPinStatus });
  const available = earningsData?.available_balance || 0;
  const hasPin = !!pinStatusData?.pin_set;

  const previewMutation = useMutation({ mutationFn: getFeePreview, onSuccess: (d) => setPreview(d.breakdown) });

  const mutation = useMutation({
    mutationFn: requestRiderWithdrawal,
    onSuccess: () => {
      toast.success("Withdrawal submitted");
      qc.invalidateQueries(["my-withdrawals"]);
      qc.invalidateQueries(["rider-earnings"]);
      setOpen(false);
      setPinOpen(false);
      setPreview(null);
      setForm({ amount:"", bank_account:"", bank_code:"", bank_name:"", account_name:"" });
      setVerifiedAccount(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter amount";
    if (Number(form.amount) > available) e.amount = "Exceeds available balance";
    if (!verifiedAccount) e.bank_account = "Verify your bank account before submitting";
    setErrors(e); return !Object.keys(e).length;
  };

  const handlePinVerified = (pin) => {
    mutation.mutate({ ...form, amount: Number(form.amount), pin });
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Withdrawals" />
      <div className="px-4 py-3 space-y-4">
        <Card className="p-4 flex items-center justify-between">
          <div><p className="text-slate-muted text-xs">Available</p><p className="text-teal text-2xl font-black">{formatNaira(available)}</p></div>
          <Button onClick={() => setOpen(true)} disabled={available <= 0}>Withdraw</Button>
        </Card>
        <div>
          <h3 className="text-ink font-semibold text-sm mb-3">History</h3>
          {isLoading ? null : (historyData?.withdrawals || []).length === 0 ? <EmptyState icon={Banknote} title="No withdrawals yet" /> :
            historyData.withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-surface-border mb-2">
                <div><p className="text-ink text-xs font-semibold">{formatNaira(w.net_payout)}</p><p className="text-slate-muted text-[10px]">{formatDate(w.requested_at)}</p></div>
                <span className={`text-xs font-semibold ${STATUS_COLORS[w.status] || "text-slate-muted"}`}>{w.status}</span>
              </div>
            ))}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Withdraw Earnings">
        <div className="space-y-3">
          <Input label="Amount (₦)" type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} onBlur={() => form.amount && previewMutation.mutate(Number(form.amount))} error={errors.amount} />
          {preview && (
            <div className="p-3 bg-surface rounded-xl border border-surface-border text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-muted">Fee</span><span className="text-red-400">-{formatNaira(preview.withdrawal_fee)}</span></div>
              <div className="flex justify-between font-bold border-t border-surface-border pt-1"><span className="text-ink">You receive</span><span className="text-teal">{formatNaira(preview.net_payout)}</span></div>
            </div>
          )}
          <BankAccountFields form={form} setForm={setForm} errors={errors} verifiedAccount={verifiedAccount} setVerifiedAccount={setVerifiedAccount} />
          <Button size="xl" onClick={() => { if (validate()) setPinOpen(true); }} loading={mutation.isPending}>Submit</Button>
        </div>
      </Modal>

      <WithdrawalPinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        hasPin={hasPin}
        onVerified={handlePinVerified}
        verifying={mutation.isPending}
      />
    </div>
  );
}
