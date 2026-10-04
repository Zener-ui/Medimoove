import { useEffect, useState } from "react";
import { Package, ImagePlus, X, Copy } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getMyProducts, createProduct, updateProduct, deleteProduct } from "@/api/products";
import { getMyVendorProfile } from "@/api/vendors";
import { getCategories } from "@/api/search";
import { uploadProductImages } from "@/api/uploads";
import { formatNaira } from "@/utils";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Loader";

const BLANK = { name: "", description: "", price: "", category_id: "", stock_quantity: "", images: [] };

export default function VendorProductsPage() {
  const qc = useQueryClient();
  const { data: categoryData } = useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: Infinity });
  const categories = categoryData?.categories || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => () => {
    imageFiles.forEach((file) => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
  }, [imageFiles]);

  const { data: profileData } = useQuery({ queryKey: ["vendor-profile"], queryFn: getMyVendorProfile });
  const vendorId = profileData?.vendor?.id;

  // Full catalog — including out-of-stock/paused items, which the
  // public search endpoint used here previously would silently hide
  // from the vendor managing their own products.
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["vendor-products", vendorId],
    queryFn: () => getMyProducts(),
    enabled: !!vendorId,
  });

  const products = data?.products || [];

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = "Enter a valid price";
    if (!form.category_id) e.category_id = "Required";
    if (!form.stock_quantity || isNaN(form.stock_quantity)) e.stock_quantity = "Required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const copyProductLink = async (productId) => {
    const link = `${window.location.origin}/p/${productId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Supply link copied!");
    } catch {
      toast.error("Couldn't copy supply link.");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => { toast.success("Medical supply removed"); qc.invalidateQueries(["vendor-products"]); },
    onError: (err) => toast.error(err.message),
  });

  const clearSelectedImages = () => {
    imageFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setImageFiles([]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK);
    clearSelectedImages();
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: String(p.price), category_id: p.category_id || "", stock_quantity: String(p.stock_quantity), images: p.images || [] });
    clearSelectedImages();
    setErrors({});
    setModalOpen(true);
  };

  const handleImageSelection = (e) => {
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

    const remaining = 6 - form.images.length - imageFiles.length;
    if (valid.length > remaining) {
      toast.error(`You can have a maximum of 6 supply images.`);
    }

    const files = valid.slice(0, Math.max(0, remaining)).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageFiles((current) => [...current, ...files]);
    e.target.value = "";
  };

  const removeSelectedImage = (index) => {
    const item = imageFiles[index];
    if (item?.preview) URL.revokeObjectURL(item.preview);
    setImageFiles((current) => current.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!validate()) return;
    setImageUploading(true);
    try {
      const saved = await (editing
        ? updateProduct(editing.id, { ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) })
        : createProduct({ ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) }));

      const product = saved?.product;
      if (!product?.id) throw new Error("Product was saved but no product ID was returned.");

      if (imageFiles.length) {
        const uploaded = await uploadProductImages(imageFiles.map((item) => item.file));
        const newUrls = uploaded?.urls || [];
        if (!newUrls.length) throw new Error("Images could not be uploaded.");
        await updateProduct(product.id, { ...form, images: [...(form.images || []), ...newUrls], price: Number(form.price), stock_quantity: Number(form.stock_quantity) });
      }

      toast.success(editing ? "Medical supply updated" : "Medical supply created");
      qc.invalidateQueries(["vendor-products"]);
      setModalOpen(false);
      setEditing(null);
      setForm(BLANK);
      clearSelectedImages();
    } catch (err) {
      toast.error(err.message || "Couldn't save product.");
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar title="Medical Supplies" right={
        <Button size="sm" onClick={openCreate}>+ Add</Button>
      } />

      <div className="px-4 md:px-8 py-3">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={refetch} />
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="No medical supplies yet" description="Add your first medical supply to start receiving provider orders" action={openCreate} actionLabel="Add Medical Supply" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-surface rounded-2xl border border-surface-border overflow-hidden flex flex-col">
                <div className="aspect-video bg-navy-mid flex items-center justify-center">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-slate-soft" strokeWidth={1.5} />}
                </div>
                <div className="p-3.5 flex-1 flex flex-col">
                  <p className="text-ink text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-teal font-bold text-sm mt-0.5">{formatNaira(p.price)}</p>
                  <span className={`text-[11px] font-medium mt-1 ${p.stock_quantity > 0 ? "text-green-500" : "text-red-400"}`}>
                    {p.stock_quantity > 0 ? `${p.stock_quantity} in stock` : "Out of stock"}
                  </span>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-surface-border">
                    <button onClick={() => openEdit(p)} className="flex-1 text-teal text-xs font-medium py-1.5 rounded-lg border border-teal/30 hover:bg-teal/10">Edit</button>
                    <button
                      onClick={() => copyProductLink(p.id)}
                      className="flex-1 text-slate-soft text-xs font-medium py-1.5 rounded-lg border border-surface-border hover:bg-surface-border/40 flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </button>
                    <button
                      onClick={() => { if (window.confirm("Remove this medical supply?")) deleteMutation.mutate(p.id); }}
                      className="flex-1 text-red-400 text-xs font-medium py-1.5 rounded-lg border border-red-400/20 hover:bg-red-400/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Medical Supply" : "New Medical Supply"}>
        <div className="space-y-3">
          <Input label="Supply Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
          <div>
            <label className="text-sm font-medium text-slate-soft block mb-1.5">Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
              className="w-full bg-surface border border-surface-border rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-teal"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ""}{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-400 mt-1">{errors.category_id}</p>}
          </div>
          <Input label="Price (₦)" type="number" min="1" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} error={errors.price} />
          <Input label="Stock Quantity" type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} error={errors.stock_quantity} />
          <div>
            <label className="text-sm font-medium text-slate-soft block mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe the medical supply..."
              className="w-full bg-surface rounded-xl border border-surface-border text-ink placeholder:text-slate-muted px-4 py-3 text-sm outline-none focus:border-teal resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-soft block mb-1.5">Supply Photos</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(form.images || []).map((url, i) => (
                <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-navy-mid border border-surface-border">
                  <img src={url} alt={`Supply ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeExistingImage(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1" aria-label="Remove image">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {imageFiles.map((item, i) => (
                <div key={item.preview} className="relative aspect-square rounded-xl overflow-hidden bg-navy-mid border border-teal/40">
                  <img src={item.preview} alt={`New supply ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeSelectedImage(i)}
                    className="absolute top-1 right-1 rounded-full bg-black/70 text-white p-1" aria-label="Remove selected image">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {(form.images?.length || 0) + imageFiles.length < 6 && (
              <label className="flex items-center justify-center gap-2 h-20 rounded-xl border border-dashed border-surface-border text-slate-muted hover:text-teal hover:border-teal/50 cursor-pointer text-sm">
                <ImagePlus className="w-5 h-5" />
                Add supply photos
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageSelection} />
              </label>
            )}
            <p className="text-slate-muted text-xs mt-1.5">Up to 6 photos. JPG, PNG or WebP, max 8 MB each. Images must be at least 500×500px.</p>
          </div>

          <Button size="xl" onClick={handleSave} loading={imageUploading}>
            {editing ? "Save Supply Changes" : "Create Supply"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
