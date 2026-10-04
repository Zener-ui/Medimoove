import { Inbox } from "lucide-react";
import Button from "./Button";

export default function EmptyState({ icon: Icon = Inbox, title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-navy-mid flex items-center justify-center">
        <Icon className="w-7 h-7 text-slate-soft" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="text-ink font-display font-medium text-lg mb-1">{title}</h3>
        {description && <p className="text-slate-muted text-sm max-w-xs">{description}</p>}
      </div>
      {action && actionLabel && (
        <Button onClick={action} size="md" variant="primary">{actionLabel}</Button>
      )}
    </div>
  );
}
