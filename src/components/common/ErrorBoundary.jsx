import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

/**
 * Top-level render-error safety net.
 *
 * React unmounts the whole tree on an uncaught error during render
 * unless something catches it — without this, any single bad component
 * (a bad prop, an undefined field, a crashed hook) takes the ENTIRE
 * page to a blank white screen. This renders a recoverable fallback
 * instead, and logs the error for diagnosis.
 *
 * This does NOT replace per-query loading/empty/error states — those
 * still matter for expected conditions (no data, failed fetch). This
 * is the last-resort net for unexpected render crashes.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Uncaught render error:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset: this.handleReset });
      }
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-4 bg-navy">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-400" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-ink font-display font-medium text-lg mb-1">Something went wrong</h3>
            <p className="text-slate-muted text-sm max-w-xs">
              This page hit an unexpected error. You can try again, or head back and retry.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={this.handleReset} variant="outline" size="md">Try Again</Button>
            <Button onClick={() => (window.location.href = "/")} variant="secondary" size="md">Go Home</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
