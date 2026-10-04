import { useState } from "react";
import { Store, Search, ShoppingBag, Star, Package, Wallet, Bike, MapPin, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const ONBOARDING_VERSION = "v1";

const SLIDES_BY_ROLE = {
  customer: [
    { icon: Store, title: "Shop by store", body: "Pick a category, browse real local stores, then see what they sell — not a mixed pile of random products." },
    { icon: Search, title: "Or search directly", body: "Know what you want? Search finds it across every store on Medimoove." },
    { icon: ShoppingBag, title: "One store per order", body: "Each cart holds items from one store at a time, so your rider makes one clean pickup, not a scavenger hunt." },
    { icon: Star, title: "Rate what you get", body: "After delivery, leave a rating and review — it's what helps other customers pick a good store." },
  ],
  vendor: [
    { icon: Package, title: "List your products", body: "Add products with photos and prices — customers find you through your store category." },
    { icon: ShoppingBag, title: "Manage incoming orders", body: "New orders show up in Orders — accept, prepare, and hand off to your rider from there." },
    { icon: Wallet, title: "Track your earnings", body: "Every completed order adds to your balance. Withdraw anytime with your withdrawal PIN." },
    { icon: Star, title: "Build your reputation", body: "Customer reviews show on your store page — reply to them from your Reviews tab." },
  ],
  rider: [
    { icon: Bike, title: "Go available when ready", body: "Toggle your availability on to start seeing delivery requests near you." },
    { icon: MapPin, title: "Accept and deliver", body: "Accept a delivery, pick up from the store, and update status as you go." },
    { icon: Wallet, title: "Track your earnings", body: "Every delivery adds to your balance. Withdraw anytime with your withdrawal PIN." },
  ],
  admin: [
    { icon: Store, title: "Review applications", body: "New vendors and riders start pending — approve or reject them from Vendors and Riders." },
    { icon: ShoppingBag, title: "Watch the platform", body: "Orders, disputes, and alerts all live in their own tabs — Monitoring flags anything stuck." },
  ],
};

const flagKey = (userId) => `medimoove_onboarding_${ONBOARDING_VERSION}_${userId}`;

export const hasSeenOnboarding = (userId) => {
  if (!userId) return true;
  return localStorage.getItem(flagKey(userId)) === "seen";
};

/**
 * First-run walkthrough, shown once per account (tracked in
 * localStorage, versioned so a future redesign can be re-shown by
 * bumping ONBOARDING_VERSION). Content is role-aware since a
 * customer, vendor, rider, and admin land on completely different
 * home screens.
 */
export default function OnboardingTour({ onDone }) {
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const slides = SLIDES_BY_ROLE[user?.role] || SLIDES_BY_ROLE.customer;
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  const finish = () => {
    if (user?.id) localStorage.setItem(flagKey(user.id), "seen");
    onDone();
  };

  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[200] bg-navy flex flex-col">
      <div className="flex justify-end p-4">
        <button onClick={finish} className="text-slate-muted text-sm font-medium px-3 py-1.5">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-6">
          <Icon className="w-9 h-9 text-teal" strokeWidth={1.5} />
        </div>
        <h2 className="text-ink text-xl font-display font-semibold mb-2">{slide.title}</h2>
        <p className="text-slate-muted text-sm leading-relaxed max-w-xs">{slide.body}</p>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-teal" : "w-1.5 bg-surface-raised"}`} />
          ))}
        </div>
        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className="w-full flex items-center justify-center gap-1.5 bg-teal text-navy font-semibold py-3.5 rounded-2xl active:scale-95 transition-all"
        >
          {isLast ? "Get Started" : "Next"}
          {!isLast && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
