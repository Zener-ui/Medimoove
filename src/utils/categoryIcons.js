import { Pill, Package, FlaskConical, Stethoscope, Syringe, ShieldCheck, Boxes } from "lucide-react";

const CATEGORY_ICONS = {
  "medicines-pharmacy": { icon: Pill, color: "text-blue-700", bg: "bg-blue-700/10" },
  "medical-supplies": { icon: Package, color: "text-orange-600", bg: "bg-orange-600/10" },
  "diagnostic-laboratory": { icon: FlaskConical, color: "text-indigo-700", bg: "bg-indigo-700/10" },
  "medical-equipment": { icon: Stethoscope, color: "text-teal-700", bg: "bg-teal-700/10" },
  "surgical-clinical": { icon: Syringe, color: "text-rose-600", bg: "bg-rose-600/10" },
  "ppe-infection-control": { icon: ShieldCheck, color: "text-sky-700", bg: "bg-sky-700/10" },
  "healthcare-consumables": { icon: Boxes, color: "text-violet-700", bg: "bg-violet-700/10" },
  "other-healthcare": { icon: Package, color: "text-slate-700", bg: "bg-slate-700/10" },
};

export const CATEGORY_LABELS = {
  "medicines-pharmacy": "Medicines & Pharmacy",
  "medical-supplies": "Medical Supplies",
  "diagnostic-laboratory": "Diagnostic & Laboratory",
  "medical-equipment": "Medical Equipment",
  "surgical-clinical": "Surgical & Clinical",
  "ppe-infection-control": "PPE & Infection Control",
  "healthcare-consumables": "Healthcare Consumables",
  "other-healthcare": "Other Healthcare Supplies",
};

export function getHealthcareCategoryName(category) {
  const value = category && typeof category === "object"
    ? (category.slug || category.name || category.category || "")
    : category;
  const key = String(value || "").toLowerCase().trim();
  return CATEGORY_LABELS[key] || (typeof value === "string" && value ? value : "Other Healthcare Supplies");
}

export function getCategoryIcon(category) {
  const key = String(category || "").toLowerCase().trim();
  return CATEGORY_ICONS[key] || CATEGORY_ICONS["other-healthcare"];
}
