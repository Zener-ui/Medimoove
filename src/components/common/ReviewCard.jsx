import { useState } from "react";
import { ThumbsUp, BadgeCheck, Store } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { markReviewHelpful } from "@/api/reviews";
import { formatDate } from "@/utils";
import RatingStars from "@/components/common/RatingStars";

export default function ReviewCard({ review }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
  const [marked, setMarked] = useState(false);

  const helpfulMutation = useMutation({
    mutationFn: () => markReviewHelpful(review.id),
    onSuccess: (d) => { setHelpfulCount(d.helpful_count); setMarked(true); },
    onError: (err) => {
      // 409 = already voted (review_helpful_votes UNIQUE constraint) —
      // not a real error from the person's point of view, just reflect
      // the state they're already in rather than showing a red toast.
      if (err.status === 409) { setMarked(true); return; }
      toast.error(err.message);
    },
  });

  return (
    <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-ink text-sm font-semibold">{review.customer_name}</p>
            {review.verified_purchase && (
              <span className="flex items-center gap-0.5 text-[10px] text-teal font-medium">
                <BadgeCheck className="w-3 h-3" /> Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={review.rating} size="xs" />
            <span className="text-slate-muted text-xs">{formatDate(review.created_at)}{review.edited ? " (edited)" : ""}</span>
          </div>
        </div>
      </div>

      {review.title && <p className="text-ink text-sm font-medium">{review.title}</p>}
      {review.comment && <p className="text-slate-muted text-sm leading-relaxed">{review.comment}</p>}

      {review.photo_urls?.length > 0 && (
        <div className="flex gap-2 pt-1">
          {review.photo_urls.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-14 h-14 rounded-xl overflow-hidden border border-surface-border shrink-0">
              <img src={url} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}

      {review.vendor_reply && (
        <div className="mt-2 p-3 bg-navy rounded-xl border border-surface-border">
          <p className="text-teal text-xs font-semibold flex items-center gap-1"><Store className="w-3 h-3" /> Store reply</p>
          <p className="text-slate-muted text-xs mt-1 leading-relaxed">{review.vendor_reply}</p>
        </div>
      )}

      <button
        type="button"
        disabled={marked}
        onClick={() => helpfulMutation.mutate()}
        className={`flex items-center gap-1.5 text-xs pt-1 ${marked ? "text-teal" : "text-slate-muted hover:text-ink"}`}
      >
        <ThumbsUp className={`w-3.5 h-3.5 ${marked ? "fill-teal" : ""}`} strokeWidth={1.5} />
        Helpful{helpfulCount > 0 ? ` (${helpfulCount})` : ""}
      </button>
    </div>
  );
}
