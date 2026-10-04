import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getPinStatus, setWithdrawalPin } from "@/api/withdrawals";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";

const pinInputClass =
  "w-full text-center text-2xl tracking-[0.5em] font-bold bg-surface rounded-xl border border-surface-border " +
  "text-ink py-3 px-4 outline-none focus:border-teal focus:ring-1 focus:ring-teal/30";

// A withdrawal PIN is NOT the account password, but type="password" inside
// a submitted <form> is exactly what makes Chrome/Safari/Firefox offer to
// save it as one — and a user who taps "Save"/"Update" there overwrites
// their real saved login password with this 4-digit PIN, silently breaking
// their next login. type="text" + numeric input mode + manual dot-masking
// (via CSS below) keeps the same look without tripping that heuristic.
// autoComplete/data-*-ignore attributes are extra opt-outs for browsers and
// password managers (1Password, LastPass, etc.) that key off other signals.
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
 * Standalone "Change withdrawal PIN" settings row — separate from the
 * PIN gate that runs at withdrawal time (WithdrawalPinModal). Lets a
 * vendor/rider set up or change their PIN proactively from Settings
 * instead of only ever being prompted mid-withdrawal.
 */
export default function ChangePinSection() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const { data } = useQuery({ queryKey: ["withdrawal-pin-status"], queryFn: getPinStatus });
  const hasPin = !!data?.pin_set;

  const mutation = useMutation({
    mutationFn: () => setWithdrawalPin(hasPin ? { pin, current_pin: currentPin } : { pin }),
    onSuccess: () => {
      toast.success(hasPin ? "Withdrawal PIN updated" : "Withdrawal PIN set");
      qc.invalidateQueries(["withdrawal-pin-status"]);
      setOpen(false);
      setCurrentPin(""); setPin(""); setConfirmPin("");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN must be exactly 4 digits.");
    if (pin !== confirmPin) return toast.error("PINs don't match.");
    if (hasPin && !/^\d{4}$/.test(currentPin)) return toast.error("Enter your current PIN.");
    mutation.mutate();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between p-4 bg-surface rounded-2xl border border-surface-border"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-mid flex items-center justify-center shrink-0">
            {hasPin ? <ShieldCheck className="w-4 h-4 text-teal" /> : <Lock className="w-4 h-4 text-slate-muted" />}
          </div>
          <div className="text-left">
            <p className="text-ink text-sm font-medium">Withdrawal PIN</p>
            <p className="text-slate-muted text-xs">{hasPin ? "Set — tap to change" : "Not set up yet"}</p>
          </div>
        </div>
        <span className="text-teal text-xs font-medium">{hasPin ? "Change" : "Set up"}</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={hasPin ? "Change Withdrawal PIN" : "Set Withdrawal PIN"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {hasPin && (
            <div>
              <label className="text-xs text-slate-muted block mb-1">Current PIN</label>
              <input {...pinFieldProps} maxLength={4} autoFocus
                value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={pinInputClass} />
            </div>
          )}
          <div>
            <label className="text-xs text-slate-muted block mb-1">New PIN</label>
            <input {...pinFieldProps} maxLength={4} autoFocus={!hasPin}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={pinInputClass} />
          </div>
          <div>
            <label className="text-xs text-slate-muted block mb-1">Confirm New PIN</label>
            <input {...pinFieldProps} maxLength={4}
              value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={pinInputClass} />
          </div>
          <Button type="submit" size="xl" loading={mutation.isPending}>{hasPin ? "Update PIN" : "Set PIN"}</Button>
        </form>
      </Modal>
    </>
  );
}
