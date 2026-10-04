import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { getPilotSettings, updatePilotSettings, generateInviteCode } from "@/api/admin";
import { formatDate } from "@/utils";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Modal from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Loader";

export default function AdminPilotPage() {
  const qc = useQueryClient();
  const [inviteModal, setInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ role: "vendor", expires_days: 7 });
  const [lastCode, setLastCode] = useState(null);

  const { data, isLoading } = useQuery({ queryKey: ["pilot-settings"], queryFn: getPilotSettings });
  const settings = data?.settings;

  const updateMutation = useMutation({
    mutationFn: updatePilotSettings,
    onSuccess: () => { toast.success("Settings updated"); qc.invalidateQueries(["pilot-settings"]); },
    onError: (err) => toast.error(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: generateInviteCode,
    onSuccess: (d) => { setLastCode(d.invite_code); toast.success("Invite code generated"); },
    onError: (err) => toast.error(err.message),
  });

  const toggle = (key) => updateMutation.mutate({ [key]: !settings?.[key] });

  const TOGGLES = [
    { key: "is_pilot_mode",        label: "Pilot Mode",            desc: "Enable restricted launch mode" },
    { key: "vendor_invite_only",   label: "Vendor Invite Only",    desc: "Require invite code for vendors" },
    { key: "rider_invite_only",    label: "Rider Invite Only",     desc: "Require invite code for riders" },
    { key: "onboarding_paused",    label: "Pause Onboarding",      desc: "Stop all new registrations" },
    { key: "maintenance_mode",     label: "Maintenance Mode",      desc: "Take platform offline" },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-2">Pilot Launch Settings</h1>
      <p className="text-slate-muted text-sm mb-4">Control Medimoove's launch in Otukpo</p>

      {isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl mb-2" />) : (
        <Card className="p-4 mb-4 space-y-4">
          {TOGGLES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-ink text-sm font-medium">{label}</p>
                <p className="text-slate-muted text-xs">{desc}</p>
              </div>
              <button onClick={() => toggle(key)}
                className={`w-12 h-6 rounded-full transition-all relative ${settings?.[key] ? key === "maintenance_mode" ? "bg-red-400" : "bg-teal" : "bg-surface-raised"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings?.[key] ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </Card>
      )}

      <Button size="lg" className="w-full mb-3" onClick={() => { setLastCode(null); setInviteModal(true); }}>
        Generate Invite Code
      </Button>

      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Generate Invite Code">
        <div className="space-y-3">
          <div>
            <p className="text-slate-soft text-sm font-medium mb-2">Role</p>
            <div className="grid grid-cols-2 gap-2">
              {["vendor","rider"].map((r) => (
                <button key={r} onClick={() => setInviteForm((f) => ({ ...f, role: r }))}
                  className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${inviteForm.role === r ? "border-teal bg-teal/10 text-teal" : "border-surface-border bg-surface text-slate-muted"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-slate-soft text-sm font-medium mb-2">Expires in</p>
            <div className="flex gap-2">
              {[3,7,14,30].map((d) => (
                <button key={d} onClick={() => setInviteForm((f) => ({ ...f, expires_days: d }))}
                  className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${inviteForm.expires_days === d ? "border-teal bg-teal/10 text-teal" : "border-surface-border bg-surface text-slate-muted"}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {lastCode && (
            <div className="p-3 bg-teal/10 border border-teal/30 rounded-xl text-center">
              <p className="text-slate-muted text-xs mb-1">Invite Code</p>
              <p className="text-teal font-black text-lg tracking-wider">{lastCode.code}</p>
              <p className="text-slate-muted text-xs mt-1">Expires: {formatDate(lastCode.expires_at)}</p>
            </div>
          )}
          <Button size="xl" onClick={() => inviteMutation.mutate(inviteForm)} loading={inviteMutation.isPending}>
            Generate
          </Button>
        </div>
      </Modal>
    </div>
  );
}
