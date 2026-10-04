import { Clock, XCircle, MessageCircle } from "lucide-react";
import Button from "@/components/common/Button";
import { buildVerificationWhatsAppLink, VERIFICATION_WHATSAPP_NUMBERS } from "@/utils/whatsapp";

// Button isn't polymorphic (always renders a <button>), so the
// WhatsApp CTAs — which need to be real links for target="_blank" —
// are styled to match Button's "secondary" variant instead of reusing it.
const whatsAppLinkClass =
  "inline-flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-2xl w-full font-medium " +
  "bg-surface-raised text-ink border border-surface-border hover:bg-navy-light active:scale-95 transition-all duration-150";

const formatDisplayNumber = (n) => `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;

function WhatsAppButtons({ role, name, applicationId }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {VERIFICATION_WHATSAPP_NUMBERS.map((_, i) => {
        const waLink = buildVerificationWhatsAppLink({ role, name, applicationId, numberIndex: i });
        return (
          <a key={i} href={waLink} target="_blank" rel="noopener noreferrer" className={whatsAppLinkClass}>
            <MessageCircle className="w-4 h-4 shrink-0" /> {formatDisplayNumber(VERIFICATION_WHATSAPP_NUMBERS[i])}
          </a>
        );
      })}
    </div>
  );
}

/**
 * Pending or rejected verification status card, shared by vendor and
 * rider onboarding. `status` is "pending" | "rejected".
 */
export default function VerificationStatusCard({ role, status, name, applicationId, reason, onReapply, reapplying }) {
  if (status === "rejected") {
    return (
      <div className="space-y-3">
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <XCircle className="w-10 h-10 text-red-500 mx-auto" strokeWidth={1.5} />
          <p className="text-red-400 font-semibold text-sm mt-3">Application Not Approved</p>
          {reason && <p className="text-slate-muted text-xs mt-1 leading-relaxed">{reason}</p>}
        </div>
        {onReapply && (
          <Button size="xl" loading={reapplying} onClick={onReapply}>
            Resubmit Application
          </Button>
        )}
        <div>
          <p className="text-slate-muted text-xs mb-2">Need help? Verify via WhatsApp:</p>
          <WhatsAppButtons role={role} name={name} applicationId={applicationId} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-6 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl text-center">
        <Clock className="w-10 h-10 text-yellow-400 mx-auto" strokeWidth={1.5} />
        <p className="text-yellow-400 font-semibold text-sm mt-3">Your {role} application is under review.</p>
        <p className="text-slate-muted text-xs mt-1 leading-relaxed">We'll notify you as soon as it's approved. Usually within 24 hours.</p>
      </div>
      <div>
        <p className="text-slate-muted text-xs mb-2">Verify faster via WhatsApp:</p>
        <WhatsAppButtons role={role} name={name} applicationId={applicationId} />
      </div>
    </div>
  );
}
