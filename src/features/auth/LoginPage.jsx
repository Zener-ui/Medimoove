import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { login } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { roleHomePath } from "@/utils";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: storeLogin } = useAuthStore();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.identifier.trim()) e.identifier = "Enter your email or phone number";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      storeLogin(data.token, data.user);
      toast.success(`Welcome back, ${data.user.full_name.split(" ")[0]}!`);
      const from = location.state?.from?.pathname || roleHomePath(data.user.role);
      navigate(from, { replace: true });
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Check your credentials.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-ink text-xl font-bold mb-1">Welcome back</h2>
      <p className="text-slate-muted text-sm mb-6">Sign in to your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or Phone Number"
          type="text"
          placeholder="you@example.com or 08012345678"
          value={form.identifier}
          onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
          error={errors.identifier}
          autoComplete="username"
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-teal hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          size="xl"
          loading={mutation.isPending}
          disabled={mutation.isPending}
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-slate-muted mt-5">
        Don't have an account?{" "}
        <Link to="/register" state={location.state} className="text-teal font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
