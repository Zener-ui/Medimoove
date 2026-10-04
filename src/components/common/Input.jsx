import { clsx } from "clsx";
import { forwardRef } from "react";

const Input = forwardRef(function Input({
  label, error, helper, icon, suffix,
  className = "", containerClass = "", ...props
}, ref) {
  return (
    <div className={clsx("flex flex-col gap-1.5", containerClass)}>
      {label && (
        <label className="text-sm font-medium text-slate-soft">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-slate-muted flex-shrink-0 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full bg-surface rounded-xl border border-surface-border",
            "text-ink placeholder:text-slate-muted",
            "py-3 text-sm outline-none transition-all duration-150",
            "focus:border-teal focus:ring-1 focus:ring-teal/30",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            icon ? "pl-10 pr-4" : "px-4",
            suffix ? "pr-12" : "",
            error ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-slate-muted text-sm">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {helper && !error && <p className="text-xs text-slate-muted">{helper}</p>}
    </div>
  );
});

export default Input;
