import { NavLink } from "react-router-dom";
import { clsx } from "clsx";

export default function BottomNav({ items }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-surface-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {items.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => clsx(
              "flex flex-col items-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-150",
              isActive ? "text-teal" : "text-slate-muted"
            )}
          >
            {({ isActive }) => (
              <>
                <span className={clsx("text-xl transition-transform duration-150", isActive && "scale-110")}>{icon}</span>
                <span className={clsx("text-[10px] font-medium", isActive ? "text-teal" : "text-slate-muted")}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
