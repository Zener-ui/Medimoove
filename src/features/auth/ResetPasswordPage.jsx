import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "@/api/auth";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ new_password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: resetPassword,
  });

  const validate = () => {
    const e = {};
    if (form.new_password.length < 8) e.new_password = "At least 8 characters";
    if (form.new_password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({ token, new_password: form.new_password });
  };

  // No token in the URL at all — someone navigated here directly rather
  // than through the emailed link.
  if (!token) {
    return (
      <div className="animate-fade-in text-center">
        <h2 className="text-ink text-xl font-bold mb-2">Invalid reset link</h2>
        <p className="text-slate-muted text-sm mb-6">
          This page needs a reset link from your email. If you haven't requested one yet, start below.
        </p>
        <Link to="/forgot-password" className="text-teal text-sm font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  // Backend rejected it — expired, already used, or malformed. The
  // backend intentionally returns one generic message for all of these
  // (it doesn't distinguish "expired" from "already used" from "never
  // existed" — telling them apart would leak information about whether
  // a token was ever valid), so the frontend can't show a more specific
  // reason either.
  if (mutation.isError) {
    return (
      <div className="animate-fade-in text-center">
        <h2 className="text-ink text-xl font-bold mb-2">Link expired or invalid</h2>
        <p className="text-slate-muted text-sm mb-6">
          {mutation.error?.message || "This reset link is invalid or has expired."}
        </p>
        <Link to="/forgot-password" className="text-teal text-sm font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="animate-fade-in text-center">
        <h2 className="text-ink text-xl font-bold mb-2">Password reset</h2>
        <p className="text-slate-muted text-sm mb-6">
          Your password has been updated. You can now log in with your new password.
        </p>
        <Button size="xl" onClick={() => navigate("/login", { replace: true })}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-ink text-xl font-bold mb-1">Set a new password</h2>
      <p className="text-slate-muted text-sm mb-6">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          placeholder="Min. 8 characters"
          value={form.new_password}
          onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
          error={errors.new_password}
          autoComplete="new-password"
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          error={errors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit" size="xl" loading={mutation.isPending} disabled={mutation.isPending}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}
