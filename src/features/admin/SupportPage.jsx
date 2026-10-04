import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getAdminTickets, replyToAdminTicket } from "@/api/admin";
import { formatDateTime } from "@/utils";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

const PRIORITY_COLORS = { LOW:"text-slate-muted", NORMAL:"text-blue-accent", HIGH:"text-yellow-400", CRITICAL:"text-red-400" };

export default function AdminSupportPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-tickets"], queryFn: getAdminTickets, refetchInterval: 30000 });
  const tickets = data?.tickets || [];

  const replyMutation = useMutation({
    mutationFn: ({ id, message }) => replyToAdminTicket(id, message),
    onSuccess: () => { toast.success("Reply sent"); qc.invalidateQueries(["admin-tickets"]); setReply(""); setSelected(null); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-ink text-xl font-bold mb-4">Support Tickets</h1>
      <div className="space-y-3">
        {isLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : tickets.length === 0 ? <EmptyState icon={MessageCircle} title="No tickets" />
          : tickets.map((t) => (
              <div key={t.id} className="p-4 bg-surface rounded-2xl border border-surface-border cursor-pointer hover:border-navy-light transition-all" onClick={() => setSelected(t)}>
                <div className="flex items-start justify-between mb-1">
                  <p className="text-ink font-semibold text-sm flex-1 mr-2">{t.subject}</p>
                  <span className={`text-xs font-bold ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                </div>
                <p className="text-slate-muted text-xs">{t.users?.full_name} ({t.users?.role}) · {formatDateTime(t.created_at)}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs capitalize ${t.status === "RESOLVED" ? "text-teal" : "text-yellow-400"}`}>{t.status}</span>
                  <span className="text-teal text-xs">Reply →</span>
                </div>
              </div>
            ))}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.subject} size="lg">
        <div className="space-y-3">
          <div className="p-3 bg-navy rounded-xl border border-surface-border">
            <p className="text-slate-muted text-xs mb-1">{selected?.users?.full_name} ({selected?.role})</p>
            <p className="text-ink text-sm">{selected?.message}</p>
          </div>
          {(selected?.messages || []).map((m, i) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${m.sender === "admin" ? "bg-teal/5 border-teal/20 ml-4" : "bg-surface border-surface-border"}`}>
              <p className={`text-xs mb-1 font-medium ${m.sender === "admin" ? "text-teal" : "text-slate-muted"}`}>{m.sender === "admin" ? "You (Admin)" : selected?.users?.full_name}</p>
              <p className="text-ink">{m.message}</p>
            </div>
          ))}
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3}
            placeholder="Type your reply..."
            className="w-full bg-surface rounded-xl border border-surface-border text-ink placeholder:text-slate-muted px-4 py-3 text-sm outline-none focus:border-teal resize-none" />
          <Button size="xl" onClick={() => { if (!reply.trim()) return; replyMutation.mutate({ id: selected.id, message: reply }); }} loading={replyMutation.isPending}>
            Send Reply
          </Button>
        </div>
      </Modal>
    </div>
  );
}
