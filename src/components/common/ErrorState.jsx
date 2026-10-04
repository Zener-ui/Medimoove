import { AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={1.75} />
      </div>
      <div>
        <h3 className="text-ink font-display font-medium text-lg mb-1">Something went wrong</h3>
        <p className="text-slate-muted text-sm">{message || "Please try again."}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="md">Try Again</Button>
      )}
    </div>
  );
}
