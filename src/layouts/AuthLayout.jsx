import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight text-ink">
          Medimoove
        </h1>
        <p className="text-slate-muted text-xs mt-1 tracking-widest uppercase">Healthcare logistics. Delivered reliably.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface rounded-3xl border border-surface-border p-6 shadow-card">
        <Outlet />
      </div>

      <p className="text-slate-muted text-xs mt-6 text-center">
        © {new Date().getFullYear()} Medimoove. All rights reserved.
      </p>
    </div>
  );
}
