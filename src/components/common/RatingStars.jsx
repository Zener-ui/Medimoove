import { Star } from "lucide-react";

// Renders a row of stars for a given rating (supports halves visually
// via a clipped overlay) — used anywhere a numeric rating needs to
// read as stars: store profiles, review cards, review forms.
export default function RatingStars({ rating = 0, size = "sm", interactive = false, onChange }) {
  const sizeClass = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" }[size] || "w-4 h-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(rating);
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(n)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
          >
            <Star
              className={`${sizeClass} ${filled ? "fill-yellow-500 text-yellow-500" : "fill-transparent text-slate-muted"}`}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
