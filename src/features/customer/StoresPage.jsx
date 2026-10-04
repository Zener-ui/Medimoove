import { useState } from "react";
import { Star, SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchVendors, getCategories } from "@/api/search";
import { getAvailabilityDisplay } from "@/utils";
import { getCategoryIcon, getHealthcareCategoryName } from "@/utils/categoryIcons";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

// Store-first discovery, step 2: customer picked a category on the
// home page, now sees the STORES in that category — not a mixed
// product catalog. Tapping a store goes to StorePage, which is where
// products finally appear (see StorePage.jsx).
export default function StoresPage() {
  const [params] = useSearchParams();
  const [page, setPage] = useState(1);
  const category = params.get("category");

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: Infinity });
  const activeCategory = catData?.categories?.find((c) => c.slug === category);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search-vendors", { category, page }],
    queryFn: () => searchVendors({ category: category || undefined, page, limit: 20 }),
    keepPreviousData: true,
  });

  const vendors = data?.vendors || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen">
      <TopBar title={activeCategory ? getHealthcareCategoryName(activeCategory) : "Suppliers"} showBack />

      <div className="px-4 md:px-8 py-3 space-y-4">
        {!isLoading && (
          <p className="text-slate-muted text-xs">
            {pagination?.total || vendors.length} store{(pagination?.total ?? vendors.length) !== 1 ? "s" : ""}
            {activeCategory ? ` in ${getHealthcareCategoryName(activeCategory)}` : ""}
          </p>
        )}

        {isLoading || isFetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No suppliers yet"
            description={activeCategory ? `No suppliers have joined ${getHealthcareCategoryName(activeCategory)} yet — check back soon.` : "Pharmacies and medical suppliers are joining Medimoove soon."}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {vendors.map((v) => {
                const avail = getAvailabilityDisplay(v.availability_status);
                const { icon: CatIcon, color, bg } = getCategoryIcon(activeCategory?.slug || "other");
                return (
                  <Link key={v.id} to={`/customer/store/${v.id}`}>
                    <Card hover className="p-4 flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl ${bg} border border-surface-border flex items-center justify-center shrink-0 overflow-hidden`}>
                        {v.logo_url ? (
                          <img src={v.logo_url} alt={v.business_name} className="w-full h-full object-cover" />
                        ) : <CatIcon className={`w-6 h-6 ${color}`} strokeWidth={1.75} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-ink text-sm font-semibold truncate">{v.business_name}</p>
                        <p className="text-slate-muted text-xs truncate">{v.location}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-slate-muted text-xs">{v.rating || "New"}</span>
                          </span>
                          <span className={`text-xs font-medium ${avail.color}`}>{avail.label}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {pagination && (pagination.has_prev || pagination.has_next) && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={!pagination.has_prev}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-teal border border-teal/30 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-slate-muted text-xs">Page {pagination.page} of {pagination.pages}</span>
                <button
                  disabled={!pagination.has_next}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-teal border border-teal/30 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
