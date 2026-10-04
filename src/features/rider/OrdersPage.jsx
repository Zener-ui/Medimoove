import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bike, MapPin, Home, MessageCircle, Mic, Phone, Navigation } from "lucide-react";
import toast from "react-hot-toast";
import { getRiderSubOrders, updateSubOrderStatus } from "@/api/orders";
import { formatNaira, formatDateTime, getStatusDisplay } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Loader";

const NEXT_STATUS = { RIDER_ASSIGNED: "PICKED_UP", PICKED_UP: "DELIVERING", DELIVERING: "DELIVERED" };
const NEXT_LABEL  = { RIDER_ASSIGNED: "Mark Picked Up", PICKED_UP: "Start Delivery", DELIVERING: "Mark Delivered" };

// Universal Google Maps link — opens the phone's native maps app if
// installed (Google Maps, or the OS will offer a picker), falls back
// to the web otherwise. No API key needed, works cross-platform. This
// is what actually solves "Haversine isn't real roads" for the part
// that matters — the rider's real turn-by-turn trip — without
// touching the delivery-fee pricing math at all.
const directionsUrl = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

export default function RiderOrdersPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ["rider-suborders"], queryFn: getRiderSubOrders, refetchInterval: 15000 });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, deliveryCode }) => updateSubOrderStatus(id, status, deliveryCode),
    onSuccess: (_, { status }) => { toast.success(status === "DELIVERED" ? "Delivery complete!" : "Status updated"); qc.invalidateQueries(["rider-suborders"]); },
    onError: (err) => toast.error(err.message),
  });

  const handleAdvance = (order, nextStatus) => {
    if (nextStatus !== "DELIVERED") {
      updateMutation.mutate({ id: order.id, status: nextStatus });
      return;
    }
    const code = window.prompt("Ask the healthcare provider for their 4-digit delivery code:");
    if (!code) return; // cancelled — don't submit an empty/invalid attempt
    updateMutation.mutate({ id: order.id, status: nextStatus, deliveryCode: code.trim() });
  };

  const orders = data?.sub_orders || [];

  return (
    <div className="min-h-screen">
      <TopBar title="My Deliveries" />
      <div className="px-4 md:px-8 py-3">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
          </div>
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={refetch} />
        ) : orders.length === 0 ? (
          <EmptyState icon={Bike} title="No deliveries yet" description="Accept orders from your dashboard" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {orders.map((o) => {
                const s = getStatusDisplay(o.status);
                const nextStatus = NEXT_STATUS[o.status];
                const nextLabel = NEXT_LABEL[o.status];
                return (
                  <div key={o.id} className="p-4 bg-surface rounded-2xl border border-surface-border space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-ink font-semibold text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.color}`}>{s.label}</span>
                    </div>
                    {o.vendors && <p className="text-slate-muted text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> Pickup: {o.vendors.business_name} — {o.vendors.address}</p>}
                    {o.delivery_address && <p className="text-slate-muted text-xs flex items-center gap-1"><Home className="w-3 h-3" /> Deliver to: {o.delivery_address}</p>}
                    {o.delivery_description && (
                      <p className="text-ink text-xs bg-surface border border-surface-border rounded-lg px-3 py-2">
                        <MessageCircle className="w-3.5 h-3.5 inline mr-1" />"{o.delivery_description}"
                      </p>
                    )}
                    {o.delivery_voice_note_url && (
                      <div className="bg-surface border border-surface-border rounded-lg px-3 py-2">
                        <p className="text-slate-muted text-xs mb-1 flex items-center gap-1"><Mic className="w-3.5 h-3.5" /> Voice note from healthcare provider</p>
                        <audio controls src={o.delivery_voice_note_url} className="w-full h-8" />
                      </div>
                    )}
                    {o.orders?.users?.phone && (
                      <a href={`tel:${o.orders.users.phone}`} className="block text-teal text-xs underline">
                        <Phone className="w-4 h-4 inline mr-1.5" />Call Healthcare Provider
                      </a>
                    )}

                    {/* Directions — solves real-road-distance for the rider's actual trip */}
                    {o.status === "RIDER_ASSIGNED" && o.vendors?.location_lat && (
                      <a href={directionsUrl(o.vendors.location_lat, o.vendors.location_lng)} target="_blank" rel="noopener noreferrer"
                        className="block w-full text-center py-2 rounded-xl border border-teal/30 bg-teal/10 text-teal text-sm font-medium">
                        <Navigation className="w-4 h-4 inline mr-1.5" />Directions to Pharmacy
                      </a>
                    )}
                    {(o.status === "PICKED_UP" || o.status === "DELIVERING") && o.delivery_lat && (
                      <a href={directionsUrl(o.delivery_lat, o.delivery_lng)} target="_blank" rel="noopener noreferrer"
                        className="block w-full text-center py-2 rounded-xl border border-teal/30 bg-teal/10 text-teal text-sm font-medium">
                        <Navigation className="w-4 h-4 inline mr-1.5" />Directions to Healthcare Provider
                      </a>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-slate-muted text-xs">{formatDateTime(o.created_at)}</p>
                      <p className={`font-bold text-sm ${o.status === "DELIVERED" ? "text-teal" : "text-yellow-400"}`}>
                        {formatNaira(o.rider_payout)}
                      </p>
                    </div>
                    {nextStatus && (
                      <Button size="md" className="w-full"
                        onClick={() => handleAdvance(o, nextStatus)}
                        loading={updateMutation.isPending && updateMutation.variables?.id === o.id}>
                        {nextLabel}
                      </Button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
