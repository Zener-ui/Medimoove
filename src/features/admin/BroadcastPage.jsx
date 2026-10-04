import { useState } from "react";
import { Megaphone, AlertTriangle, Image as ImageIcon, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { broadcastNotification, createNotice, getAllNotices, deactivateNotice } from "@/api/admin";
import { uploadNoticeImage } from "@/api/uploads";
import { formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";

const CATEGORIES = [
  { value: "all", label: "Everyone" },
  { value: "customer", label: "Customers" },
  { value: "vendor", label: "Vendors" },
  { value: "rider", label: "Riders" },
];

function CategoryPicker({ category, setCategory }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-soft">Who sees this</label>
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={clsx(
              "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              category === c.value ? "border-teal bg-teal/10 text-teal" : "border-surface-border text-slate-muted"
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Quiet, lands in the inbox, also fires a real push if they have it
// enabled — but doesn't interrupt anything.
function NotificationTab() {
  const [category, setCategory] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);

  const send = useMutation({
    mutationFn: broadcastNotification,
    onSuccess: (res) => {
      toast.success(res.message);
      setTitle("");
      setBody("");
      setConfirming(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const canSend = title.trim() && body.trim();

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="w-5 h-5 text-teal" />
        <p className="text-ink font-semibold text-sm">Broadcast a Notification</p>
      </div>
      <p className="text-slate-muted text-xs">
        Delivered as both an in-app notification and a real push notification (if they have push enabled) to everyone in the category you choose. Doesn't interrupt anything — for something that needs to actually stop people, use Urgent Notice instead.
      </p>

      <CategoryPicker category={category} setCategory={setCategory} />
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. We're now live in Wadata!" />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-soft">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Type exactly what you want people to see..."
          className="w-full bg-surface rounded-xl border border-surface-border text-ink placeholder:text-slate-muted p-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
        />
      </div>

      {!confirming ? (
        <Button size="xl" disabled={!canSend} onClick={() => setConfirming(true)}>
          Review & Send
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="p-3 bg-surface rounded-xl border border-surface-border">
            <p className="text-slate-muted text-[11px] mb-1">Preview — sending to {CATEGORIES.find((c) => c.value === category)?.label.toLowerCase()}</p>
            <p className="text-ink text-sm font-semibold">{title}</p>
            <p className="text-slate-muted text-xs mt-1">{body}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)} className="flex-1">Edit</Button>
            <Button loading={send.isPending} onClick={() => send.mutate({ title, body, category })} className="flex-1">
              Confirm Send
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

// Interrupts — pops up the moment someone opens the app, stays queued
// until they actually dismiss it, can carry an image. For things that
// genuinely need everyone's attention, not routine updates.
function UrgentNoticeTab() {
  const qc = useQueryClient();
  const [category, setCategory] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const { data: noticesData } = useQuery({ queryKey: ["admin-notices"], queryFn: getAllNotices });
  const notices = noticesData?.notices || [];

  const reset = () => {
    setTitle(""); setBody(""); setImageFile(null); setImagePreview(null); setConfirming(false);
  };

  const send = useMutation({
    mutationFn: async () => {
      let image_url;
      if (imageFile) {
        const uploadRes = await uploadNoticeImage(imageFile);
        image_url = uploadRes.image_url;
      }
      return createNotice({ title, body, category, image_url });
    },
    onSuccess: () => {
      toast.success("Urgent notice sent — it'll pop up next time anyone in that category opens the app.");
      reset();
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deactivate = useMutation({
    mutationFn: deactivateNotice,
    onSuccess: () => { toast.success("Notice deactivated."); qc.invalidateQueries({ queryKey: ["admin-notices"] }); },
    onError: (e) => toast.error(e.message),
  });

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const canSend = title.trim() && body.trim();

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <p className="text-ink font-semibold text-sm">New Urgent Notice</p>
        </div>
        <p className="text-slate-muted text-xs">
          Pops up immediately when someone opens the app — stays on screen until they dismiss it. Use this sparingly, for things people genuinely need to see, not routine updates.
        </p>

        <CategoryPicker category={category} setCategory={setCategory} />
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Service disruption in Otukpo" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-soft">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Explain what's happening..."
            className="w-full bg-surface rounded-xl border border-surface-border text-ink placeholder:text-slate-muted p-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-soft">Image (optional)</label>
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="" className="w-full rounded-xl max-h-48 object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-navy/80 rounded-full p-1.5"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border border-dashed border-surface-border rounded-xl py-6 cursor-pointer text-slate-muted text-xs">
              <ImageIcon className="w-4 h-4" />
              Tap to add an image
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
            </label>
          )}
        </div>

        {!confirming ? (
          <Button size="xl" variant="danger" disabled={!canSend} onClick={() => setConfirming(true)}>
            Review & Send
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 bg-surface rounded-xl border border-orange-400/20">
              <p className="text-slate-muted text-[11px] mb-1">Preview — sending to {CATEGORIES.find((c) => c.value === category)?.label.toLowerCase()}</p>
              <p className="text-ink text-sm font-semibold">{title}</p>
              <p className="text-slate-muted text-xs mt-1">{body}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)} className="flex-1">Edit</Button>
              <Button variant="danger" loading={send.isPending} onClick={() => send.mutate()} className="flex-1">
                Confirm Send
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-ink font-semibold text-sm mb-3">Past Notices</h3>
        {notices.length === 0 ? (
          <p className="text-slate-muted text-sm">No urgent notices sent yet.</p>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="flex items-start justify-between gap-3 py-2 border-b border-surface-border last:border-0">
              <div className="min-w-0">
                <p className="text-ink text-xs font-medium truncate">{n.title}</p>
                <p className="text-slate-muted text-[11px]">{n.category} · {formatDate(n.created_at)}</p>
              </div>
              {n.is_active ? (
                <button
                  onClick={() => deactivate.mutate(n.id)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-surface-border text-slate-muted flex-shrink-0"
                >
                  Deactivate
                </button>
              ) : (
                <span className="text-[11px] text-slate-muted flex-shrink-0">Inactive</span>
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

export default function BroadcastPage() {
  const [tab, setTab] = useState("notification");

  return (
    <div className="min-h-screen">
      <TopBar title="Notifications" />
      <div className="px-4 py-3 space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("notification")}
            className={clsx(
              "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
              tab === "notification" ? "border-teal bg-teal/10 text-teal" : "border-surface-border text-slate-muted"
            )}
          >
            Notification
          </button>
          <button
            onClick={() => setTab("urgent")}
            className={clsx(
              "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
              tab === "urgent" ? "border-orange-400 bg-orange-400/10 text-orange-400" : "border-surface-border text-slate-muted"
            )}
          >
            Urgent Notice
          </button>
        </div>

        {tab === "notification" ? <NotificationTab /> : <UrgentNoticeTab />}
      </div>
    </div>
  );
}
