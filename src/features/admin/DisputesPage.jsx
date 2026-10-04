import { useState } from "react";
import { Scale } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAdminDisputes, resolveDispute } from "@/api/admin";
import { formatDateTime } from "@/utils";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

export default function AdminDisputesPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [faultParty, setFaultParty] = useState("vendor");
  const [refundType, setRefundType] = useState("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [subOrderId, setSubOrderId] = useState("");
  const [note, setNote] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: getAdminDisputes,
  });
  const disputes = data?.disputes || [];

  const resolveMutation = useMutation({
    mutationFn: ({ id, payload }) => resolveDispute(id, payload),
    onSuccess: (response) => {
      const status = response?.refund_status;
      toast.success(
        status
          ? `Dispute resolved. Refund is ${status.replace("_", " ")}.`
          : "Dispute resolved."
      );
      qc.invalidateQueries(["admin-disputes"]);
      setSelected(null);
      setNote("");
      setPartialAmount("");
      setSubOrderId("");
    },
    onError: (err) => toast.error(err.message),
  });

  const openReview = (dispute) => {
    setSelected(dispute);
    setDecision("approved");
    setFaultParty("vendor");
    setRefundType("full");
    setPartialAmount("");
    setSubOrderId(dispute.sub_orders?.length === 1 ? dispute.sub_orders[0].id : "");
    setNote("");
  };

  const submitDecision = () => {
    if (!selected) return;

    if (decision === "approved") {
      if (!faultParty) return toast.error("Select who is responsible for the refund.");
      if (selected.sub_orders?.length > 1 && !subOrderId) {
        return toast.error("Select the affected sub-order.");
      }
      if (refundType === "partial" && (!partialAmount || Number(partialAmount) <= 0)) {
        return toast.error("Enter a valid partial refund amount.");
      }
    }

    resolveMutation.mutate({
      id: selected.id,
      payload: {
        decision,
        resolution_note: note,
        ...(decision === "approved"
          ? {
              sub_order_id: subOrderId || undefined,
              fault_party: faultParty,
              refund_type: refundType,
              partial_amount: refundType === "partial" ? Number(partialAmount) : undefined,
            }
          : {}),
      },
    });
  };

  const STATUS_COLORS = {
    open: "text-yellow-400",
    resolved: "text-teal",
    appealed: "text-blue-accent",
    closed: "text-slate-muted",
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Disputes</h1>

      {isError ? (
        <div className="p-4 bg-surface rounded-2xl border border-red-400/30 text-sm text-red-300">
          Failed to load disputes: {error?.message || "Unknown error"}
        </div>
      ) : (
        <div className="space-y-3">
          {isLoading
            ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
            : disputes.length === 0
              ? <EmptyState icon={Scale} title="No disputes" />
              : disputes.map((d) => (
                <div key={d.id} className="p-4 bg-surface rounded-2xl border border-surface-border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-ink font-semibold text-sm truncate">{d.reason}</p>
                      <p className="text-slate-muted text-xs">
                        Order: #{d.order_id?.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-slate-muted text-xs">{formatDateTime(d.created_at)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-slate-muted text-xs">Customer: {d.customer_contact?.full_name || "Unknown"}</span>
                        {d.customer_contact?.phone ? (
                          <>
                            <a
                              href={`tel:${d.customer_contact.phone}`}
                              className="inline-flex items-center rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-teal hover:text-teal"
                            >
                              Call {d.customer_contact.phone}
                            </a>
                            <a
                              href={`https://wa.me/${String(d.customer_contact.phone).replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-teal hover:text-teal"
                            >
                              WhatsApp / Video
                            </a>
                          </>
                        ) : (
                          <span className="text-red-300 text-xs">No phone number on file</span>
                        )}
                      </div>
                      {d.evidence_urls?.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {d.evidence_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="text-teal text-xs underline">
                              Evidence {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-semibold capitalize ml-2 ${STATUS_COLORS[d.status]}`}>
                      {d.status}
                    </span>
                  </div>

                  {d.status === "open" || d.status === "appealed" ? (
                    <Button size="sm" onClick={() => openReview(d)}>
                      Review & Resolve
                    </Button>
                  ) : null}

                  {d.decision && (
                    <p className={`text-xs mt-2 font-medium ${d.decision === "approved" ? "text-teal" : "text-red-400"}`}>
                      Decision: {d.decision} {d.resolution_note && `— ${d.resolution_note}`}
                    </p>
                  )}
                </div>
              ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Resolve Dispute">
        <div className="space-y-3">
          <p className="text-slate-muted text-sm leading-relaxed">{selected?.reason}</p>

          {selected?.customer_contact?.phone && (
            <div className="p-4 rounded-2xl border border-surface-border bg-surface">
              <p className="text-ink text-sm font-bold">Customer Contact</p>
              <p className="text-slate-muted text-xs mt-1">{selected.customer_contact.full_name || "Customer"}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <a
                  href={`tel:${selected.customer_contact.phone}`}
                  className="inline-flex items-center rounded-xl border border-surface-border px-3 py-2 text-xs font-semibold text-ink hover:border-teal hover:text-teal"
                >
                  Call {selected.customer_contact.phone}
                </a>
                <a
                  href={`https://wa.me/${String(selected.customer_contact.phone).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-xl border border-surface-border px-3 py-2 text-xs font-semibold text-ink hover:border-teal hover:text-teal"
                >
                  WhatsApp / Video
                </a>
              </div>
            </div>
          )}

          {selected?.order_financials && (
            <div className="p-4 rounded-2xl border border-surface-border bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-ink text-sm font-bold">Order Financials</p>
                <p className="text-ink text-lg font-bold">₦{Number(selected.order_financials.total || 0).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between gap-2"><span className="text-slate-muted">Items</span><span className="text-slate-soft">₦{Number(selected.order_financials.subtotal || 0).toLocaleString()}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-muted">Platform fee</span><span className="text-slate-soft">₦{Number(selected.order_financials.platform_fee || 0).toLocaleString()}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-muted">Delivery</span><span className="text-slate-soft">₦{Number(selected.order_financials.delivery_fee || 0).toLocaleString()}</span></div>
                <div className="flex justify-between gap-2"><span className="text-slate-muted">Discount</span><span className="text-slate-soft">-₦{Number(selected.order_financials.discount_amount || 0).toLocaleString()}</span></div>
              </div>
              {selected.payment && (
                <div className="pt-2 border-t border-surface-border flex justify-between text-xs">
                  <span className="text-slate-muted">Payment / refunded</span>
                  <span className="text-slate-soft">₦{Number(selected.payment.amount || 0).toLocaleString()} / ₦{Number(selected.payment.total_refunded || 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <p className="text-slate-soft text-sm font-medium mb-2">Decision</p>
            <div className="grid grid-cols-2 gap-2">
              {["approved", "rejected"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDecision(d)}
                  className={`p-3 rounded-xl border text-sm font-semibold capitalize transition-all ${
                    decision === d
                      ? d === "approved"
                        ? "border-teal bg-teal/10 text-teal"
                        : "border-red-400 bg-red-400/10 text-red-400"
                      : "border-surface-border text-slate-muted bg-surface"
                  }`}
                >
                  {d === "approved" ? "Approve Refund" : "Reject Claim"}
                </button>
              ))}
            </div>
          </div>

          {decision === "approved" && (
            <>
              {selected?.sub_orders?.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-slate-soft block mb-1.5">Affected Sub-order</label>
                  <select
                    value={subOrderId}
                    onChange={(e) => setSubOrderId(e.target.value)}
                    className="w-full bg-surface rounded-xl border border-surface-border text-ink px-4 py-3 text-sm outline-none focus:border-teal"
                  >
                    <option value="">Select sub-order</option>
                    {selected.sub_orders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.id.slice(0, 8)} — ₦{Number(so.subtotal || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-soft block mb-1.5">Who is responsible?</label>
                <select
                  value={faultParty}
                  onChange={(e) => setFaultParty(e.target.value)}
                  className="w-full bg-surface rounded-xl border border-surface-border text-ink px-4 py-3 text-sm outline-none focus:border-teal"
                >
                  <option value="vendor">Vendor — wrong/damaged item</option>
                  <option value="rider">Rider — damage/theft during delivery</option>
                  <option value="platform">Medimoove — platform/system fault</option>
                  <option value="customer">Customer — approved goodwill/refund</option>
                </select>
                {faultParty === "rider" && (
                  <p className={`mt-2 text-xs ${selected?.sub_orders?.length && (subOrderId ? selected.sub_orders.find((so) => so.id === subOrderId)?.rider_id : selected.sub_orders.some((so) => so.rider_id)) ? "text-slate-muted" : "text-red-300"}`}>
                    {selected?.sub_orders?.length && (subOrderId ? selected.sub_orders.find((so) => so.id === subOrderId)?.rider_id : selected.sub_orders.some((so) => so.rider_id))
                      ? "A rider is assigned to the selected affected sub-order."
                      : "Rider fault cannot be assigned: no rider is assigned to the affected sub-order."}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-slate-soft block mb-1.5">Refund amount</label>
                <select
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value)}
                  className="w-full bg-surface rounded-xl border border-surface-border text-ink px-4 py-3 text-sm outline-none focus:border-teal"
                >
                  <option value="full">Full sub-order refund</option>
                  <option value="partial">Partial refund</option>
                </select>
              </div>

              {refundType === "partial" && (
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="Amount in ₦"
                  className="w-full bg-surface rounded-xl border border-surface-border text-ink placeholder:text-slate-muted px-4 py-3 text-sm outline-none focus:border-teal"
                />
              )}
            </>
          )}

          <div>
            <label className="text-sm font-medium text-slate-soft block mb-1.5">Resolution Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Explain your decision..."
              className="w-full bg-surface rounded-xl border border-surface-border text-ink placeholder:text-slate-muted px-4 py-3 text-sm outline-none focus:border-teal resize-none"
            />
          </div>

          <p className="text-xs text-slate-muted">
            Approving a refund initiates a real Paystack refund. The customer's money is not considered
            refunded until Paystack reports the refund as processed.
          </p>

          <Button
            size="xl"
            variant={decision === "approved" ? "primary" : "danger"}
            onClick={submitDecision}
            loading={resolveMutation.isPending}
          >
            Confirm Decision
          </Button>
        </div>
      </Modal>
    </div>
  );
}
