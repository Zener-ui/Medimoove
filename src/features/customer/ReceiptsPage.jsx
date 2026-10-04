import { useQuery } from "@tanstack/react-query";
import { Receipt, Banknote, Undo2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { getMyReceipts, getReceiptHtml } from "@/api/receipts";
import { formatDate } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import EmptyState from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Loader";

const TYPE_ICONS = { ORDER: Receipt, WITHDRAWAL: Banknote, REFUND: Undo2 };

export default function ReceiptsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["receipts"], queryFn: getMyReceipts });
  const receipts = data?.receipts || [];

  // These endpoints are authenticated — a raw window.open(url) never
  // attaches the JWT the client injects, so it would just 401. Open a
  // blank tab synchronously (so popup blockers don't kill it), fetch
  // the HTML through the authenticated axios client, then write it
  // into that tab once it resolves.
  const openReceipt = async (receiptId) => {
    const tab = window.open("", "_blank");
    try {
      // getReceiptHtml already returns the raw HTML string — client.js's
      // response interceptor unwraps response.data globally, so there's
      // no further .data to reach for here. Writing res.data (a string's
      // nonexistent .data property, i.e. undefined) is what was putting
      // the literal word "undefined" on a blank page.
      const html = await getReceiptHtml(receiptId);
      if (tab) {
        tab.document.write(html);
        tab.document.close();
      }
    } catch (err) {
      if (tab) tab.close();
      toast.error(err.message || "Couldn't open receipt");
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Receipts" showBack />
      <div className="px-4 py-3 space-y-3">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)
          : receipts.length === 0
            ? <EmptyState icon={Receipt} title="No receipts yet" description="Your payment receipts will appear here" />
            : receipts.map((r) => (
                <button
                  key={r.id}
                  onClick={() => openReceipt(r.receipt_id)}
                  className="w-full p-4 bg-surface rounded-2xl border border-surface-border hover:border-navy-light text-left transition-all flex items-center gap-3"
                >
                  {(() => { const Ic = TYPE_ICONS[r.type] || FileText; return <Ic className="w-6 h-6 text-slate-soft" strokeWidth={1.5} />; })()}
                  <div className="flex-1">
                    <p className="text-ink text-sm font-semibold">{r.type.replace("_", " ")}</p>
                    <p className="text-slate-muted text-xs">{r.receipt_id}</p>
                    <p className="text-slate-muted text-xs">{formatDate(r.created_at)}</p>
                  </div>
                  <span className="text-teal text-xs">View →</span>
                </button>
              ))}
      </div>
    </div>
  );
}
