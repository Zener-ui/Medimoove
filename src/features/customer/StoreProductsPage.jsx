import { useState } from "react";
import { Store, BadgeCheck, Star, Package, SearchX } from "lucide-react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getVendor } from "@/api/vendors";
import { searchProducts, getCategories } from "@/api/search";
import { formatNaira, getAvailabilityDisplay } from "@/utils";
import { getCategoryIcon } from "@/utils/categoryIcons";
import PublicCartButton from "@/components/common/PublicCartButton";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import Loader, { Skeleton } from "@/components/common/Loader";

const SORTS = [
  { value: "newest",     label: "Newest" },
  { value: "popular",    label: "Popular" },
  { value: "price_asc",  label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

// Store-first discovery, step 3: this store's products. Reached via
// the "View Products" button on the store's landing/profile page
// (StorePage.jsx) — products belong to the store the customer
// already chose, so there is no mixed-store product browsing
// anywhere in this flow. Category tabs and sort here filter WITHIN
// this one store only (vendor_id stays fixed on every request).
export default function StoreProductsPage() {
  const { id } = useParams();
  const location = useLocation();
  // Same page renders at /customer/store/:id/products (logged-in) and
  // /s/:id/products (public share link) — keep a public visitor on the
  // public path when they tap into a product, instead of dropping them
  // onto a route that requires login.
  const productBasePath = location.pathname.startsWith("/s") ? "/p" : "/customer/product";
  const [categoryId, setCategoryId] = useState("");
  const [sort, setSort] = useState("newest");

  const { data: vendorData, isLoading: vendorLoading, error: vendorError, refetch: refetchVendor } = useQuery({
    queryKey: ["store", id],
    queryFn: () => getVendor(id),
  });

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: Infinity });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["store-products", id, categoryId, sort],
    queryFn: () => searchProducts({ vendor_id: id, category_id: categoryId || undefined, sort, limit: 50 }),
    enabled: !!id,
    keepPreviousData: true,
  });

  if (vendorLoading) return <Loader fullscreen text="Loading store..." />;
  if (vendorError) return <ErrorState message={vendorError.message} onRetry={refetchVendor} />;

  const vendor = vendorData?.vendor;
  const products = productsData?.products || [];
  const avail = getAvailabilityDisplay(vendor?.availability_status);

  return (
    <div className="min-h-screen pb-8">
      <TopBar title={vendor?.business_name || "Store"} showBack />

      {/* Store header */}
      <div className="px-4 md:px-8 py-4 flex items-center gap-3 border-b border-surface-border">
        <div className="w-14 h-14 rounded-2xl bg-navy-mid border border-surface-border flex items-center justify-center shrink-0 overflow-hidden">
          {vendor?.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
          ) : <Store className="w-7 h-7 text-slate-soft" strokeWidth={1.5} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-ink font-semibold truncate">{vendor?.business_name}</p>
            {vendor?.is_verified && <BadgeCheck className="w-4 h-4 text-teal shrink-0" />}
          </div>
          <p className="text-slate-muted text-xs truncate">{vendor?.location}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-slate-muted text-xs">{vendor?.rating || "New"}</span>
            </span>
            <span className={`text-xs font-medium ${avail.color}`}>{avail.label}</span>
          </div>
        </div>
      </div>

      {/* Category tabs — scoped to this store; selecting one just
          narrows vendor_id's own products, never leaves the store. */}
      <div className="px-4 md:px-8 pt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoryId("")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${!categoryId ? "bg-teal text-navy border-teal" : "bg-surface border-surface-border text-slate-muted"}`}
        >
          All
        </button>
        {catData?.categories?.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${categoryId === c.id ? "bg-teal text-navy border-teal" : "bg-surface border-surface-border text-slate-muted"}`}
          >
            {(() => {
              const { icon: CatIcon, color } = getCategoryIcon(c.slug);
              return <CatIcon className={`w-3.5 h-3.5 ${categoryId === c.id ? "text-navy" : color}`} strokeWidth={2} />;
            })()}
            {c.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="px-4 md:px-8 pt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${sort === s.value ? "border-teal text-teal bg-teal/10" : "border-surface-border text-slate-muted bg-surface"}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="px-4 md:px-8 py-4">
        {productsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={categoryId ? "Nothing in this category yet" : "No products yet"}
            description={categoryId ? "Try a different category, or check back later." : `${vendor?.business_name || "This store"} hasn't listed any products yet.`}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((p) => (
              <Link key={p.id} to={`${productBasePath}/${p.id}`}>
                <Card hover className="overflow-hidden">
                  <div className="aspect-square bg-navy-mid flex items-center justify-center">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <Package className="w-10 h-10 text-slate-soft" strokeWidth={1.5} />}
                  </div>
                  <div className="p-3">
                    <p className="text-ink text-sm font-semibold line-clamp-2">{p.name}</p>
                    <p className="text-teal font-bold text-sm mt-1.5">{formatNaira(p.price)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {location.pathname.startsWith("/s") && <PublicCartButton />}
    </div>
  );
}
