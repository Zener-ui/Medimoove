import { useState } from "react";
import { Ticket, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { getAllCoupons, createCoupon, toggleCoupon } from "@/api/platform";
import { getAdminVendors } from "@/api/admin";
import { formatNaira, formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

const TYPE_LABELS = {
  percentage: "% off",
  fixed: "₦ off",
  free_delivery: "Free delivery",
};

const EMPTY_FORM = {
  code: "", description: "", type: "percentage", value: "",
  max_discount_amount: "", min_order_amount: "", vendor_id: "",
  usage_limit: "", usage_limit_per_customer: "1", expires_at: "",
};

// How a coupon's value/limits summarize into one readable line —
// kept here rather than inline in the list so the row markup stays
// simple to scan.
const describeCoupon = (c) => {
  const parts = [];
  if (c.type === "percentage") parts.push(`${c.value}% off`);
  else if (c.type === "fixed") parts.push(`${formatNaira(c.value)} off`);
  else parts.push("Free delivery");
  if (c.max_discount_amount) parts.push(`capped at ${formatNaira(c.max_discount_amount)}`);
  if (c.min_order_amount > 0) parts.push(`min order ${formatNaira(c.min_order_amount)}`);
  if (c.vendor_id) parts.push(c.vendors?.business_name ? `${c.vendors.business_name} only` : "one vendor only");
  else parts.push("all vendors");
  return parts.join(" · ");
};

export default function CouponsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: getAllCoupons });
  const { data: vendorsData } = useQuery({
    queryKey: ["admin-vendors", "approved"],
    queryFn: () => getAdminVendors("approved"),
    enabled: open, // only fetch once the create form is actually opened
  });

  const coupons = data?.coupons || [];
  const vendors = vendorsData?.vendors || [];

  const create = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      toast.success("Coupon created.");
      setOpen(false);
      setForm(EMPTY_FORM);
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: toggleCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    create.mutate({
      code: form.code,
      description: form.description || undefined,
      type: form.type,
      value: form.type === "free_delivery" ? undefined : Number(form.value),
      max_discount_amount: form.max_discount_amount ? Number(form.max_discount_amount) : undefined,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
      vendor_id: form.vendor_id || undefined,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : undefined,
      usage_limit_per_customer: form.usage_limit_per_customer ? Number(form.usage_limit_per_customer) : undefined,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
    });
  };

  const canSubmit = form.code.trim() && (form.type === "free_delivery" || Number(form.value) > 0);

  return (
    <div className="min-h-screen">
      <TopBar title="Coupons" />
      <div className="px-4 py-3 space-y-4">
        <Button onClick={() => setOpen(true)} className="flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Coupon
        </Button>

        {isLoading ? (
          <p className="text-slate-muted text-sm">Loading…</p>
        ) : coupons.length === 0 ? (
          <Card className="p-6 text-center">
            <Ticket className="w-8 h-8 text-slate-muted mx-auto mb-2" />
            <p className="text-slate-muted text-sm">No coupons yet — create your first one above.</p>
          </Card>
        ) : (
          coupons.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-ink font-bold text-sm tracking-wide">{c.code}</p>
                  <p className="text-slate-muted text-xs mt-0.5">{describeCoupon(c)}</p>
                  {c.description && <p className="text-slate-muted text-[11px] mt-1">{c.description}</p>}
                  <p className="text-slate-muted text-[11px] mt-1">
                    Used {c.times_used || 0}{c.usage_limit ? `/${c.usage_limit}` : ""} times
                    {c.expires_at ? ` · expires ${formatDate(c.expires_at)}` : " · no expiry"}
                  </p>
                </div>
                <button
                  onClick={() => toggle.mutate(c.id)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold border flex-shrink-0",
                    c.is_active ? "border-teal bg-teal/10 text-teal" : "border-surface-border text-slate-muted"
                  )}
                >
                  {c.is_active ? "Active" : "Paused"}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Coupon" size="lg">
        <div className="space-y-3">
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
          <Input label="Description (optional, internal note)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Launch week first-order discount" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-soft">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off (₦)</option>
              <option value="free_delivery">Free delivery</option>
            </select>
          </div>

          {form.type !== "free_delivery" && (
            <Input
              label={form.type === "percentage" ? "Percentage (e.g. 10 for 10%)" : "Amount off (₦)"}
              type="number" min="1" value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          )}

          {form.type === "percentage" && (
            <Input label="Max discount cap (₦, optional)" type="number" min="0" value={form.max_discount_amount}
              onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
              helper="Stops a big order from getting an unexpectedly huge discount" />
          )}

          <Input label="Minimum order amount (₦, optional)" type="number" min="0" value={form.min_order_amount}
            onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-soft">Scope</label>
            <select
              value={form.vendor_id}
              onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
              className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
            >
              <option value="">All vendors (platform-wide)</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.business_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Total uses (optional)" type="number" min="1" value={form.usage_limit}
              onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" />
            <Input label="Uses per customer" type="number" min="1" value={form.usage_limit_per_customer}
              onChange={(e) => setForm({ ...form, usage_limit_per_customer: e.target.value })} />
          </div>

          <Input label="Expires (optional)" type="date" value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />

          <p className="text-slate-muted text-[11px]">
            Discounts are paid out of the Promotions Budget — make sure it's funded before this coupon goes live, or redemptions will fail.
          </p>

          <Button size="xl" disabled={!canSubmit} loading={create.isPending} onClick={handleSubmit}>
            Create Coupon
          </Button>
        </div>
      </Modal>
    </div>
  );
}
