import { useState, useEffect } from "react";
import { SearchX, Search, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchProducts, getCategories } from "@/api/search";
import { formatNaira } from "@/utils";
import { getCategoryIcon, getHealthcareCategoryName } from "@/utils/categoryIcons";
import TopBar from "@/components/layout/TopBar";
import Input from "@/components/common/Input";
import Card from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

const SORTS = [
  { value: "newest",     label: "Newest" },
  { value: "popular",    label: "Popular" },
  { value: "price_asc",  label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState(params.get("q") || "");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const category_id = params.get("category_id");
  const vendor_id = params.get("vendor_id");

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: Infinity });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["search-products", { q, category_id, vendor_id, sort, page }],
    queryFn: () => searchProducts({ q: q || undefined, category_id: category_id || undefined, vendor_id: vendor_id || undefined, sort, page, limit: 20 }),
    keepPreviousData: true,
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setParams(q ? { q } : {});
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Find medical supplies" showBack />

      <div className="px-4 md:px-8 py-3 space-y-4 max-w-none">
        {/* Search input */}
        <form onSubmit={handleSearch}>
          <Input
            placeholder="Search medicines, supplies, equipment..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </form>

        {/* Categories horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => { setParams({}); setPage(1); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${!category_id ? "bg-teal text-navy border-teal" : "bg-surface border-surface-border text-slate-muted"}`}
          >
            All
          </button>
          {catData?.categories?.map((c) => (
            <button
              key={c.id}
              onClick={() => { setParams({ category_id: c.id }); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${category_id === c.id ? "bg-teal text-navy border-teal" : "bg-surface border-surface-border text-slate-muted"}`}
            >
              {(() => {
                const { icon: CatIcon, color } = getCategoryIcon(c.slug);
                return <CatIcon className={`w-3.5 h-3.5 ${category_id === c.id ? "text-navy" : color}`} strokeWidth={2} />;
              })()}
              {getHealthcareCategoryName(c)}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => { setSort(s.value); setPage(1); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${sort === s.value ? "border-teal text-teal bg-teal/10" : "border-surface-border text-slate-muted bg-surface"}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-slate-muted text-xs">
            {pagination?.total || 0} medical item{pagination?.total !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Results grid */}
        {isLoading || isFetching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {Array(10).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No medical items found"
            description={data?.empty_state || "Try a different medical item, supplier, or category."}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {products.map((p) => (
                <Card key={p.id} hover className="overflow-hidden" onClick={() => navigate(`/customer/product/${p.id}`)}>
                  <div className="aspect-square bg-navy-mid flex items-center justify-center">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <Package className="w-10 h-10 text-slate-soft" strokeWidth={1.5} />}
                  </div>
                  <div className="p-3">
                    <p className="text-ink text-sm font-semibold line-clamp-2">{p.name}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/customer/store/${p.vendors?.id}`); }}
                      className="text-slate-muted text-xs mt-0.5 hover:text-teal hover:underline block truncate text-left w-full"
                    >
                      {p.vendors?.business_name}
                    </button>
                    <p className="text-teal font-bold text-sm mt-1.5">{formatNaira(p.price)}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination && (pagination.has_prev || pagination.has_next) && (
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={!pagination.has_prev}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 px-4 py-2 text-sm text-teal border border-teal/30 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-slate-muted text-xs">
                  Page {pagination.page} of {pagination.pages}
                </span>
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
