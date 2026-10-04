import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import toast from "react-hot-toast";
import { getPolicyByType, getPolicyAcceptanceStatus, acceptPolicy } from "@/api/policies";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";

/**
 * Shown as the first onboarding step for both vendors and riders.
 * Submission of the application form is blocked until the checkbox
 * is checked and the acceptance call succeeds — the backend also
 * enforces this independently (see checkTermsAccepted.js), so this
 * is a UX gate, not the only line of defense.
 *
 * Registration itself now also requires accepting the same terms
 * (see RegisterPage.jsx), so most people arriving here have already
 * accepted — this checks that first and skips straight through
 * instead of asking again.
 */
export default function TermsAcceptanceStep({ onAccepted }) {
  const [checked, setChecked] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["policy", "terms_of_service"],
    queryFn: () => getPolicyByType("terms_of_service"),
  });
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["policy-status", "terms_of_service"],
    queryFn: () => getPolicyAcceptanceStatus("terms_of_service"),
  });
  const policy = data?.policy;
  const alreadyAccepted = !!statusData?.accepted;

  useEffect(() => {
    if (alreadyAccepted) onAccepted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyAccepted]);

  const mutation = useMutation({
    mutationFn: () => acceptPolicy({ policy_id: policy.id, policy_version: policy.version }),
    onSuccess: () => onAccepted(),
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || statusLoading || alreadyAccepted) return <Loader />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-teal" />
        <h2 className="text-ink text-lg font-display font-semibold">{policy?.title || "Terms & Conditions"}</h2>
      </div>

      <div className="max-h-64 overflow-y-auto p-4 bg-surface rounded-2xl border border-surface-border text-slate-muted text-sm leading-relaxed whitespace-pre-wrap">
        {policy?.content}
      </div>

      <label className="flex items-start gap-2.5 text-sm text-slate-soft cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-teal shrink-0"
        />
        <span>I have read and agree to the Medimoove Terms &amp; Conditions.</span>
      </label>

      <Button size="xl" disabled={!checked} loading={mutation.isPending} onClick={() => mutation.mutate()}>
        Continue
      </Button>
    </div>
  );
}
