import { useQuery } from "@tanstack/react-query";
import { Bell, ShoppingCart, Store, Package, Search, Star, ArrowRight, Truck, ClipboardList, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getHomepageData } from "@/api/search";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { formatNaira, getAvailabilityDisplay } from "@/utils";
import { getCategoryIcon, getHealthcareCategoryName } from "@/utils/categoryIcons";
import { Skeleton } from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";
import Card from "@/components/common/Card";


// Cosmetic-only distance/time for now. Stable per vendor so it does not
// jump around on every render or page refresh. This is deliberately not
// used for delivery pricing, routing, eligibility, or any backend logic.
function getCosmeticDeliveryMeta(vendorId) {
  const seed = String(vendorId || "").split("").reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
  const distance = (0.7 + (seed % 15) / 10).toFixed(1);
  const minutes = 10 + (seed % 21);
  return { distance, minutes };
}

export default function HomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const totalItems = useCartStore((s) => s.totalItems());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["homepage"],
    queryFn: getHomepageData,
  });

  const firstName = user?.full_name?.split(" ")[0] || "there";

  if (isError) {
    return (
      <div className="px-4 pt-6">
        <ErrorState message={error?.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-10 pb-4 flex items-center justify-between">
        <div>
          <p className="text-slate-muted text-sm">Good day,</p>
          <h1 className="text-ink text-2xl md:text-3xl font-display font-medium tracking-tight">
            {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/customer/notifications"
            className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center hover:border-navy-light transition-colors">
            <Bell className="w-5 h-5 text-ink" strokeWidth={1.75} />
          </Link>
          {totalItems > 0 && (
            <Link to="/customer/cart"
              className="w-10 h-10 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center relative">
              <ShoppingCart className="w-5 h-5 text-teal" strokeWidth={1.75} />
              <span className="absolute -top-1 -right-1 bg-teal text-navy text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 md:px-8 mb-6">
        <button
          onClick={() => navigate("/customer/search")}
          className="w-full bg-surface border border-surface-border rounded-full px-5 py-3.5 text-left text-slate-muted text-sm flex items-center gap-2.5 hover:border-teal/30 hover:shadow-card transition-all"
        >
          <Search className="w-4 h-4" strokeWidth={2} />
          <span>Search medicines, supplies, equipment...</span>
        </button>
      </div>

      {/* Provider mission banner */}
      <div className="px-4 md:px-8 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-teal text-white border-2 border-navy-dark shadow-[7px_7px_0_rgba(10,15,69,0.16)]">
          <div className="absolute -right-12 -top-16 w-48 h-48 rounded-full border-[28px] border-white/10" />
          <div className="absolute right-10 bottom-[-70px] w-44 h-44 rounded-full border-[24px] border-white/10" />
          <div className="relative p-6 md:p-9 max-w-2xl">
            <p className="text-white/70 text-xs font-bold uppercase tracking-[0.16em] mb-2">Healthcare logistics</p>
            <h2 className="text-2xl md:text-4xl font-display font-semibold leading-tight">Get the medical supplies your facility needs, moved reliably.</h2>
            <p className="text-white/75 text-sm md:text-base mt-3 max-w-xl">Find verified suppliers, request what you need, and keep every delivery visible from pickup to handoff.</p>
            <Link to="/customer/stores" className="inline-flex items-center gap-2 mt-5 bg-white text-navy px-4 py-2.5 rounded-xl text-sm font-bold hover:-translate-y-0.5 transition-transform">Browse suppliers <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="mb-10">
        <SectionHeading eyebrow="Medical marketplace" title="What does your facility need?" className="px-4 md:px-8" />
        <div className="flex gap-3 px-4 md:px-8 overflow-x-auto md:overflow-visible pb-1 scrollbar-hide md:grid md:grid-cols-6 lg:grid-cols-8">
          {isLoading
            ? Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="w-16 h-16 md:w-full md:h-20 flex-shrink-0 rounded-2xl" />
              ))
            : data?.categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/customer/stores?category=${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 md:flex-shrink md:py-2 group"
                >
                  {(() => {
                    const { icon: CatIcon, color, bg } = getCategoryIcon(cat.slug);
                    return (
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${bg} border border-surface-border flex items-center justify-center group-hover:border-teal/40 group-hover:-translate-y-0.5 transition-all`}>
                        <CatIcon className={`w-6 h-6 ${color}`} strokeWidth={1.75} />
                      </div>
                    );
                  })()}
                  <span className="text-[10px] md:text-xs text-slate-muted text-center w-20 md:w-full leading-tight line-clamp-2">{getHealthcareCategoryName(cat)}</span>
                </Link>
              ))}
        </div>
      </section>

      {/* Stores by category — top-rated first per category, with new
          (still-unrated) stores surfacing by recency instead of never
          appearing at all. Categories with zero approved vendors yet
          are simply skipped rather than shown empty. */}
      {isLoading ? (
        <section className="mb-10">
          <SectionHeading eyebrow="Healthcare suppliers" title="Suppliers ready to move" className="px-4 md:px-8" />
          <div className="flex gap-3 px-4 md:px-8 overflow-x-auto md:overflow-visible pb-1 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-36 h-32 md:w-full flex-shrink-0 rounded-2xl" />
            ))}
          </div>
        </section>
      ) : data?.categories?.some((c) => c.vendors?.length > 0) ? (
        data.categories
          .filter((c) => c.vendors?.length > 0)
          .map((cat) => (
            <section key={cat.id} className="mb-10">
              <div className="flex gap-4 px-4 md:px-8 overflow-x-auto md:overflow-visible pb-2 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4">
                {cat.vendors.map((v) => {
                  const avail = getAvailabilityDisplay(v.availability_status);
                  const deliveryMeta = getCosmeticDeliveryMeta(v.id);
                  const reviewCount =
                    v.review_count ??
                    v.total_reviews ??
                    v.reviews_count ??
                    v.reviewCount ??
                    null;
                  const rating = Number(v.rating);

                  return (
                    <Link
                      key={v.id}
                      to={`/customer/store/${v.id}`}
                      className="flex-shrink-0 w-64 md:w-full group"
                    >
                      <Card
                        hover
                        className="overflow-hidden border-2 border-ink/15 bg-surface shadow-[4px_4px_0_rgba(34,24,17,0.12)] group-hover:-translate-y-1 group-hover:shadow-[7px_7px_0_rgba(34,24,17,0.16)] transition-all"
                      >
                        {/* The vendor's existing uploaded logo is the store
                            representation on the card — no second upload field. */}
                        <div className="relative aspect-[16/10] bg-navy-mid overflow-hidden border-b-2 border-ink/10">
                          {v.logo_url ? (
                            <img
                              src={v.logo_url}
                              alt={v.business_name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Store className="w-10 h-10 text-slate-soft" strokeWidth={1.75} />
                            </div>
                          )}

                          <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full bg-surface border border-ink/15 text-[10px] font-bold ${avail.color}`}>
                            {avail.label}
                          </span>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-ink text-base font-bold truncate">{v.business_name}</p>
                              <p className="text-slate-muted text-xs truncate mt-0.5">{getHealthcareCategoryName(v.category)}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-ink shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>

                          <div className="flex items-center gap-1.5 mt-3">
                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="text-ink text-xs font-bold">
                              {Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : "New"}
                            </span>
                            {reviewCount !== null && (
                              <span className="text-slate-muted text-[11px]">
                                ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border text-[11px] font-medium text-slate-muted">
                            <span>{deliveryMeta.distance} km</span>
                            <span>·</span>
                            <span>{deliveryMeta.minutes} min</span>
                            <span className="ml-auto text-ink font-bold">View store</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
      ) : (
        <section className="mb-10">
          <SectionHeading eyebrow="Healthcare suppliers" title="Suppliers ready to move" className="px-4 md:px-8" />
          <div className="mx-4 md:mx-8 rounded-2xl border border-dashed border-surface-border py-8 px-5 text-center">
            <Store className="w-8 h-8 text-slate-soft mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-ink text-sm font-medium">Suppliers are joining Medimoove</p>
            <p className="text-slate-muted text-xs mt-1">Pharmacies and medical suppliers will appear here as they are approved.</p>
          </div>
        </section>
      )}

      {/* Workflow strip */}
      <section className="px-4 md:px-8 mb-10">
        <div className="border-y-2 border-navy-dark py-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Workflow icon={ClipboardList} number="01" title="Request" text="Choose the medical items your facility needs." />
          <Workflow icon={Truck} number="02" title="Coordinate" text="A supplier prepares the order and a rider handles the move." />
          <Workflow icon={ShieldCheck} number="03" title="Track" text="Follow the delivery until it reaches your facility." />
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-4 md:px-8 mb-10">
        <div className="flex items-center justify-between">
          <SectionHeading eyebrow="Available now" title="Medical supplies" />
          <Link to="/customer/search" className="text-teal text-sm font-medium flex items-center gap-1 hover:gap-1.5 transition-all shrink-0">
            See all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mt-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : data?.featured_products?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mt-4">
            {data.featured_products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-surface-border py-10 px-5 text-center">
            <Package className="w-8 h-8 text-slate-soft mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-ink text-sm font-medium">No medical supplies listed yet</p>
            <p className="text-slate-muted text-xs mt-1">Once suppliers list their stock, available medical items will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Workflow({ icon: Icon, number, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-teal" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[10px] text-slate-soft font-bold tracking-widest">{number}</p>
        <p className="text-ink text-sm font-bold">{title}</p>
        <p className="text-slate-muted text-xs leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, className = "" }) {
  return (
    <div className={`mb-4 ${className}`}>
      <p className="text-teal text-xs font-semibold uppercase tracking-wide mb-1">{eyebrow}</p>
      <h2 className="text-ink font-display font-medium text-xl">{title}</h2>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <Link to={`/customer/product/${product.id}`}>
      <Card hover className="overflow-hidden">
        <div className="aspect-square bg-navy-mid flex items-center justify-center">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-10 h-10 text-slate-soft" strokeWidth={1.5} />
          )}
        </div>
        <div className="p-3">
          <p className="text-ink text-sm font-semibold truncate">{product.name}</p>
          <p className="text-slate-muted text-xs truncate">{product.vendors?.business_name}</p>
          <p className="text-teal font-bold text-sm mt-1.5">{formatNaira(product.price)}</p>
        </div>
      </Card>
    </Link>
  );
}
