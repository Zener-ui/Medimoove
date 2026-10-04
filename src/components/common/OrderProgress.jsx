import { Check } from "lucide-react";
import { clsx } from "clsx";

const DELIVERY_STEPS = [
  { key: "PAYMENT_CONFIRMED", label: "Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "WAITING_RIDER", label: "Finding Rider" },
  { key: "RIDER_ASSIGNED", label: "Rider Assigned" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "DELIVERING", label: "On the Way" },
  { key: "DELIVERED", label: "Delivered" },
];

const PICKUP_STEPS = [
  { key: "PAYMENT_CONFIRMED", label: "Confirmed" },
  { key: "PREPARING", label: "Preparing" },
  { key: "READY_FOR_PICKUP", label: "Ready" },
  { key: "DELIVERED", label: "Collected" },
];

const TERMINAL_EXCEPTIONS = ["CANCELLED", "REFUNDED", "DISPUTED"];

/**
 * Horizontal step-progress tracker for a single sub-order.
 * Falls back to a plain status pill for terminal/exception states
 * (cancelled, refunded, disputed) where a "progress" framing doesn't fit.
 */
export default function OrderProgress({ status, deliveryType, statusDisplay }) {
  if (TERMINAL_EXCEPTIONS.includes(status)) {
    return (
      <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}>
        {statusDisplay.label}
      </span>
    );
  }

  const steps = deliveryType === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIndex = steps.findIndex((s) => s.key === status);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-center w-full py-1">
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className={clsx("flex items-center", !isLast && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div className={clsx(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                done ? "bg-teal text-navy" : active ? "bg-teal/15 border-2 border-teal" : "bg-navy-mid border border-surface-border"
              )}>
                {done
                  ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  : <span className={clsx("w-1.5 h-1.5 rounded-full", active ? "bg-teal" : "bg-slate-soft")} />}
              </div>
              <span className={clsx(
                "text-[9px] font-medium text-center w-14 leading-tight hidden sm:block",
                active ? "text-teal" : done ? "text-ink" : "text-slate-muted"
              )}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={clsx("h-0.5 flex-1 mx-1 rounded-full", done ? "bg-teal" : "bg-surface-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
