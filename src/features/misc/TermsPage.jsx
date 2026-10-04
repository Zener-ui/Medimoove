import { ScrollText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPolicyByType } from "@/api/policies";
import TopBar from "@/components/layout/TopBar";
import Loader from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";

// Public, standalone Terms & Conditions page — reachable without
// being logged in, unlike the vendor/rider onboarding acceptance
// step, which is the same content but embedded in a signup flow.
export default function TermsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["policy", "terms_of_service"],
    queryFn: () => getPolicyByType("terms_of_service"),
  });

  if (isLoading) return <Loader fullscreen />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const policy = data?.policy;

  return (
    <div className="min-h-screen">
      <TopBar title="Terms & Conditions" showBack />
      <div className="px-4 md:px-8 py-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <ScrollText className="w-5 h-5 text-teal" />
          <h1 className="text-ink text-xl font-display font-semibold">{policy?.title || "Terms & Conditions"}</h1>
        </div>
        <div className="text-slate-muted text-sm leading-relaxed whitespace-pre-wrap">
          {policy?.content}
        </div>
        {policy?.version && (
          <p className="text-slate-muted text-xs mt-6 pt-4 border-t border-surface-border">Version {policy.version}</p>
        )}
      </div>
    </div>
  );
}
