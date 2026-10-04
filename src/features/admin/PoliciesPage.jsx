import { useState, useEffect } from "react";
import { FileText, ChevronLeft, AlertTriangle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAllPolicies, getPolicyByType, updatePolicyAdmin } from "@/api/policies";
import { formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

const TYPE_LABELS = {
  terms_of_service: "Terms of Service",
  privacy_policy: "Privacy Policy",
  refund_policy: "Refund Policy",
  delivery_policy: "Delivery Policy",
  acceptable_use_policy: "Acceptable Use Policy",
};

// Every policy is seeded at setup with literal filler text (e.g.
// "Privacy policy content goes here.") — flag it so it's obvious
// which ones are still placeholder rather than real, published
// content, without needing to open each one to find out.
const looksLikePlaceholder = (content) => /content goes here/i.test(content || "");

function PolicyEditor({ type, onBack }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["policy", type], queryFn: () => getPolicyByType(type) });
  const policy = data?.policy;

  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (policy) {
      setTitle(policy.title);
      setVersion(policy.version);
      setContent(policy.content);
    }
  }, [policy]);

  const save = useMutation({
    mutationFn: () => updatePolicyAdmin(type, { title, content, version }),
    onSuccess: () => {
      toast.success("Policy updated.");
      qc.invalidateQueries({ queryKey: ["admin-policies"] });
      qc.invalidateQueries({ queryKey: ["policy", type] });
      onBack();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <TopBar title={TYPE_LABELS[type] || type} />
      <div className="px-4 py-3 space-y-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-slate-muted text-sm hover:text-ink transition-colors">
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          Back to policies
        </button>
        {isLoading ? (
          <p className="text-slate-muted text-sm">Loading…</p>
        ) : (
          <>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)}
              helper="Bump this when the content changes meaningfully — users who already accepted an older version can be asked to re-accept." />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-soft">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="w-full bg-surface rounded-xl border border-surface-border text-ink placeholder:text-slate-muted p-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 font-mono"
              />
            </div>
            <Button size="xl" loading={save.isPending} disabled={!title.trim() || !content.trim()} onClick={() => save.mutate()}>
              Save Changes
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-policies"], queryFn: getAllPolicies });
  const [editingType, setEditingType] = useState(null);
  const policies = data?.policies || [];

  // Content isn't in the list response (getAllPolicies only returns
  // metadata) — fetch each type's full content once, quietly, just to
  // check for the placeholder text. Cheap (5 small text fields) and
  // means the warning shows up without opening every editor by hand.
  const placeholderChecks = useQuery({
    queryKey: ["admin-policies-placeholder-check", policies.map((p) => p.type).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        policies.map((p) => getPolicyByType(p.type).then((r) => [p.type, looksLikePlaceholder(r.policy?.content)]))
      );
      return Object.fromEntries(results);
    },
    enabled: policies.length > 0,
  });

  if (editingType) return <PolicyEditor type={editingType} onBack={() => setEditingType(null)} />;

  return (
    <div className="min-h-screen">
      <TopBar title="Legal & Policies" />
      <div className="px-4 py-3 space-y-3">
        {isLoading ? (
          <p className="text-slate-muted text-sm">Loading…</p>
        ) : (
          policies.map((p) => {
            const isPlaceholder = placeholderChecks.data?.[p.type];
            return (
              <Card key={p.type} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-slate-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-ink font-semibold text-sm truncate">{p.title}</p>
                      <p className="text-slate-muted text-[11px]">v{p.version} · updated {formatDate(p.updated_at)}</p>
                      {isPlaceholder && (
                        <p className="text-amber-400 text-[11px] flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" /> Still placeholder content
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingType(p.type)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-surface-border text-slate-muted flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
