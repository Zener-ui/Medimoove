import { clsx } from "clsx";

export default function Card({ children, className = "", onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-surface rounded-2xl border border-surface-border",
        hover && "cursor-pointer hover:border-navy-light transition-all duration-150 hover:shadow-card",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
