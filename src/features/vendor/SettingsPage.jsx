import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Camera, Store } from "lucide-react";
import { getMyVendorProfile, updateVendorProfile } from "@/api/vendors";
import { getCategories } from "@/api/search";
import { uploadVendorLogo } from "@/api/uploads";
import { useAuthStore } from "@/store/authStore";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import GpsLocationCapture from "@/components/common/GpsLocationCapture";
import ChangePinSection from "@/components/common/ChangePinSection";
import { Skeleton } from "@/components/common/Loader";

export default function VendorSettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading } = useQuery({ queryKey: ["vendor-profile"], queryFn: getMyVendorProfile });
  const { data: categoryData } = useQuery({ queryKey: ["vendor-categories"], queryFn: getCategories, staleTime: Infinity });
  const [form, setForm] = useState(null);

  if (!isLoading && data?.vendor && !form) {
    const v = data.vendor;
    setForm({
      business_name: v.business_name, category: v.category, location: v.location,
      address: v.address, phone: v.phone, whatsapp: v.whatsapp || "", description: v.description || "",
      location_lat: v.location_lat, location_lng: v.location_lng,
      delivery_radius_km: v.delivery_radius_km ?? "",
    });
  }

  const mutation = useMutation({
    mutationFn: updateVendorProfile,
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries(["vendor-profile"]); },
    onError: (err) => toast.error(err.message),
  });

  const logoMutation = useMutation({
    mutationFn: uploadVendorLogo,
    onSuccess: () => { toast.success("Pharmacy photo updated"); qc.invalidateQueries(["vendor-profile"]); },
    onError: (err) => toast.error(err.message),
  });

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use a JPEG, PNG, or WebP image.");
      return;
    }
    logoMutation.mutate(file);
  };

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen">
      <TopBar title="Pharmacy Settings" />
      <div className="px-4 py-3 space-y-4">
        {!isLoading && data?.vendor && (
          <div className="flex flex-col items-center py-2">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-navy-mid border border-surface-border flex items-center justify-center overflow-hidden">
                {logoMutation.isPending ? (
                  <Skeleton className="w-full h-full" />
                ) : data.vendor.logo_url ? (
                  <img src={data.vendor.logo_url} alt="Pharmacy" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-10 h-10 text-slate-soft" strokeWidth={1.5} />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-teal flex items-center justify-center cursor-pointer shadow-lg">
                <Camera className="w-4 h-4 text-navy" strokeWidth={2} />
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoSelect} />
              </label>
            </div>
            <p className="text-slate-muted text-xs mt-2">Tap the camera to change your pharmacy photo</p>
          </div>
        )}

        {isLoading || !form ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-3">
            <Input label="Business Name" value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} />
            <div>
              <label htmlFor="settings-category" className="text-sm font-medium text-slate-soft mb-1.5 block">Category</label>
              <select
                id="settings-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
              >
                <option value="">Select a category</option>
                {categoryData?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <Input label="Location / Area" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
            <div>
              <GpsLocationCapture
                buttonLabel="Set Pharmacy Location"
                onChange={({ lat, lng, description }) => setForm((f) => ({ ...f, address: description || f.address, location_lat: lat, location_lng: lng }))}
              />
              {!form.location_lat && (
                <p className="text-xs text-yellow-400 mt-1">
                  Your pharmacy location isn't set yet — providers won't get accurate delivery pricing until you set it.
                </p>
              )}
            </div>
            <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <Input label="WhatsApp" type="tel" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
            <div>
              <label htmlFor="settings-radius" className="text-sm font-medium text-slate-soft mb-1.5 block">Delivery Radius (km)</label>
              <input
                id="settings-radius"
                type="number"
                min="1"
                step="1"
                placeholder="Platform default (30km)"
                value={form.delivery_radius_km}
                onChange={(e) => setForm((f) => ({ ...f, delivery_radius_km: e.target.value }))}
                className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
              />
              <p className="text-xs text-slate-muted mt-1">
                Leave blank to use the platform default. You can set a smaller radius if you can't cover the full distance — you can't set it larger than the platform allows.
              </p>
            </div>
            <div>
              <label htmlFor="settings-description" className="text-sm font-medium text-slate-soft mb-1.5 block">Pharmacy Description</label>
              <textarea
                id="settings-description"
                rows={3}
                placeholder="Tell healthcare providers about your pharmacy — shown on your pharmacy profile."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-surface rounded-xl border border-surface-border text-ink py-3 px-4 text-sm outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 resize-none"
              />
            </div>
            <Button type="submit" size="xl" loading={mutation.isPending}>Save Changes</Button>
          </form>
        )}

        <ChangePinSection />

        <Link to="/terms" className="block text-center text-slate-muted text-sm hover:text-teal py-2">
          Terms &amp; Conditions
        </Link>

        <Button variant="danger" size="lg" className="w-full mt-2" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
}
