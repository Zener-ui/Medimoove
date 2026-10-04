import { Star } from "lucide-react";

// ★★★★★ 120
// ★★★★☆ 35   <- percentage bars
// ...
export default function RatingBreakdown({ average, totalReviews, breakdown }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-ink text-3xl font-black leading-none">{average?.toFixed(1) || "0.0"}</p>
          <div className="flex items-center gap-0.5 mt-1 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(average) ? "fill-yellow-500 text-yellow-500" : "fill-transparent text-slate-muted"}`} strokeWidth={1.5} />
            ))}
          </div>
          <p className="text-slate-muted text-xs mt-1">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = breakdown?.[star] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-slate-muted w-2.5">{star}</span>
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500 shrink-0" />
                <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-slate-muted w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
