import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import {
  FIDELX_WHATSAPP_CHANNEL_LINK,
  recordWhatsAppChannelPromptShown,
  markWhatsAppChannelJoined,
} from "@/utils/whatsapp";

// Only ever mounted by AppShell when shouldShowWhatsAppChannelPrompt()
// already said yes — so as soon as this renders, it counts as "shown"
// for frequency-tracking purposes, regardless of which button they tap.
export default function WhatsAppChannelPrompt({ userId, onDone }) {
  useEffect(() => {
    recordWhatsAppChannelPromptShown(userId);
  }, [userId]);

  const handleJoin = () => {
    window.open(FIDELX_WHATSAPP_CHANNEL_LINK, "_blank", "noopener,noreferrer");
    // Tapping "Join" is the only signal available — there's no API to
    // actually verify WhatsApp channel membership — but it's enough to
    // meaningfully cut how often this pops up going forward.
    markWhatsAppChannelJoined(userId);
    onDone();
  };

  return (
    <Modal open onClose={onDone} title="Join Us on WhatsApp" size="sm">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto">
          <MessageCircle className="w-8 h-8 text-teal" strokeWidth={2} />
        </div>
        <div>
          <p className="text-ink font-semibold">Never miss what's happening on Medimoove</p>
          <p className="text-slate-muted text-sm mt-1.5">
            Our WhatsApp channel is where we share new stores going live, launch promos, and updates first — before anywhere else. Takes two seconds to join.
          </p>
        </div>
        <div className="space-y-2">
          <Button size="xl" onClick={handleJoin} className="flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
            Join the Channel
          </Button>
          <button onClick={onDone} className="text-slate-muted text-xs font-medium py-1">
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
