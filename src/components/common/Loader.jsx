import { clsx } from "clsx";

export default function Loader({ fullscreen = false, size = "md", text }) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-2", lg: "w-12 h-12 border-3" };

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-navy flex flex-col items-center justify-center z-50 gap-4">
        <div className={clsx("rounded-full border-teal border-t-transparent animate-spin", sizes[size] || sizes.md)} />
        {text && <p className="text-slate-muted text-sm">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className={clsx("rounded-full border-teal border-t-transparent animate-spin", sizes[size])} />
      {text && <p className="text-slate-muted text-sm">{text}</p>}
    </div>
  );
}

// Skeleton shimmer for content loading
export function Skeleton({ className = "" }) {
  return (
    <div className={clsx(
      "bg-surface-raised rounded-xl animate-pulse",
      className
    )} />
  );
}
