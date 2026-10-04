import { useState, useEffect } from "react";
import { Percent } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getFeeSettings } from "@/api/fees";
import { updateWithdrawalFeeSettings } from "@/api/withdrawals";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function FeeSettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["fee-settings-admin"], queryFn: getFeeSettings });
  const fees = data?.fees;

  const [percentage, setPercentage] = useState("");
  const [cap, setCap] = useState("");

  useEffect(() => {
    if (fees) {
      setPercentage(String(fees.withdrawal_fee_percentage));
      setCap(String(fees.withdrawal_fee_cap));
    }
  }, [fees]);

  const save = useMutation({
    mutationFn: () => updateWithdrawalFeeSettings({
      withdrawal_fee_percentage: Number(percentage),
      withdrawal_fee_cap: Number(cap),
    }),
    onSuccess: () => {
      toast.success("Withdrawal fee settings updated.");
      qc.invalidateQueries({ queryKey: ["fee-settings-admin"] });
    },
    onError: (e) => toast.error(e.message),
  });

  // What a ₦20,000 withdrawal would actually cost at these settings —
  // makes the percentage-vs-cap interaction concrete instead of two
  // abstract numbers an admin has to do the math on themselves.
  const previewAmount = 20000;
  const previewFee = percentage && cap
    ? Math.min(Math.round((Number(percentage) / 100) * previewAmount), Number(cap))
    : null;

  return (
    <div className="min-h-screen">
      <TopBar title="Withdrawal Fee Settings" />
      <div className="px-4 py-3 space-y-4">
        {isLoading ? (
          <p className="text-slate-muted text-sm">Loading…</p>
        ) : (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Percent className="w-5 h-5 text-slate-muted" />
                <div>
                  <p className="text-ink text-sm font-semibold">Platform fee: {fees?.platform_fee_percentage}%</p>
                  <p className="text-slate-muted text-[11px]">The cut taken on each sale — reference only, not editable here.</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <p className="text-ink font-semibold text-sm">Withdrawal Fee</p>
              <p className="text-slate-muted text-xs">
                Charged to vendors and riders when they withdraw their balance to their bank account.
              </p>
              <Input label="Fee percentage (%)" type="number" min="0" max="100" step="0.1"
                value={percentage} onChange={(e) => setPercentage(e.target.value)} />
              <Input label="Fee cap (₦)" type="number" min="0" value={cap}
                onChange={(e) => setCap(e.target.value)}
                helper="The fee never exceeds this, no matter how large the withdrawal." />

              {previewFee !== null && (
                <p className="text-slate-muted text-xs bg-surface rounded-xl p-3">
                  Example: withdrawing {previewAmount.toLocaleString()} would cost a {previewFee.toLocaleString()} fee at these settings.
                </p>
              )}

              <Button size="xl" loading={save.isPending} disabled={!percentage || !cap} onClick={() => save.mutate()}>
                Save Changes
              </Button>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
