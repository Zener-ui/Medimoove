import { useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, FileText, Download, AlertTriangle, Bike, Store, HelpCircle, CreditCard, Star, Pencil, Phone, KeyRound } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getOrderWithSubOrders, cancelSubOrder } from "@/api/orders";
import { createDispute, getMyDisputes } from "@/api/disputes";
import { formatNaira, formatDateTime, getStatusDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import ErrorState from "@/components/common/ErrorState";
import OrderProgress from "@/components/common/OrderProgress";
import RatingStars from "@/components/common/RatingStars";
import ReviewForm from "@/components/common/ReviewForm";
import { getReceiptHtml, getReceiptPdf, getReceiptByReference } from "@/api/receipts";
import { uploadDisputeEvidence } from "@/api/uploads";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reviewingSubId, setReviewingSubId] = useState(null);

  // The receipt's real receipt_id isn't the same as the order's id —
  // resolve it via reference lookup before the receipt buttons work.
  const { data: receiptRef } = useQuery({
    queryKey: ["receipt-ref", id],
    queryFn: () => getReceiptByReference(id),
    enabled: !!id,
    retry: false,
  });
  const receiptId = receiptRef?.receipt?.receipt_id;

  const handleViewReceipt = async () => {
    if (!receiptId) return;
    const receiptWindow = window.open("about:blank", "_blank");
    try {
      if (!receiptWindow) {
        toast.error("Please allow pop-ups to view your receipt.");
        return;
      }
      const html = await getReceiptHtml(receiptId);
      const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      receiptWindow.location.href = blobUrl;
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      receiptWindow?.close();
      toast.error(err.message || "Couldn't open the receipt.");
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receiptId) return;
    try {
      const blob = await getReceiptPdf(receiptId);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `medimoove-receipt-${receiptId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      toast.error(err.message || "Couldn't download the receipt.");
    }
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => getOrderWithSubOrders(id),
    refetchInterval: (d) => {
      const inProgress = ["PAYMENT_CONFIRMED","PREPARING","WAITING_RIDER","RIDER_ASSIGNED","PICKED_UP","DELIVERING"].includes(d?.order?.status);
      return inProgress ? 15000 : false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubOrder,
    onSuccess: () => { toast.success("Sub-order cancelled"); qc.invalidateQueries(["order-detail", id]); },
    onError: (err) => toast.error(err.message),
  });

  // Existing disputes for THIS order — fetches all of the customer's
  // disputes and filters client-side since there's no single-order
  // lookup endpoint; fine at this scale (a customer's total dispute
  // count is always small).
  const { data: disputesData } = useQuery({
    queryKey: ["my-disputes"],
    queryFn: getMyDisputes,
  });
  const existingDispute = disputesData?.disputes?.find((d) => d.order_id === id || d.orders?.id === id);

  const [disputeForm, setDisputeForm] = useState({ reason: "" });
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const disputeMutation = useMutation({
    mutationFn: createDispute,
    onSuccess: () => {
      toast.success("Dispute submitted. An admin will review it.");
    },
    onError: (err) => toast.error(err.message || "Couldn't submit dispute."),
  });

  const handleEvidenceSelection = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const valid = selected.filter((file) => {
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: JPG, PNG or WebP only.`);
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name}: maximum size is 8 MB.`);
        return false;
      }
      return true;
    });
    const remaining = 5 - evidenceFiles.length;
    if (valid.length > remaining) toast.error("You can upload a maximum of 5 evidence photos.");
    setEvidenceFiles((current) => [...current, ...valid.slice(0, Math.max(0, remaining)).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    e.target.value = "";
  };

  const removeEvidenceFile = (index) => {
    setEvidenceFiles((current) => {
      const removed = current[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return current.filter((_, i) => i !== index);
    });
  };

  const disputeSubmitLock = useRef(false);

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    // Lock immediately, before evidence upload, so rapid taps cannot start
    // multiple uploads/submissions before the mutation reaches the API.
    if (disputeSubmitLock.current || disputeMutation.isPending) return;
    if (!disputeForm.reason.trim()) return toast.error("Please describe the problem.");
    if (!evidenceFiles.length) return toast.error("At least one evidence photo is required.");

    disputeSubmitLock.current = true;

    try {
      const uploaded = await uploadDisputeEvidence(evidenceFiles.map((item) => item.file));
      const paths = uploaded?.paths || [];
      if (!paths.length) throw new Error("Evidence upload failed.");

      await disputeMutation.mutateAsync({
        order_id: id,
        reason: disputeForm.reason.trim(),
        evidence_urls: paths,
      });

      setShowDisputeForm(false);
      setDisputeForm({ reason: "" });
      evidenceFiles.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
      setEvidenceFiles([]);
      qc.invalidateQueries({ queryKey: ["my-disputes"] });
    } catch (err) {
      toast.error(err.message || "Couldn't submit dispute.");
    } finally {
      disputeSubmitLock.current = false;
    }
  };

  if (isLoading) return <Loader fullscreen text="Loading order..." />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const order = data?.order;
  const orderStatusDisplay = getStatusDisplay(order?.status);
  const paymentStatusDisplay = {
    successful: { label: "Paid", color: "text-teal" },
    pending:    { label: "Payment Pending", color: "text-yellow-400" },
    failed:     { label: "Payment Failed", color: "text-red-400" },
    refunded:   { label: "Refunded", color: "text-slate-muted" },
  }[order?.payment_status] || { label: order?.payment_status, color: "text-slate-muted" };

  return (
    <div className="min-h-screen pb-8">
      <TopBar title="Order Details" showBack />
      <div className="px-4 md:px-8 py-4 space-y-4 md:grid md:grid-cols-3 md:gap-6 md:space-y-0 md:items-start">
        <div className="md:col-span-2 space-y-4">
          {/* Order header */}
          <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-ink font-display font-medium">Order #{order?.id.slice(0, 8).toUpperCase()}</p>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${orderStatusDisplay.bg} ${orderStatusDisplay.color}`}>
                {orderStatusDisplay.label}
              </span>
            </div>
            <p className="text-slate-muted text-xs">{formatDateTime(order?.created_at)}</p>
            <div className="flex items-center gap-1.5 text-xs pt-1">
              <CreditCard className="w-3.5 h-3.5 text-slate-muted" />
              <span className={`font-medium ${paymentStatusDisplay.color}`}>{paymentStatusDisplay.label}</span>
            </div>
          </div>

          {/* Sub-orders with progress tracker */}
          {order?.sub_orders?.map((sub) => {
            const subStatus = getStatusDisplay(sub.status);
            // Matches the backend's actual cancellation rule (see
            // orderStateMachine.js / subOrderController.cancelSubOrder):
            // cancellable only before the vendor starts preparing.
            // Showing this button for a later status would just produce
            // a failed request — better not to offer what won't work.
            const cancellable = sub.status === "PAYMENT_CONFIRMED";
            const rider = sub.riders?.users;
            return (
              <div key={sub.id} className="p-4 bg-surface rounded-2xl border border-surface-border space-y-4">
                <div className="flex items-center justify-between">
                  <Link to={`/customer/store/${sub.vendor_id}`} className="text-ink font-display font-medium flex items-center gap-1.5 hover:text-teal hover:underline">
                    <Store className="w-4 h-4 text-slate-muted shrink-0" /> {sub.vendors?.business_name}
                  </Link>
                  <span className="text-xs font-medium text-slate-muted capitalize">{sub.delivery_type}</span>
                </div>

                <OrderProgress status={sub.status} deliveryType={sub.delivery_type} statusDisplay={subStatus} />

                <div className="space-y-2 pt-1">
                  {sub.items?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm border-b border-surface-border pb-2">
                      <span className="text-slate-muted">
                        {item.products?.name}
                        {item.product_variants && <span className="text-slate-soft"> ({item.product_variants.value})</span>}
                        {" × "}{item.quantity}
                      </span>
                      <span className="text-ink">{formatNaira(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Delivery info */}
                {sub.delivery_type === "delivery" && sub.delivery_address && (
                  <p className="text-slate-muted text-xs flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {sub.delivery_address}</p>
                )}

                {/* Rider info — only relevant once one's assigned to a delivery order */}
                {sub.delivery_type === "delivery" && rider && (
                  <div className="p-3 bg-navy rounded-xl border border-surface-border space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-navy-mid flex items-center justify-center shrink-0">
                        <Bike className="w-4 h-4 text-teal" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-ink text-sm font-medium truncate">{rider.full_name}</p>
                        {rider.phone ? (
                          <a href={`tel:${rider.phone}`} className="text-teal text-xs underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {rider.phone}
                          </a>
                        ) : (
                          <p className="text-slate-muted text-xs">{rider.phone}</p>
                        )}
                      </div>
                    </div>
                    {sub.delivery_code && sub.status !== "DELIVERED" && sub.status !== "CANCELLED" && (
                      <div className="flex items-center justify-between pt-2 border-t border-surface-border">
                        <p className="text-slate-muted text-xs flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5" /> Give this code to your rider on delivery
                        </p>
                        <p className="text-ink text-lg font-display font-bold tracking-[0.3em]">{sub.delivery_code}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pickup info — vendor location/contact, for self-pickup orders */}
                {sub.delivery_type === "pickup" && (
                  <div className="p-3 bg-navy rounded-xl border border-surface-border space-y-1">
                    <p className="text-ink text-sm font-medium">
                      Pickup from <Link to={`/customer/store/${sub.vendor_id}`} className="text-teal hover:underline">{sub.vendors?.business_name}</Link>
                    </p>
                    {sub.vendors?.address && <p className="text-slate-muted text-xs flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /> {sub.vendors.address}</p>}
                    {sub.vendors?.phone && <p className="text-slate-muted text-xs">{sub.vendors.phone}</p>}
                  </div>
                )}

                {cancellable && (
                  <Button variant="danger" size="sm" onClick={() => cancelMutation.mutate(sub.id)} loading={cancelMutation.isPending}>
                    Cancel this item
                  </Button>
                )}

                {/* Rate & review — only once this store's part of the order
                    has actually been delivered; one review per sub-order,
                    enforced server-side too. */}
                {sub.status === "DELIVERED" && (() => {
                  const existingReview = Array.isArray(sub.reviews) ? sub.reviews[0] : sub.reviews;
                  if (reviewingSubId === sub.id) {
                    return (
                      <ReviewForm
                        subOrderId={sub.id}
                        hasRider={!!rider}
                        vendorName={sub.vendors?.business_name}
                        existingReview={existingReview}
                        onDone={() => setReviewingSubId(null)}
                      />
                    );
                  }
                  if (existingReview) {
                    return (
                      <div className="p-3 bg-navy rounded-xl border border-surface-border flex items-start justify-between gap-2">
                        <div>
                          <p className="text-slate-muted text-xs mb-1">Your review</p>
                          <RatingStars rating={existingReview.vendor_rating} size="xs" />
                          {existingReview.comment && <p className="text-slate-muted text-xs mt-1">{existingReview.comment}</p>}
                          {existingReview.photo_urls?.length > 0 && (
                            <div className="flex gap-1.5 mt-2">
                              {existingReview.photo_urls.map((url, i) => (
                                <img key={url} src={url} alt={`Your review photo ${i + 1}`} className="w-10 h-10 rounded-lg object-cover border border-surface-border" />
                              ))}
                            </div>
                          )}
                        </div>
                        <button onClick={() => setReviewingSubId(sub.id)} className="text-teal text-xs font-medium flex items-center gap-1 shrink-0">
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    );
                  }
                  return (
                    <Button variant="secondary" size="sm" onClick={() => setReviewingSubId(sub.id)}>
                      <Star className="w-3.5 h-3.5 inline mr-1.5" />Rate & Review
                    </Button>
                  );
                })()}
              </div>
            );
          })}
        </div>

        <div className="space-y-4 md:sticky md:top-20">
          {/* Price summary */}
          <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-2">
            <p className="text-ink font-display font-medium mb-1">Summary</p>
            <div className="flex justify-between text-sm"><span className="text-slate-muted">Subtotal</span><span className="text-ink">{formatNaira(order?.subtotal)}</span></div>
            {order?.delivery_fee > 0 && (
              <div className="flex justify-between text-sm"><span className="text-slate-muted">Delivery</span><span className="text-ink">{formatNaira(order?.delivery_fee)}</span></div>
            )}
            <div className="border-t border-surface-border pt-2 flex justify-between">
              <span className="text-ink font-bold">Total Paid</span>
              <span className="text-teal font-black">{formatNaira(order?.total)}</span>
            </div>
          </div>

          {/* Receipt buttons */}
          {order?.status === "DELIVERED" && receiptId && (
            <div className="flex gap-2">
              <Button variant="secondary" size="lg" className="flex-1"
                onClick={handleViewReceipt}>
                <FileText className="w-4 h-4 inline mr-1.5" />View Receipt
              </Button>
              <Button variant="secondary" size="lg" className="flex-1"
                onClick={handleDownloadReceipt}>
                <Download className="w-4 h-4 inline mr-1.5" />PDF
              </Button>
            </div>
          )}

          {/* Support contact — available regardless of order status */}
          <Button variant="secondary" size="lg" onClick={() => navigate("/customer/support")}>
            <HelpCircle className="w-4 h-4 inline mr-1.5" />Contact Support
          </Button>

          {/* Report a problem / dispute */}
          {order?.status === "DELIVERED" && (
            <div className="p-4 bg-surface rounded-2xl border border-surface-border space-y-3">
              {existingDispute ? (
                <>
                  <p className="text-ink font-display font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Dispute Filed
                  </p>
                  <p className="text-slate-muted text-xs">
                    Status: <span className="text-ink font-medium">{existingDispute.status}</span>
                  </p>
                  {existingDispute.resolution_note && (
                    <p className="text-slate-muted text-xs">{existingDispute.resolution_note}</p>
                  )}
                </>
              ) : showDisputeForm ? (
                <form onSubmit={handleDisputeSubmit} className="space-y-3">
                  <p className="text-ink font-display font-medium">Report a Problem</p>
                  <textarea
                    rows={3}
                    placeholder="What went wrong with this order?"
                    value={disputeForm.reason}
                    onChange={(e) => setDisputeForm((f) => ({ ...f, reason: e.target.value }))}
                    className="w-full bg-navy rounded-xl border border-surface-border text-ink placeholder:text-slate-muted py-2.5 px-3 text-sm outline-none resize-none focus:border-teal focus:ring-1 focus:ring-teal/30"
                  />
                  <div>
                    <label className="text-sm font-medium text-slate-soft block mb-1.5">Evidence Photos</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {evidenceFiles.map((file, i) => (
                        <div key={`${file.name}-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-navy-mid border border-surface-border">
                          <img src={file.preview} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeEvidenceFile(i)}
                            className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1" aria-label="Remove evidence">
                            <span className="text-xs leading-none">×</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    {evidenceFiles.length < 5 && (
                      <label className="flex items-center justify-center h-20 rounded-xl border border-dashed border-surface-border text-slate-muted hover:text-teal hover:border-teal/50 cursor-pointer text-sm">
                        Add photos of the damaged/incorrect product
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleEvidenceSelection} />
                      </label>
                    )}
                    <p className="text-slate-muted text-xs mt-1.5">
                      Up to 5 photos. JPG, PNG or WebP, max 8 MB each. Images must be at least 500×500px.
                    </p>
                  </div>
                  <p className="text-slate-muted text-xs">
                    Disputes must be filed within 24 hours of delivery. At least one photo is required as evidence.
                  </p>
                  <div className="flex gap-2">
                    <Button type="submit" size="md" className="flex-1" loading={disputeMutation.isPending}>
                      Submit Dispute
                    </Button>
                    <Button type="button" variant="secondary" size="md" onClick={() => setShowDisputeForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button variant="secondary" size="md" onClick={() => setShowDisputeForm(true)}>
                  <AlertTriangle className="w-4 h-4 inline mr-1.5" />Report a Problem
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
