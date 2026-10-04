import { Gift, Share2, Users, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { getMyReferralStats } from "@/api/referrals";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";

export default function ReferFriendsPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ["my-referral-stats"], queryFn: getMyReferralStats });

  const referralLink = user?.id ? `${window.location.origin}/register?ref=${user.id}` : "";

  const handleShare = async () => {
    const shareText = "Come use Medimoove with me — fast local delivery, real vendors near you. Sign up with my link:";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on Medimoove", text: shareText, url: referralLink });
        return;
      } catch {
        // Cancelled the native share sheet — clipboard fallback below still works.
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${referralLink}`);
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn't copy the link — try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <TopBar showBack title="Refer Friends" />
        <div className="px-4 py-3 space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  const remaining = data ? data.threshold - data.progress_toward_next : 0;
  const progressPct = data ? (data.progress_toward_next / data.threshold) * 100 : 0;

  return (
    <div className="min-h-screen">
      <TopBar showBack title="Refer Friends" />
      <div className="px-4 py-3 space-y-4">
        <Card className="p-5 text-center">
          <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-8 h-8 text-teal" strokeWidth={2} />
          </div>
          <h1 className="text-ink font-bold text-lg">Bring your friends, get rewarded</h1>
          <p className="text-slate-muted text-sm mt-1.5">
            Share your link below. Once your friends join and place their first order, they count toward your reward — the more you bring in, the more you earn.
          </p>
        </Card>

        {!data?.rewards_enabled && (
          <Card className="p-4 bg-orange-400/5 border-orange-400/20">
            <p className="text-orange-400 text-sm font-medium">Rewards are paused right now</p>
            <p className="text-slate-muted text-xs mt-1">
              You can still share your link and bring friends in — we're just not sending new rewards at the moment. Nothing you've already earned is affected.
            </p>
          </Card>
        )}

        <Card className="p-4">
          <p className="text-slate-muted text-xs mb-2">Your referral link</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-app border border-surface-border">
              <p className="text-ink text-xs truncate">{referralLink}</p>
            </div>
            <button onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal text-navy text-sm font-semibold flex-shrink-0">
              <Share2 className="w-4 h-4" strokeWidth={2} />
              Share
            </button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal" />
              <p className="text-ink font-semibold text-sm">Your progress</p>
            </div>
            <p className="text-teal font-bold text-sm">{data?.total_credited || 0} referred</p>
          </div>

          {data?.rewards_enabled && (
            <>
              <div className="w-full h-2 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="text-slate-muted text-xs mt-2">
                {remaining} more {remaining === 1 ? "friend" : "friends"} until your next reward
              </p>
            </>
          )}

          {data?.total_pending > 0 && (
            <p className="text-slate-muted text-xs mt-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {data.total_pending} more {data.total_pending === 1 ? "friend has" : "friends have"} joined through your link and are yet to place their first order
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
