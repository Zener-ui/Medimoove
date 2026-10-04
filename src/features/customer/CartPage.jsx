import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, Package, X, AlertTriangle } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatNaira } from "@/utils";
import { getProduct } from "@/api/products";
import { getFeeSettings } from "@/api/fees";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, subtotal, clearCart, syncWithStock } = useCartStore();
  const { data: feeData } = useQuery({
    queryKey: ["fee-settings"],
    queryFn: getFeeSettings,
    staleTime: 5 * 60 * 1000,
  });
  const platformFeeRate = Number(feeData?.fees?.platform_fee_percentage ?? 3) / 100;
  const [stockNotice, setStockNotice] = useState(null);

  // Re-check live stock every time the cart is opened — a tab left open
  // for a while can hold quantities that no longer match what's actually
  // available. Checkout would still correctly reject an oversell, but the
  // customer wouldn't see why until they hit "place order".
  useEffect(() => {
    let cancelled = false;
    const productIds = [...new Set(items.map((i) => i.product_id))];
    if (productIds.length === 0) return;

    Promise.all(productIds.map((id) => getProduct(id).then((r) => [id, r.product]).catch(() => [id, null])))
      .then((pairs) => {
        if (cancelled) return;
        const liveProductsById = Object.fromEntries(pairs.filter(([, p]) => p));
        const result = syncWithStock(liveProductsById);
        if (result.changed) setStockNotice(result);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <TopBar title="Supply request" />
        {stockNotice && (
          <div className="mx-4 mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-600 space-y-0.5">
              {stockNotice.removed.map((name) => <p key={name}>{name} sold out and was removed from your cart.</p>)}
            </div>
          </div>
        )}
        <EmptyState icon={ShoppingCart} title="Your supply request is empty" description="Add medical supplies to get started" action={() => navigate("/customer/search")} actionLabel="Browse medical supplies" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40">
      <TopBar title={`Cart (${items.length})`} right={
        <button onClick={clearCart} className="text-red-400 text-xs">Clear request</button>
      } />

      <div className="px-4 py-3 space-y-3">
        {stockNotice && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-600 space-y-0.5">
              {stockNotice.removed.map((name) => <p key={name}>{name} sold out and was removed from your cart.</p>)}
              {stockNotice.reduced.map((r) => <p key={r.name}>{r.name} only has {r.to} left — quantity was adjusted from {r.from}.</p>)}
            </div>
          </div>
        )}
        {items.map((item) => {
          const key = `${item.product_id}_${item.variant_id || ""}`;
          return (
            <div key={key} className="flex gap-3 p-3 bg-surface rounded-2xl border border-surface-border">
              <div className="w-16 h-16 rounded-xl bg-surface-raised flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-soft" strokeWidth={1.5} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ink text-sm font-semibold truncate">{item.name}</p>
                <Link to={`/customer/store/${item.vendor_id}`} onClick={(e) => e.stopPropagation()} className="text-slate-muted text-xs hover:text-teal hover:underline inline-block">{item.vendor_name}</Link>
                <p className="text-teal font-bold text-sm mt-0.5">{formatNaira(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-surface-raised border border-surface-border text-ink flex items-center justify-center text-sm">−</button>
                  <span className="text-ink text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-surface-raised border border-surface-border text-ink flex items-center justify-center text-sm">+</button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.product_id, item.variant_id)} className="text-slate-muted hover:text-red-400"><X className="w-4 h-4" /></button>
                <p className="text-ink font-bold text-sm">{formatNaira(item.price * item.quantity)}</p>
              </div>
            </div>
          );
        })}

        {/* Order summary */}
        <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
          <h3 className="text-ink font-semibold text-sm mb-3">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Subtotal</span>
            <span className="text-ink">{formatNaira(subtotal())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Platform fee ({Math.round(platformFeeRate * 100)}%)</span>
            <span className="text-ink">{formatNaira(subtotal() * platformFeeRate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-muted">Delivery fee</span>
            <span className="text-slate-muted">Calculated at checkout</span>
          </div>
          <div className="border-t border-surface-border pt-2 flex justify-between">
            <span className="text-ink font-semibold">Estimated total</span>
            <span className="text-teal font-bold">{formatNaira(subtotal() * (1 + platformFeeRate))}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-navy border-t border-surface-border max-w-lg mx-auto">
        <Button size="xl" onClick={() => navigate("/customer/checkout")}>
          Proceed to Checkout · {formatNaira(subtotal() * (1 + platformFeeRate))}
        </Button>
      </div>
    </div>
  );
}
