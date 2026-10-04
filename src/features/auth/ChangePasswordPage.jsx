import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { changePassword } from "@/api/auth";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import TopBar from "@/components/layout/TopBar";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.current_password) e.current_password = "Required";
    if (form.new_password.length < 8) e.new_password = "At least 8 characters";
    if (form.new_password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () => changePassword({
      current_password: form.current_password,
      new_password: form.new_password,
    }),
    onSuccess: () => {
      toast.success("Password changed successfully");
      navigate(-1);
    },
    onError: (err) => toast.error(err.message || "Failed to change password"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-navy">
      <TopBar title="Change Password" showBack />
      <div className="p-4 max-w-sm mx-auto mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={form.current_password}
            onChange={(e) => setForm((f) => ({ ...f, current_password: e.target.value }))}
            error={errors.current_password}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.new_password}
            onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
            error={errors.new_password}
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            error={errors.confirm}
          />
          <Button type="submit" size="xl" loading={mutation.isPending}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
