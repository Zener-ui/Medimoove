import { useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

export default function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={clsx(
        "relative w-full bg-surface-raised border border-surface-border",
        "rounded-t-3xl sm:rounded-3xl shadow-card animate-slide-up",
        "max-h-[90vh] overflow-y-auto",
        sizes[size]
      )}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-surface-border">
            <h2 className="text-ink font-semibold text-base">{title}</h2>
            <button
              onClick={onClose}
              className="text-slate-muted hover:text-ink transition-colors w-8 h-8 flex items-center justify-center rounded-xl hover:bg-navy-light"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
