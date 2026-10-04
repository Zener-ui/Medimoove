import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMyVendorReviews, replyToReview } from "@/api/reviews";
import { getMyVendorProfile } from "@/api/vendors";
import TopBar from "@/components/layout/TopBar";
import RatingStars from "@/components/common/RatingStars";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";
import { formatDate } from "@/utils";

const SORTS = [
  { value: "recent", label: "Most Recent" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

function ReplyBox({ reviewId, onDone }) {
  const [reply, setReply] = useState("");
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => replyToReview(reviewId, reply),
    onSuccess: () => {
      toast.success("Reply posted");
      qc.invalidateQueries({ queryKey: ["my-vendor-reviews"] });
      onDone();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="mt-2 space-y-2">
      <textarea
        rows={2}
        placeholder="Write a reply to this provider..."
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        className="w-full bg-navy rounded-xl border border-surface-border text-ink text-sm py-2 px-3 outline-none focus:border-teal resize-none"
      />
      <Button size="sm" loading={mutation.isPending} onClick={() => reply.trim() && mutation.mutate()}>
        Post Reply
      </Button>
    </div>
  );
}

export default function VendorReviewsPage() {
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [replyingId, setReplyingId] = useState(null);

  const { data: vendorData } = useQuery({ queryKey: ["vendor-profile"], queryFn: getMyVendorProfile });
  const vendor = vendorData?.vendor;

  const { data, isLoading } = useQuery({
    queryKey: ["my-vendor-reviews", sort, page],
    queryFn: () => getMyVendorReviews({ sort, page, limit: 15 }),
    keepPreviousData: true,
  });

  const reviews = data?.reviews || [];
  const pagination = data?.pagination;

  // Vendors never edit or remove a customer's rating/comment — the
  // backend enforces this too (replyToReview only ever touches the
  // vendor_reply column). Replying is the only action available here.

  return (
    <div className="min-h-screen">
      <TopBar title="Provider Feedback" />
      <div className="px-4 py-4 space-y-4">
        <div className="p-4 bg-surface rounded-2xl border border-surface-border">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            <p className="text-ink text-2xl font-black">{vendor?.rating || "0.0"}</p>
            <span className="text-slate-muted text-xs">overall rating</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-slate-muted text-xs font-medium">{pagination?.total || 0} review{pagination?.total !== 1 ? "s" : ""}</p>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="bg-surface border border-surface-border rounded-xl text-xs text-ink py-1.5 px-2.5 outline-none focus:border-teal"
          >
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        ) : reviews.length === 0 ? (
          <EmptyState icon={Star} title="No provider feedback yet" description="Feedback from healthcare providers will show up here." />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-ink text-sm font-semibold">{r.customer_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RatingStars rating={r.rating} size="xs" />
                      <span className="text-slate-muted text-xs">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                </div>
                {r.title && <p className="text-ink text-sm font-medium">{r.title}</p>}
                {r.comment && <p className="text-slate-muted text-sm leading-relaxed">{r.comment}</p>}
                {r.photo_urls?.length > 0 && (
                  <div className="flex gap-2">
                    {r.photo_urls.map((url, i) => (
                      <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-14 h-14 rounded-xl overflow-hidden border border-surface-border shrink-0">
                        <img src={url} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                {r.vendor_reply ? (
                  <div className="mt-2 p-3 bg-navy rounded-xl border border-surface-border">
                    <p className="text-teal text-xs font-semibold">Your reply</p>
                    <p className="text-slate-muted text-xs mt-1">{r.vendor_reply}</p>
                  </div>
                ) : replyingId === r.id ? (
                  <ReplyBox reviewId={r.id} onDone={() => setReplyingId(null)} />
                ) : (
                  <button onClick={() => setReplyingId(r.id)} className="text-teal text-xs font-medium flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> Reply
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination && (pagination.has_prev || pagination.has_next) && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button disabled={!pagination.has_prev} onClick={() => setPage((p) => p - 1)} className="text-teal text-xs font-medium disabled:opacity-30">Previous</button>
            <span className="text-slate-muted text-xs">Page {pagination.page} of {pagination.pages}</span>
            <button disabled={!pagination.has_next} onClick={() => setPage((p) => p + 1)} className="text-teal text-xs font-medium disabled:opacity-30">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
