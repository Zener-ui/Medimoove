import { useState, useEffect } from "react";
import { Store, BadgeCheck, Star, MapPin, Truck, Calendar, PackageCheck, Phone, MessageCircle, ArrowRight, Lock } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getVendor } from "@/api/vendors";
import { getVendorProvider reviews, getVendorRatingSummary } from "@/api/reviews";
import { getAvailabilityDisplay, formatDate } from "@/utils";
import { getCategoryIcon, getHealthcareCategoryName } from "@/utils/categoryIcons";
import { setReferredVendor } from "@/utils/referral";
import PublicCartButton from "@/components/common/PublicCartButton";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import RatingBreakdown from "@/components/common/RatingBreakdown";
import Provider reviewCard from "@/components/common/Provider reviewCard";
import ErrorState from "@/components/common/ErrorState";
import Loader, { Skeleton } from "@/components/common/Loader";
import EmptyState from "@/components/common/EmptyState";

const SORTS = [
  { value: "recent", label: "Most Recent" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

// The store's landing/profile page — a decorated overview a customer
// lands on after tapping a store card anywhere in the app: photo,
// ratings & reviews, location, contact. Product browsing lives one
// tap away behind "View medical supplies" (StoreProductsPage.jsx), rather
// than being crammed onto this page too.
export default function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Same component renders at /customer/store/:id (logged-in) and
  // /s/:id (public share link) — this just carries the visitor down
  // whichever path they arrived on, instead of forcing a public
  // visitor into a route that requires login one tap later.
  const basePath = location.pathname.startsWith("/s") ? "/s" : "/customer/store";

  // Only record attribution on the public entry point — someone
  // already logged in browsing their own account isn't "referred" by
  // anything, and we don't want an existing customer's normal
  // browsing to overwrite a genuine pending referral.
  useEffect(() => {
    if (basePath === "/s") setReferredVendor(id);
  }, [basePath, id]);

  const [sort, setSort] = useState("recent");
  const [withPhotos, setWithPhotos] = useState(false);
  const [page, setPage] = useState(1);

  const { data: vendorData, isLoading: vendorLoading, error: vendorError, refetch: refetchVendor } = useQuery({
    queryKey: ["store", id],
    queryFn: () => getVendor(id),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["store-rating-summary", id],
    queryFn: () => getVendorRatingSummary(id),
    enabled: !!id,
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["store-reviews", id, sort, withPhotos, page],
    queryFn: () => getVendorProvider reviews(id, { sort, page, limit: 10, with_photos: withPhotos ? "true" : undefined }),
    enabled: !!id,
    keepPreviousData: true,
  });

  if (vendorLoading) return <Loader fullscreen text="Loading supplier..." />;
  if (vendorError) return <ErrorState message={vendorError.message} onRetry={refetchVendor} />;

  const vendor = vendorData?.vendor;
  const summary = summaryData?.summary;
  const reviews = reviewsData?.reviews || [];
  const pagination = reviewsData?.pagination;
  const avail = getAvailabilityDisplay(vendor?.availability_status);
  const { icon: CatIcon, color: catColor, bg: catBg } = getCategoryIcon(vendor?.category);

  return (
    <div className="min-h-screen pb-28">
      <TopBar title={vendor?.business_name || "Supplier"} showBack />

      {/* Decorated hero — vendor's uploaded image is the actual
          background now (previously it only ever appeared inside the
          small badge below, replacing the category icon entirely when
          present). The category color still tints the hero for brand
          consistency and text legibility over a photo; the category
          icon badge is now always shown, never swapped out. */}
      <div className="relative px-4 md:px-8 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0">
          {vendor?.logo_url && (
            <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" />
          )}
          <div className={`absolute inset-0 bg-gradient-to-b ${catBg} ${vendor?.logo_url ? "opacity-80" : ""} to-transparent`} />
        </div>
        <div className="relative flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-navy border-2 border-surface-border shadow-lg flex items-center justify-center overflow-hidden -mb-1">
            <CatIcon className={`w-9 h-9 ${catColor}`} strokeWidth={1.5} />
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <h1 className="text-ink text-xl font-display font-bold">{vendor?.business_name}</h1>
            {vendor?.is_verified && <BadgeCheck className="w-5 h-5 text-teal shrink-0" />}
          </div>
          {vendor?.category && (
            <span className={`mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${catBg} ${catColor}`}>
              <CatIcon className="w-3.5 h-3.5" /> {getHealthcareCategoryName(vendor.category)}
            </span>
          )}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span className="text-ink text-sm font-semibold">{summary?.average || vendor?.rating || "New"}</span>
              <span className="text-slate-muted text-xs">({summary?.total_reviews || 0})</span>
            </div>
            <span className="text-slate-muted">·</span>
            <span className={`text-xs font-semibold ${avail.color}`}>{avail.label}</span>
          </div>
          {vendor?.description && (
            <p className="text-slate-muted text-sm mt-3 max-w-md leading-relaxed">{vendor.description}</p>
          )}
        </div>
      </div>

      {/* Quick facts */}
      <div className={`px-4 md:px-8 grid gap-2 ${summary?.response_rate !== null && summary?.response_rate !== undefined ? "grid-cols-4" : "grid-cols-3"}`}>
        <div className="p-3 bg-surface rounded-2xl border border-surface-border text-center">
          <PackageCheck className="w-4 h-4 text-teal mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-ink text-sm font-bold">{summary?.completed_orders ?? "—"}</p>
          <p className="text-slate-muted text-[10px]">Orders fulfilled</p>
        </div>
        <div className="p-3 bg-surface rounded-2xl border border-surface-border text-center">
          <Truck className="w-4 h-4 text-teal mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-ink text-sm font-bold">{vendor?.delivery_radius_km ?? 30}km</p>
          <p className="text-slate-muted text-[10px]">Delivery Radius</p>
        </div>
        <div className="p-3 bg-surface rounded-2xl border border-surface-border text-center">
          <Calendar className="w-4 h-4 text-teal mx-auto mb-1" strokeWidth={1.5} />
          <p className="text-ink text-sm font-bold">{vendor?.created_at ? new Date(vendor.created_at).getFullYear() : "—"}</p>
          <p className="text-slate-muted text-[10px]">On Medimoove Since</p>
        </div>
        {summary?.response_rate !== null && summary?.response_rate !== undefined && (
          <div className="p-3 bg-surface rounded-2xl border border-surface-border text-center">
            <MessageCircle className="w-4 h-4 text-teal mx-auto mb-1" strokeWidth={1.5} />
            <p className="text-ink text-sm font-bold">{summary.response_rate}%</p>
            <p className="text-slate-muted text-[10px]">Response Rate</p>
          </div>
        )}
      </div>

      {/* Location + contact */}
      <div className="px-4 md:px-8 mt-4 space-y-2">
        {vendor?.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-slate-muted shrink-0" />
            <span className="text-slate-muted">{vendor.location}</span>
          </div>
        )}
        {vendor?.contact_unlocked ? (
          <div className="flex gap-2">
            {vendor?.phone && (
              <a href={`tel:${vendor.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-surface-border text-slate-muted text-xs font-medium hover:text-ink">
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            )}
            {vendor?.whatsapp && (
              <a href={`https://wa.me/${vendor.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-surface-border text-slate-muted text-xs font-medium hover:text-ink">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-muted">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Direct contact unlocks after your first order from this store</span>
          </div>
        )}
      </div>

      {/* Ratings & Provider reviews */}
      <div className="px-4 md:px-8 mt-6">
        <h2 className="text-ink font-display font-semibold mb-3">Ratings & Provider reviews</h2>
        {summary ? (
          <RatingBreakdown average={summary.average} totalProvider reviews={summary.total_reviews} breakdown={summary.breakdown} />
        ) : (
          <Skeleton className="h-24 rounded-2xl" />
        )}

        <div className="flex items-center justify-between mt-5 mb-3 gap-2">
          <p className="text-slate-muted text-xs font-medium shrink-0">{pagination?.total || 0} review{pagination?.total !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setWithPhotos((w) => !w); setPage(1); }}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-all ${withPhotos ? "bg-teal/10 border-teal text-teal" : "border-surface-border text-slate-muted"}`}
            >
              With Photos
            </button>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="bg-surface border border-surface-border rounded-xl text-xs text-ink py-1.5 px-2.5 outline-none focus:border-teal"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews yet" description={withPhotos ? "No reviews with photos yet." : "Be the first to order and leave a review."} />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => <Provider reviewCard key={r.id} review={r} />)}
          </div>
        )}

        {pagination && (pagination.has_prev || pagination.has_next) && (
          <div className="flex items-center justify-center gap-3 pt-4">
            <button disabled={!pagination.has_prev} onClick={() => setPage((p) => p - 1)} className="text-teal text-xs font-medium disabled:opacity-30">Previous</button>
            <span className="text-slate-muted text-xs">Page {pagination.page} of {pagination.pages}</span>
            <button disabled={!pagination.has_next} onClick={() => setPage((p) => p + 1)} className="text-teal text-xs font-medium disabled:opacity-30">Next</button>
          </div>
        )}
      </div>

      {/* View medical supplies CTA */}
      <div className="fixed left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-4 z-[100] px-4 md:px-8 md:max-w-md md:mx-auto md:left-1/2 md:-translate-x-1/2 md:w-full">
        <Button size="xl" onClick={() => navigate(`${basePath}/${id}/products`)} className="shadow-lg">
          View medical supplies <ArrowRight className="w-4 h-4 inline ml-1" />
        </Button>
      </div>

      {basePath === "/s" && <PublicCartButton raised />}
    </div>
  );
}
