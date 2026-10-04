import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, Check } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getOnboardingStatus, markStepComplete, reapplyVendor } from "@/api/onboarding";
import { registerVendor, getMyVendorProfile } from "@/api/vendors";
import { getCategories } from "@/api/search";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Loader from "@/components/common/Loader";
import GpsLocationCapture from "@/components/common/GpsLocationCapture";
import TermsAcceptanceStep from "@/components/common/TermsAcceptanceStep";
import VerificationStatusCard from "@/components/common/VerificationStatusCard";

const STEPS = [
  { key: "terms_accepted",             label: "Terms & Conditions", desc: "Read and accept the Medimoove terms" },
  { key: "business_profile_completed", label: "Business Profile",   desc: "Tell us about your pharmacy" },
  { key: "verification_submitted",     label: "Await Pharmacy Verification", desc: "We'll review within 24h" },
];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [form, setForm] = useState({ business_name: "", category: "", location: "", address: "", phone: user?.phone || "", whatsapp: "", location_lat: null, location_lng: null });
  const { data: categoryData } = useQuery({ queryKey: ["vendor-categories"], queryFn: getCategories, staleTime: Infinity });
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useQuery({ queryKey: ["onboarding"], queryFn: getOnboardingStatus });
  const progress = data?.onboarding;

  // Source of truth for approval state — NOT onboarding_progress,
  // which only tracks wizard steps and doesn't reflect admin
  // approve/reject decisions (a rejected vendor can still have
  // verification_submitted=true from their original application).
  const { data: vendorData, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: getMyVendorProfile,
    enabled: !!progress?.verification_submitted,
    retry: false,
  });
  const vendor = vendorData?.vendor;

  const registerMutation = useMutation({
    mutationFn: registerVendor,
    onSuccess: async () => {
      await markStepComplete("business_profile_completed");
      await markStepComplete("verification_submitted");
      toast.success("Pharmacy registered! Awaiting admin approval.");
      qc.invalidateQueries(["onboarding"]);
      qc.invalidateQueries(["vendor-profile"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const reapplyMutation = useMutation({
    mutationFn: reapplyVendor,
    onSuccess: () => {
      toast.success("Reapplication submitted.");
      qc.invalidateQueries(["vendor-profile"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.business_name.trim()) e.business_name = "Required";
    if (!form.category.trim()) e.category = "Required";
    if (!form.location.trim()) e.location = "Required";
    if (!form.address.trim()) e.address = "Search for your pharmacy's address above";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.location_lat || !form.location_lng) e.location_pin = "Search for your pharmacy's address or drop a pin to set its location";
    setErrors(e);
    return !Object.keys(e).length;
  };

  if (isLoading) return <Loader fullscreen />;

  // Approval status — not wizard-step completion — decides dashboard access.
  if (vendor?.status === "approved") { navigate("/vendor/dashboard", { replace: true }); return null; }

  const completedCount = [termsAccepted || progress?.business_profile_completed, progress?.business_profile_completed, progress?.verification_submitted].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-navy px-4 py-8 max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="text-ink text-2xl font-display font-semibold flex items-center gap-2">Set up your pharmacy <Store className="w-6 h-6 text-teal" /></h1>
        <p className="text-slate-muted text-sm mt-1">{completedCount} of {STEPS.length} steps completed</p>
        <div className="mt-3 h-1.5 bg-surface-raised rounded-full overflow-hidden">
          <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${(completedCount / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {STEPS.map((step, i) => {
          const done = i === 0 ? termsAccepted || progress?.business_profile_completed : progress?.[step.key];
          const active = i === completedCount;
          return (
            <div key={step.key} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${done ? "border-teal/30 bg-teal/5" : active ? "border-teal bg-teal/10" : "border-surface-border bg-surface opacity-50"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${done ? "bg-teal text-navy" : active ? "border-2 border-teal text-teal" : "border border-surface-border text-slate-muted"}`}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div>
                <p className={`text-sm font-semibold ${done || active ? "text-ink" : "text-slate-muted"}`}>{step.label}</p>
                <p className="text-slate-muted text-xs">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 0 — Terms & Conditions, must be accepted before the form shows */}
      {!progress?.business_profile_completed && !termsAccepted && (
        <TermsAcceptanceStep onAccepted={() => setTermsAccepted(true)} />
      )}

      {/* Step 1 — Business profile form */}
      {!progress?.business_profile_completed && termsAccepted && (
        <form onSubmit={(e) => { e.preventDefault(); if (validate()) registerMutation.mutate(form); }} className="space-y-3">
          <Input label="Business Name" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} error={errors.business_name} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="onboarding-category" className="text-sm font-medium text-slate-soft">Category</label>
            <select
              id="onboarding-category"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
            >
              <option value="">Select a category</option>
              {categoryData?.categories?.map((cat) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-400">{errors.category}</p>}
          </div>
          <Input label="Location / Area" placeholder="e.g. Otukpo Central Market" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} error={errors.location} />
          <div>
            <GpsLocationCapture
              buttonLabel="Set Pharmacy Location"
              onChange={({ lat, lng, description }) => setForm((f) => ({ ...f, address: description, location_lat: lat, location_lng: lng }))}
            />
            {errors.address && <p className="text-xs text-red-400 mt-1">{errors.address}</p>}
            {errors.location_pin && <p className="text-xs text-red-400 mt-1">{errors.location_pin}</p>}
          </div>
          <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors.phone} />
          <Input label="WhatsApp (optional)" type="tel" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
          <Button type="submit" size="xl" loading={registerMutation.isPending}>Register Pharmacy</Button>
        </form>
      )}

      {/* Step 2 — Pending / rejected, based on actual admin decision */}
      {progress?.verification_submitted && vendor && vendor.status !== "approved" && (
        vendorLoading ? <Loader /> : (
          <VerificationStatusCard
            role="vendor"
            status={vendor.status}
            name={form.business_name || user?.full_name}
            applicationId={vendor.id}
            reason={vendor.rejection_reason}
            onReapply={() => reapplyMutation.mutate()}
            reapplying={reapplyMutation.isPending}
          />
        )
      )}
    </div>
  );
}
