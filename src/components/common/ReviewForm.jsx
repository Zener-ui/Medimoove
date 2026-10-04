import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createReview, updateReview } from "@/api/reviews";
import { uploadReviewPhotos } from "@/api/uploads";
import RatingStars from "@/components/common/RatingStars";
import PhotoPicker from "@/components/common/PhotoPicker";
import Button from "@/components/common/Button";

// Review form for a single sub-order — used from OrderDetailPage once
// a sub-order is DELIVERED. `existingReview` (if present) switches
// this into edit mode; the sub_order_id UNIQUE constraint on the
// backend means there's never more than one review per sub-order.
export default function ReviewForm({ subOrderId, hasRider, vendorName, existingReview, onDone }) {
  const qc = useQueryClient();
  const [vendorRating, setVendorRating] = useState(existingReview?.vendor_rating || 0);
  const [riderRating, setRiderRating] = useState(existingReview?.rider_rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  // Already-uploaded photo URLs kept from an existing review (editable: removable)
  const [keptPhotoUrls, setKeptPhotoUrls] = useState(existingReview?.photo_urls || []);
  // Newly picked local files awaiting upload on submit
  const [newPhotos, setNewPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      let photo_urls = keptPhotoUrls;
      if (newPhotos.length) {
        setUploading(true);
        const uploaded = await uploadReviewPhotos(newPhotos.map((p) => p.file));
        setUploading(false);
        photo_urls = [...keptPhotoUrls, ...(uploaded?.urls || [])];
      }

      const payload = { vendor_rating: vendorRating, rider_rating: riderRating || null, title, comment, photo_urls };
      return existingReview ? updateReview(existingReview.id, payload) : createReview({ sub_order_id: subOrderId, ...payload });
    },
    onSuccess: () => {
      toast.success(existingReview ? "Review updated" : "Thanks for your review!");
      // OrderDetailPage's query key is ["order-detail", orderId] — this
      // form only has the sub_order id, not the parent order id, so
      // invalidate by prefix instead of trying to guess the full key.
      qc.invalidateQueries({ predicate: (q) => q.queryKey[0] === "order-detail" });
      onDone?.();
    },
    onError: (err) => { setUploading(false); toast.error(err.message); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vendorRating) return toast.error("Please rate the store.");
    mutation.mutate();
  };

  const totalPhotoCount = keptPhotoUrls.length + newPhotos.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-surface rounded-2xl border border-surface-border">
      <p className="text-ink font-display font-medium">{existingReview ? "Edit Your Review" : `Rate ${vendorName || "this store"}`}</p>

      <div>
        <p className="text-slate-muted text-xs mb-1">Store rating</p>
        <RatingStars rating={vendorRating} size="lg" interactive onChange={setVendorRating} />
      </div>

      {hasRider && (
        <div>
          <p className="text-slate-muted text-xs mb-1">Rider rating (optional)</p>
          <RatingStars rating={riderRating} size="lg" interactive onChange={setRiderRating} />
        </div>
      )}

      <input
        type="text"
        placeholder="Review title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-navy rounded-xl border border-surface-border text-ink text-sm py-2.5 px-3 outline-none focus:border-teal"
      />
      <textarea
        rows={3}
        placeholder="Tell others about your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full bg-navy rounded-xl border border-surface-border text-ink text-sm py-2.5 px-3 outline-none focus:border-teal resize-none"
      />

      <div>
        <p className="text-slate-muted text-xs mb-1.5">Photos (optional, up to 4)</p>
        {keptPhotoUrls.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-2">
            {keptPhotoUrls.map((url, i) => (
              <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-navy-mid border border-surface-border">
                <img src={url} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setKeptPhotoUrls((c) => c.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1" aria-label="Remove photo">
                  <span className="text-xs leading-none">×</span>
                </button>
              </div>
            ))}
          </div>
        )}
        {totalPhotoCount < 4 && (
          <PhotoPicker
            files={newPhotos}
            onChange={setNewPhotos}
            max={4 - keptPhotoUrls.length}
            label="Add photos of your order"
          />
        )}
      </div>

      <Button type="submit" size="md" loading={mutation.isPending || uploading}>
        {existingReview ? "Update Review" : "Submit Review"}
      </Button>
    </form>
  );
}
