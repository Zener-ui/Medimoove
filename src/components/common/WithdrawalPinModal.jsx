import { useState } from "react";
import { Lock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { setWithdrawalPin } from "@/api/withdrawals";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";

const pinInputClass =
  "w-full text-center text-2xl tracking-[0.5em] font-bold bg-surface rounded-xl border border-surface-border " +
  "text-ink py-3 px-4 outline-none focus:border-teal focus:ring-1 focus:ring-teal/30";

// See ChangePinSection.jsx for why this isn't type="password": a PIN field
// of that type inside a submitted <form> gets offered to the browser's
// save-password prompt, and accepting it overwrites the real saved login
// password with this 4-digit PIN.
const pinFieldProps = {
  type: "text",
  inputMode: "numeric",
  autoComplete: "off",
  autoCorrect: "off",
  spellCheck: false,
  "data-lpignore": "true",
  "data-1p-ignore": "true",
  style: { WebkitTextSecurity: "disc", textSecurity: "disc" },
};

/**
 * Withdrawal PIN gate — shown right before a withdrawal request goes
 * through. If the vendor/rider has no PIN yet, walks them through
 * setting one first; either way, hands the 4-digit PIN back to the
 * caller via onVerified so it can be submitted alongside the
 * withdrawal request itself (the backend is the actual source of
 * truth on whether it's correct — see withdrawalController.requestWithdrawal).
 */
export default function WithdrawalPinModal({ open, onClose, hasPin, onVerified, verifying }) {
  const qc = useQueryClient();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const setupMutation = useMutation({
    mutationFn: () => setWithdrawalPin({ pin }),
    onSuccess: () => {
      qc.invalidateQueries(["withdrawal-pin-status"]);
      onVerified(pin);
      setPin(""); setConfirmPin("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleClose = () => { setPin(""); setConfirmPin(""); onClose(); };

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN must be exactly 4 digits.");
    if (pin !== confirmPin) return toast.error("PINs don't match.");
    setupMutation.mutate();
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast.error("Enter your 4-digit PIN.");
    onVerified(pin);
  };

  return (
    <Modal open={open} onClose={handleClose} title={hasPin ? "Enter Withdrawal PIN" : "Set Up Withdrawal PIN"} size="sm">
      {hasPin ? (
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-slate-muted text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Enter your 4-digit PIN to confirm this withdrawal.</span>
          </div>
          <input
            {...pinFieldProps} maxLength={4} autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={pinInputClass}
          />
          <Button type="submit" size="xl" loading={verifying}>Confirm Withdrawal</Button>
        </form>
      ) : (
        <form onSubmit={handleSetupSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-slate-muted text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Set a 4-digit PIN — you'll enter it before every withdrawal.</span>
          </div>
          <div>
            <label className="text-xs text-slate-muted block mb-1">New PIN</label>
            <input
              {...pinFieldProps} maxLength={4} autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={pinInputClass}
            />
          </div>
          <div>
            <label className="text-xs text-slate-muted block mb-1">Confirm PIN</label>
            <input
              {...pinFieldProps} maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={pinInputClass}
            />
          </div>
          <Button type="submit" size="xl" loading={setupMutation.isPending}>Set PIN & Continue</Button>
        </form>
      )}
    </Modal>
  );
}
