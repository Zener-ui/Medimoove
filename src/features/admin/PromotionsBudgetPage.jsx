import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getPromotionsBudget, depositPromotionsBudget, verifyPromotionsFunding } from "@/api/platform";
import { formatNaira, formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

// Human-readable labels for the ledger `type` column — same idea as
// getStatusDisplay elsewhere in the app, just scoped to this one page
// since these types are specific to promotions_ledger_entries.
const TYPE_LABELS = {
  DEPOSIT: "Deposit",
  COUPON_DISCOUNT: "Coupon discount",
  REFERRAL_REWARD: "Referral reward",
  ADJUSTMENT: "Adjustment",
};

export default function PromotionsBudgetPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["promotions-budget"], queryFn: getPromotionsBudget });

  const budget = data?.budget || {};
  const activity = data?.recent_activity || [];

  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("funding_reference");
    if (!reference) return;

    verifyPromotionsFunding(reference)
      .then((result) => {
        if (result?.status === "successful") {
          toast.success("Promotions funding confirmed.");
          qc.invalidateQueries({ queryKey: ["promotions-budget"] });
        }
      })
      .catch((e) => toast.error(e.message || "Could not verify the Paystack payment."))
      .finally(() => {
        const url = new URL(window.location.href);
        url.searchParams.delete("funding_reference");
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ""));
      });
  }, [qc]);

  const deposit = useMutation({
    mutationFn: depositPromotionsBudget,
    onSuccess: (result) => {
      const authorizationUrl = result?.authorization_url;
      if (!authorizationUrl) {
        toast.error("Paystack did not return a checkout link. No promotional funds were added.");
        return;
      }

      // Do not show a fake "topped up" success here. The budget is only
      // credited after Paystack confirms the payment. Send the admin to
      // the real Paystack checkout first.
      window.location.assign(authorizationUrl);
    },
    onError: (e) => toast.error(e.message || "Could not start promotions funding."),
  });

  return (
    <div className="min-h-screen">
      <TopBar title="Promotions Budget" />
      <div className="px-4 py-3 space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-teal" />
            <p className="text-slate-muted text-xs">Available for Promotions</p>
          </div>
          <p className="text-teal text-3xl font-black mt-2">{isLoading ? "—" : formatNaira(budget.balance || 0)}</p>
          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div><p className="text-slate-muted">Total deposited</p><p className="text-ink font-bold">{formatNaira(budget.total_deposited || 0)}</p></div>
            <div><p className="text-slate-muted">Total spent</p><p className="text-ink font-bold">{formatNaira(budget.total_spent || 0)}</p></div>
          </div>
          <p className="text-slate-muted text-[11px] mt-3">
            Funds are added through Paystack and only enter this budget after Paystack confirms the payment. Every coupon discount and referral reward draws from this balance.
          </p>
          <Button className="mt-4" onClick={() => setOpen(true)}>Add Funds</Button>
        </Card>

        <Card className="p-4">
          <h3 className="text-ink font-semibold text-sm mb-3">Activity</h3>
          {activity.length === 0 ? (
            <p className="text-slate-muted text-sm">No promotions activity yet.</p>
          ) : (
            activity.map((e) => (
              <div key={e.id} className="flex justify-between py-2 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-ink text-xs font-medium">{TYPE_LABELS[e.type] || e.type}</p>
                  {e.description && <p className="text-slate-muted text-[10px]">{e.description}</p>}
                  <p className="text-slate-muted text-[10px]">{formatDate(e.created_at)}</p>
                </div>
                <span className={`text-xs font-bold whitespace-nowrap ${Number(e.amount) >= 0 ? "text-teal" : "text-red-400"}`}>
                  {Number(e.amount) >= 0 ? "+" : ""}{formatNaira(e.amount)}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Funds to Promotions Budget">
        <div className="space-y-3">
          <p className="text-slate-muted text-xs">You’ll be redirected to Paystack to make the funding payment. The promotions budget is credited only after Paystack confirms the payment.</p>
          <Input label="Amount (₦)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Note (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. October launch promo" />
          <Button size="xl" disabled={!amount || Number(amount) <= 0} loading={deposit.isPending}
            onClick={() => deposit.mutate({ amount: Number(amount), description })}>
            Add Funds
          </Button>
        </div>
      </Modal>
    </div>
  );
}
