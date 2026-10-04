import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "@/api/auth";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: forgotPassword,
    // No onError branching into a different UI state on purpose — the
    // backend always returns success here (that's the anti-enumeration
    // design), so the only real failure mode is a network/server error,
    // which we still show as a toast-free inline message below.
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter the email you registered with");
      return;
    }
    setError("");
    mutation.mutate({ email: email.trim() });
  };

  if (mutation.isSuccess) {
    return (
      <div className="animate-fade-in text-center">
        <h2 className="text-ink text-xl font-bold mb-2">Check your email</h2>
        <p className="text-slate-muted text-sm mb-6">
          If an account exists for <span className="text-ink font-medium">{email}</span>, we've sent a link to reset your password. It expires in 20 minutes.
        </p>
        <Link to="/login" className="text-teal text-sm font-medium hover:underline">
          ← Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-ink text-xl font-bold mb-1">Forgot your password?</h2>
      <p className="text-slate-muted text-sm mb-6">
        Enter your email and we'll send you a link to reset it.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoComplete="email"
        />

        {mutation.isError && (
          <p className="text-xs text-red-400">
            Something went wrong. Please try again in a moment.
          </p>
        )}

        <Button type="submit" size="xl" loading={mutation.isPending} disabled={mutation.isPending}>
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-slate-muted mt-5">
        Remembered it?{" "}
        <Link to="/login" className="text-teal font-medium hover:underline">
          Back to Login
        </Link>
      </p>

      <div className="mt-6 pt-6 border-t border-surface-border text-center">
        <p className="text-slate-muted text-xs mb-2">Still can't get in?</p>
        <Link to="/customer/support" className="text-teal text-sm hover:underline">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
