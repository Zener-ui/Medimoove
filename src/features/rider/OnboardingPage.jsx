import { useState } from "react";
import { Bike, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { registerRider, retryNinVerification, getMyRiderProfile } from "@/api/riders";
import { getOnboardingStatus, markStepComplete, reapplyRider } from "@/api/onboarding";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Loader from "@/components/common/Loader";
import TermsAcceptanceStep from "@/components/common/TermsAcceptanceStep";
import VerificationStatusCard from "@/components/common/VerificationStatusCard";

export default function RiderOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [form, setForm] = useState({ nin: "", phone: user?.phone || "", vehicle_type: "motorcycle" });
  const [errors, setErrors] = useState({});
  const [retryNin, setRetryNin] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["onboarding"], queryFn: getOnboardingStatus });
  const progress = data?.onboarding;

  // Once identity has been submitted, poll the rider profile so we can
  // show the real verification outcome (verified / failed / pending /
  // admin-rejected) rather than a generic "submitted" message.
  const { data: riderData, isLoading: riderLoading } = useQuery({
    queryKey: ["my-rider-profile"],
    queryFn: getMyRiderProfile,
    // A rider row is the source of truth for whether an application exists.
    // Do not gate this query on onboarding_progress: the rider row can be
    // created before the progress flag is written (for example if NIN
    // verification fails or the network drops after registration).
    enabled: true,
  });
  const rider = riderData?.rider;

  const mutation = useMutation({
    mutationFn: registerRider,
    onSuccess: async (res) => {
      await markStepComplete("identity_submitted");
      if (res.verification?.verified) {
        toast.success("Identity verified! Your rider account is approved.");
      } else {
        toast.error(res.verification?.message || "Verification did not pass — you can retry below.");
      }
      qc.invalidateQueries(["onboarding"]);
      qc.invalidateQueries(["my-rider-profile"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const retryMutation = useMutation({
    mutationFn: () => retryNinVerification(retryNin || undefined),
    onSuccess: (res) => {
      if (res.verification?.verified) {
        toast.success("Identity verified! Your rider account is approved.");
      } else {
        toast.error(res.verification?.message || "Verification still didn't pass.");
      }
      qc.invalidateQueries(["my-rider-profile"]);
      setRetryNin("");
    },
    onError: (err) => toast.error(err.message),
  });

  const reapplyMutation = useMutation({
    mutationFn: reapplyRider,
    onSuccess: () => {
      toast.success("Reapplication submitted.");
      qc.invalidateQueries(["my-rider-profile"]);
    },
    onError: (err) => toast.error(err.message),
  });

  const validate = () => {
    const e = {};
    if (!form.nin.trim() || form.nin.length < 11) e.nin = "Enter a valid 11-digit NIN";
    if (!form.phone.trim()) e.phone = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  if (isLoading || riderLoading) return <Loader fullscreen />;
  if (rider?.status === "approved") { navigate("/rider/dashboard", { replace: true }); return null; }

  const hasRiderApplication = !!rider;

  return (
    <div className="min-h-screen bg-navy px-4 py-8 max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="text-ink text-2xl font-display font-semibold flex items-center gap-2">Become a Rider <Bike className="w-6 h-6 text-teal" /></h1>
        <p className="text-slate-muted text-sm mt-1">Submit your details for verification</p>
      </div>

      {!hasRiderApplication && !termsAccepted ? (
        <TermsAcceptanceStep onAccepted={() => setTermsAccepted(true)} />
      ) : !hasRiderApplication ? (
        <form onSubmit={(e) => { e.preventDefault(); if (validate()) mutation.mutate(form); }} className="space-y-4">
          <Input label="NIN (National ID Number)" placeholder="11-digit NIN" value={form.nin}
            onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "").slice(0, 11) }))}
            error={errors.nin} helper="Your NIN will be verified via NIMC" />
          <Input label="Phone Number" type="tel" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={errors.phone} />
          <div>
            <label className="text-sm font-medium text-slate-soft block mb-1.5">Vehicle Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ v: "motorcycle", label: "Motorcycle" }, { v: "bicycle", label: "Bicycle" }].map(({ v, label }) => (
                <button key={v} type="button" onClick={() => setForm((f) => ({ ...f, vehicle_type: v }))}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${form.vehicle_type === v ? "border-teal bg-teal/10 text-teal" : "border-surface-border bg-surface text-slate-muted"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" size="xl" loading={mutation.isPending}>Submit for Verification</Button>
        </form>
      ) : rider?.status === "rejected" ? (
        <VerificationStatusCard
          role="rider"
          status="rejected"
          name={user?.full_name}
          applicationId={rider?.id}
          reason={rider?.rejection_reason}
          onReapply={() => reapplyMutation.mutate()}
          reapplying={reapplyMutation.isPending}
        />
      ) : rider?.nin_verified ? (
        <div className="p-6 bg-teal/10 border border-teal/20 rounded-2xl text-center">
          <CheckCircle2 className="w-10 h-10 text-teal mx-auto" strokeWidth={1.5} />
          <p className="text-teal font-semibold text-sm mt-3">Identity Verified</p>
          <p className="text-slate-muted text-xs mt-1 leading-relaxed">Your NIN has been verified and your rider account is approved.</p>
          <Button className="mt-4" onClick={() => navigate("/rider/dashboard")}>Go to Dashboard</Button>
        </div>
      ) : rider?.nin_verification_status === "failed" ? (
        <div className="space-y-4">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
            <p className="text-red-400 font-semibold text-sm">Verification Failed</p>
            <p className="text-slate-muted text-xs mt-1 leading-relaxed">
              {rider?.nin_verification_message || "We couldn't verify your NIN."}
            </p>
          </div>
          <div className="space-y-2">
            <Input
              label="Re-enter NIN (optional — leave blank to retry the same one)"
              placeholder="11-digit NIN"
              value={retryNin}
              onChange={(e) => setRetryNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
            />
            <Button size="xl" loading={retryMutation.isPending} onClick={() => retryMutation.mutate()}>
              Retry Verification
            </Button>
          </div>
        </div>
      ) : (
        <VerificationStatusCard role="rider" status="pending" name={user?.full_name} applicationId={rider?.id} />
      )}
    </div>
  );
}
