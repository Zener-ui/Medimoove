import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";

// Public storefront pages (/s/:id, /s/:id/products, /p/:id) deliberately
// don't get the full CustomerLayout bottom nav — Home/Search/Orders/Profile
// don't make sense for a stranger with no account yet. But Cart does:
// someone browsing without an account can still add items, and needs a
// way to actually see and reach that cart. This is that, minimal —
// just a floating button, not the full nav bar.
//
// Tapping it sends them to /customer/cart same as normal — if they're
// not logged in yet, ProtectedRoute sends them to login/register and
// (per the earlier fix) back to their cart afterward, same flow as
// checkout already uses.
export default function PublicCartButton({ raised = false }) {
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => navigate("/customer/cart")}
      className={`fixed right-5 z-[110] flex items-center gap-2 bg-teal text-navy font-semibold text-sm px-4 py-3 rounded-full shadow-lg ${
        // StorePage's "View Products" bar and ProductPage's Add-to-Cart
        // bar both sit fixed at the bottom already — raised pushes this
        // button up above them instead of overlapping. StoreProductsPage
        // has no competing bar, so it stays low and out of the way.
        raised ? "bottom-[calc(9rem+env(safe-area-inset-bottom))]" : "bottom-[calc(5rem+env(safe-area-inset-bottom))]"
      }`}
    >
      <span className="relative">
        <ShoppingCart className="w-5 h-5" strokeWidth={2.5} />
        <span className="absolute -top-2 -right-2 bg-navy text-teal text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      </span>
      Cart
    </button>
  );
}
