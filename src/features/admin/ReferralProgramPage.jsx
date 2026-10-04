import { useState, useEffect } from "react";
import { Gift, Award } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import {
  getReferralSettings, updateReferralSettings,
  getReferralMilestones, sendReferralReward,
} from "@/api/admin";
import { formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";

function SettingsCard() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["referral-settings"], queryFn: getReferralSettings });
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    if (data?.settings) setThreshold(String(data.settings.threshold));
  }, [data]);

  const save = useMutation({
    mutationFn: updateReferralSettings,
    onSuccess: () => { toast.success("Settings updated."); qc.invalidateQueries({ queryKey: ["referral-settings"] }); },
    onError: (e) => toast.error(e.message),
  });

  const rewardsEnabled = data?.settings?.rewards_enabled ?? true;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-teal" />
        <p className="text-ink font-semibold text-sm">Referral Program Settings</p>
      </div>

      <Input
        label="Referrals needed per reward"
        type="number" min="1" value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
        helper="A customer gets flagged for a reward every time they cross this many credited referrals (5, then 10, then 15...)."
      />
      <Button loading={save.isPending} disabled={!threshold || Number(threshold) <= 0}
        onClick={() => save.mutate({ threshold: Number(threshold) })}>
        Save Threshold
      </Button>

      <div className="flex items-center justify-between pt-3 border-t border-surface-border">
        <div>
          <p className="text-ink text-sm font-medium">Rewards</p>
          <p className="text-slate-muted text-[11px]">
            Turning this off doesn't stop tracking or sharing — just pauses new reward alerts, and customers see a "paused" message instead.
          </p>
        </div>
        <button
          onClick={() => save.mutate({ rewards_enabled: !rewardsEnabled })}
          className={clsx(
            "px-3 py-1.5 rounded-xl text-xs font-semibold border flex-shrink-0",
            rewardsEnabled ? "border-teal bg-teal/10 text-teal" : "border-surface-border text-slate-muted"
          )}
        >
          {rewardsEnabled ? "On" : "Paused"}
        </button>
      </div>
    </Card>
  );
}

function RewardModal({ milestone, onClose }) {
  const qc = useQueryClient();
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");

  const send = useMutation({
    mutationFn: (payload) => sendReferralReward(milestone.id, payload),
    onSuccess: () => {
      toast.success("Reward sent!");
      qc.invalidateQueries({ queryKey: ["referral-milestones"] });
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const canSend = type === "free_delivery" || Number(value) > 0;

  return (
    <Modal open={!!milestone} onClose={onClose} title="Send Referral Reward">
      <div className="space-y-3">
        <p className="text-slate-muted text-sm">
          Rewarding <span className="text-ink font-semibold">{milestone?.referrer?.full_name}</span> for reaching {milestone?.milestone_count} referrals.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-soft">Reward type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
          >
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off (₦)</option>
            <option value="free_delivery">Free delivery</option>
          </select>
        </div>

        {type !== "free_delivery" && (
          <Input
            label={type === "percentage" ? "Percentage (e.g. 15 for 15%)" : "Amount off (₦)"}
            type="number" min="1" value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}

        <p className="text-slate-muted text-[11px]">
          A one-time code will be generated and sent straight to them with a personal notification.
        </p>

        <Button size="xl" disabled={!canSend} loading={send.isPending}
          onClick={() => send.mutate({ type, value: type === "free_delivery" ? undefined : Number(value) })}>
          Send Reward
        </Button>
      </div>
    </Modal>
  );
}

export default function ReferralProgramPage() {
  const [rewarding, setRewarding] = useState(null);
  const { data } = useQuery({ queryKey: ["referral-milestones"], queryFn: () => getReferralMilestones() });
  const milestones = data?.milestones || [];

  return (
    <div className="min-h-screen">
      <TopBar title="Customer Referrals" />
      <div className="px-4 py-3 space-y-4">
        <SettingsCard />

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-teal" />
            <h3 className="text-ink font-semibold text-sm">Milestones</h3>
          </div>
          {milestones.length === 0 ? (
            <p className="text-slate-muted text-sm">No referral milestones reached yet.</p>
          ) : (
            milestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2 border-b border-surface-border last:border-0">
                <div className="min-w-0">
                  <p className="text-ink text-xs font-medium truncate">{m.referrer?.full_name || "Unknown"}</p>
                  <p className="text-slate-muted text-[11px]">{m.milestone_count} referrals · {formatDate(m.reached_at)}</p>
                </div>
                {m.reward_sent ? (
                  <span className="text-teal text-[11px] font-semibold flex-shrink-0">Sent</span>
                ) : (
                  <Button size="sm" onClick={() => setRewarding(m)} className="flex-shrink-0">Send Reward</Button>
                )}
              </div>
            ))
          )}
        </Card>
      </div>

      <RewardModal milestone={rewarding} onClose={() => setRewarding(null)} />
    </div>
  );
}
