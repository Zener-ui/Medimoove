import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";

// Purely presentational — AppShell owns the fetch and the queue (see
// its urgentQueue state), so this component's job is just "show
// whichever notice is currently first, tell the parent when
// dismissed." Keeping the async fetch at the AppShell level, same as
// every other prompt here, means onboarding/push/WhatsApp can
// correctly wait for "have we finished checking for an urgent notice
// yet" rather than racing an in-flight request they can't see.
export default function UrgentNoticePopup({ notice, queueLength, onDismiss }) {
  if (!notice) return null;

  return (
    <Modal open onClose={onDismiss} title={notice.title} size="sm">
      <div className="space-y-4">
        {notice.image_url ? (
          <img src={notice.image_url} alt="" className="w-full rounded-xl object-cover max-h-64" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-orange-400/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-orange-400" strokeWidth={2} />
          </div>
        )}
        <p className="text-slate-muted text-sm whitespace-pre-wrap">{notice.body}</p>
        <Button size="xl" onClick={onDismiss}>
          {queueLength > 1 ? "Next" : "Got it"}
        </Button>
      </div>
    </Modal>
  );
}

