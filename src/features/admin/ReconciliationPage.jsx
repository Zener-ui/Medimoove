import { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { reconcileBalances, reconcilePayments } from "@/api/admin";
import { formatNaira } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";

export default function ReconciliationPage() {
  const [mismatches, setMismatches] = useState(null); // null = not checked yet
  const [paymentResult, setPaymentResult] = useState(null);

  const checkBalances = useMutation({
    mutationFn: reconcileBalances,
    onSuccess: (res) => setMismatches(res.mismatches || []),
    onError: (e) => toast.error(e.message),
  });

  const runPaymentReconciliation = useMutation({
    mutationFn: reconcilePayments,
    onSuccess: (res) => {
      setPaymentResult(res);
      toast.success(`Checked ${res.checked}, resolved ${res.resolved}.`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <TopBar title="Reconciliation" />
      <div className="px-4 py-3 space-y-4">
        <Card className="p-4 space-y-3">
          <div>
            <p className="text-ink font-semibold text-sm">Balance Drift Check</p>
            <p className="text-slate-muted text-xs mt-1">
              Compares every user's stored balance against the sum of their actual ledger entries. Read-only — flags mismatches, never corrects them automatically.
            </p>
          </div>
          <Button loading={checkBalances.isPending} onClick={() => checkBalances.mutate()}>
            Check Balances
          </Button>

          {mismatches !== null && (
            mismatches.length === 0 ? (
              <div className="flex items-center gap-2 text-teal text-sm bg-teal/5 border border-teal/20 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                All balances match their ledgers.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-orange-400 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> {mismatches.length} mismatch{mismatches.length !== 1 ? "es" : ""} found
                </p>
                {mismatches.map((m) => (
                  <div key={m.user_id} className="p-3 bg-surface rounded-xl border border-orange-400/20 text-xs">
                    <p className="text-ink font-mono">{m.user_id.slice(0, 8)}…</p>
                    <p className="text-slate-muted mt-1">
                      Balance table: {formatNaira(m.balance_table_amount)} · Ledger sum: {formatNaira(m.ledger_sum)}
                    </p>
                    <p className="text-orange-400 font-semibold mt-1">Drift: {formatNaira(m.drift)}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <div>
            <p className="text-ink font-semibold text-sm">Payment Reconciliation</p>
            <p className="text-slate-muted text-xs mt-1">
              Manually runs the same stale-payment check that normally runs on a schedule — checks orders stuck in "pending payment" directly against Paystack instead of waiting for the next scheduled pass.
            </p>
          </div>
          <Button loading={runPaymentReconciliation.isPending} onClick={() => runPaymentReconciliation.mutate()}>
            Run Now
          </Button>

          {paymentResult && (
            <div className="p-3 bg-surface rounded-xl border border-surface-border text-xs">
              <p className="text-ink">Checked: <span className="font-bold">{paymentResult.checked}</span></p>
              <p className="text-ink">Resolved: <span className="font-bold">{paymentResult.resolved}</span></p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
