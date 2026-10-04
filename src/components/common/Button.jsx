import { clsx } from "clsx";

const variants = {
  primary:   "bg-teal text-navy font-semibold hover:bg-teal-dark active:scale-95",
  secondary: "bg-surface-raised text-ink border border-surface-border hover:bg-navy-light active:scale-95",
  danger:    "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95",
  ghost:     "text-slate-soft hover:text-ink hover:bg-surface-raised active:scale-95",
  outline:   "border border-teal text-teal hover:bg-teal/10 active:scale-95",
};

const sizes = {
  sm:  "px-3 py-1.5 text-sm rounded-xl",
  md:  "px-5 py-2.5 text-sm rounded-xl",
  lg:  "px-6 py-3.5 text-base rounded-2xl",
  xl:  "px-8 py-4 text-base rounded-2xl w-full",
};

export default function Button({
  children, variant = "primary", size = "md",
  loading = false, disabled = false,
  className = "", icon, ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 transition-all duration-150 font-medium",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
