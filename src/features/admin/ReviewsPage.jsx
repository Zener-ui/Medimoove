import { useState } from "react";
import { Star, Flag, Trash2, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllReviewsAdmin, flagReview, removeReview, restoreReview } from "@/api/admin";
import { formatDate } from "@/utils";
import RatingStars from "@/components/common/RatingStars";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

const TABS = [
  { value: "", label: "All" },
  { value: "true", label: "Flagged" },
];

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("");
  const [removeModal, setRemoveModal] = useState(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-reviews", tab], queryFn: () => getAllReviewsAdmin(tab) });
  const reviews = data?.reviews || [];

  const flagMutation = useMutation({
    mutationFn: flagReview,
    onSuccess: () => { toast.success("Review flagged"); qc.invalidateQueries(["admin-reviews"]); },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }) => removeReview(id, reason),
    onSuccess: () => { toast.success("Review removed"); qc.invalidateQueries(["admin-reviews"]); setRemoveModal(null); setReason(""); },
    onError: (err) => toast.error(err.message),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreReview,
    onSuccess: () => { toast.success("Review restored"); qc.invalidateQueries(["admin-reviews"]); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Reviews</h1>
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${tab === t.value ? "bg-teal text-navy border-teal" : "border-surface-border text-slate-muted bg-surface"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {reviews.map((r) => (
            <div key={r.id} className={`p-4 bg-surface rounded-2xl border space-y-2 ${r.is_removed ? "border-red-500/30 opacity-60" : r.is_flagged ? "border-yellow-400/40" : "border-surface-border"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-ink text-sm font-semibold">{r.users?.full_name} → {r.vendors?.business_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RatingStars rating={r.vendor_rating} size="xs" />
                    <span className="text-slate-muted text-xs">{formatDate(r.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {r.is_flagged && <span className="text-[10px] font-semibold text-yellow-400 border border-yellow-400/30 rounded-full px-2 py-0.5">Flagged</span>}
                  {r.is_removed && <span className="text-[10px] font-semibold text-red-400 border border-red-400/30 rounded-full px-2 py-0.5">Removed</span>}
                </div>
              </div>
              {r.title && <p className="text-ink text-sm font-medium">{r.title}</p>}
              {r.comment && <p className="text-slate-muted text-sm leading-relaxed">{r.comment}</p>}
              {r.removed_reason && <p className="text-red-400 text-xs">Removed: {r.removed_reason}</p>}

              <div className="flex gap-2 pt-1">
                {!r.is_removed ? (
                  <>
                    {!r.is_flagged && (
                      <Button size="sm" variant="secondary" onClick={() => flagMutation.mutate(r.id)}>
                        <Flag className="w-3.5 h-3.5 inline mr-1" /> Flag
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => { setRemoveModal(r); setReason(""); }}>
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Remove
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => restoreMutation.mutate(r.id)}>
                    <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!removeModal} onClose={() => setRemoveModal(null)} title="Remove Review">
        <div className="space-y-3">
          <p className="text-slate-muted text-sm">This hides the review and excludes it from the store's rating average, without affecting any other review.</p>
          <Input label="Reason (internal)" placeholder="e.g. Abusive language" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button size="xl" variant="danger" onClick={() => removeMutation.mutate({ id: removeModal.id, reason })} loading={removeMutation.isPending}>
            Confirm Removal
          </Button>
        </div>
      </Modal>
    </div>
  );
}
