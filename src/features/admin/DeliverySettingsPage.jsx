import { CloudRain, MapPin } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { clsx } from "clsx";
import { getAdminDeliverySettings, toggleRainSurcharge, setDeliveryOverride } from "@/api/delivery";
import { formatNaira } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/common/Card";

export default function DeliverySettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-delivery-settings"], queryFn: getAdminDeliverySettings });
  const regions = data?.regions || [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-delivery-settings"] });

  const toggleRain = useMutation({
    mutationFn: toggleRainSurcharge,
    onSuccess: (res) => { toast.success(res.message); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const setOverride = useMutation({
    mutationFn: setDeliveryOverride,
    onSuccess: (res) => { toast.success(res.message); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Prompt-based for the override amount — this is a rarely-touched,
  // emergency-style control (e.g. a fuel price spike, a flooded route
  // making every delivery cost more) rather than something an admin
  // tweaks routinely, so a lightweight prompt is a reasonable trade
  // against building a full modal + form for one number.
  const handleSetOverride = (region) => {
    const current = region.settings.manual_override_fee;
    const input = window.prompt(
      `Manual override delivery fee for ${region.name} (₦). This replaces the calculated fee entirely for every order in this region. Leave blank to clear the override.`,
      current ?? ""
    );
    if (input === null) return; // cancelled
    const value = input.trim() === "" ? null : Number(input);
    if (value !== null && (isNaN(value) || value < 0)) {
      toast.error("Enter a valid amount, or leave it blank to clear the override.");
      return;
    }
    setOverride.mutate({ region_id: region.id, override_fee: value });
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Delivery & Weather Settings" />
      <div className="px-4 py-3 space-y-4">
        <Card className="p-4">
          <p className="text-slate-muted text-xs">
            Rain surcharge adds a flat top-up to every delivery fee in a region while it's on — flip it on ahead of a storm, off once conditions clear. A manual override replaces the calculated fee entirely, for situations the normal formula doesn't cover well.
          </p>
        </Card>

        {isLoading ? (
          <p className="text-slate-muted text-sm">Loading…</p>
        ) : regions.length === 0 ? (
          <Card className="p-6 text-center">
            <MapPin className="w-8 h-8 text-slate-muted mx-auto mb-2" />
            <p className="text-slate-muted text-sm">No regions set up yet.</p>
          </Card>
        ) : (
          regions.map((region) => (
            <Card key={region.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-ink font-bold text-sm">{region.name}</p>
                  <p className="text-slate-muted text-xs">{region.state}{!region.is_active && " · inactive"}</p>
                </div>
                <p className="text-slate-muted text-xs text-right">
                  Base {formatNaira(region.settings.base_fee)}<br />+{formatNaira(region.settings.rate_per_km)}/km
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-surface-border">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-slate-muted" strokeWidth={2} />
                  <div>
                    <p className="text-ink text-xs font-medium">Rain surcharge</p>
                    <p className="text-slate-muted text-[11px]">Adds {formatNaira(region.settings.rain_surcharge)} while active</p>
                  </div>
                </div>
                <button
                  disabled={toggleRain.isPending}
                  onClick={() => toggleRain.mutate({ region_id: region.id, enabled: !region.settings.rain_surcharge_enabled })}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-xs font-semibold border flex-shrink-0",
                    region.settings.rain_surcharge_enabled ? "border-teal bg-teal/10 text-teal" : "border-surface-border text-slate-muted"
                  )}
                >
                  {region.settings.rain_surcharge_enabled ? "On" : "Off"}
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-surface-border">
                <div>
                  <p className="text-ink text-xs font-medium">Manual fee override</p>
                  <p className="text-slate-muted text-[11px]">
                    {region.settings.manual_override_fee
                      ? `Active — every order charged ${formatNaira(region.settings.manual_override_fee)} flat`
                      : "Not set — fee calculated normally"}
                  </p>
                </div>
                <button
                  disabled={setOverride.isPending}
                  onClick={() => handleSetOverride(region)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-surface-border text-slate-muted flex-shrink-0"
                >
                  {region.settings.manual_override_fee ? "Edit" : "Set"}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
