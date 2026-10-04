import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { createTicket, getMyTickets } from "@/api/support";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Card from "@/components/common/Card";
import { Skeleton } from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";
import EmptyState from "@/components/common/EmptyState";
import { MessageCircle } from "lucide-react";

const PRIORITY_STYLE = {
  CRITICAL: "bg-red-500/10 text-red-500",
  HIGH: "bg-orange-500/10 text-orange-500",
  NORMAL: "bg-teal/10 text-teal",
  LOW: "bg-surface-raised text-slate-muted",
};

export default function SupportPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ subject: "", message: "" });
  const [errors, setErrors] = useState({});

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-support-tickets"],
    queryFn: getMyTickets,
  });
  const tickets = data?.tickets || [];

  const mutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (res) => {
      toast.success(res?.message || "Ticket submitted.");
      setForm({ subject: "", message: "" });
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
    },
    onError: (err) => toast.error(err.message || "Couldn't submit your ticket. Please try again."),
  });

  const validate = () => {
    const e = {};
    if (!form.subject.trim()) e.subject = "Please add a short subject";
    if (!form.message.trim()) e.message = "Please describe your issue";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-navy">
      <TopBar title="Contact Support" showBack />
      <div className="p-4 max-w-sm mx-auto mt-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subject"
            placeholder="e.g. Order arrived damaged"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            error={errors.subject}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-soft">Describe your issue</label>
            <textarea
              rows={5}
              placeholder="Tell us what's going on. The more detail, the faster we can help."
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className={clsx(
                "w-full bg-surface rounded-xl border border-surface-border",
                "text-ink placeholder:text-slate-muted",
                "py-3 px-4 text-sm outline-none transition-all duration-150 resize-none",
                "focus:border-teal focus:ring-1 focus:ring-teal/30",
                errors.message ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""
              )}
            />
            {errors.message && <p className="text-xs text-red-400">{errors.message}</p>}
          </div>
          <Button type="submit" size="xl" loading={mutation.isPending}>
            Submit Ticket
          </Button>
        </form>

        <div>
          <h3 className="text-ink font-semibold text-sm mb-3">Your Tickets</h3>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : isError ? (
            <ErrorState message="Couldn't load your tickets." onRetry={refetch} />
          ) : tickets.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No tickets yet" description="Anything you submit above will show up here." />
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <Card key={t.id} className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-ink text-sm font-medium truncate">{t.subject}</span>
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full flex-shrink-0", PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.LOW)}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-slate-muted text-xs">{t.status.replace(/_/g, " ")}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
