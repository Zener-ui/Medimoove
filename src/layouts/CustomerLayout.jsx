import AppShell from "@/components/layout/AppShell";
import { Home, Search, ShoppingCart, Package, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export default function CustomerLayout() {
  const totalItems = useCartStore((s) => s.totalItems());

  const NAV = [
    { to: "/customer/home", icon: Home, label: "Home" },
    { to: "/customer/search", icon: Search, label: "Search" },
    { to: "/customer/cart", icon: ShoppingCart, label: "Cart", badge: totalItems },
    { to: "/customer/orders", icon: Package, label: "Orders" },
    { to: "/customer/profile", icon: User, label: "Profile" },
  ];

  return <AppShell navItems={NAV} subtitle="Healthcare Provider" contentMaxWidth="max-w-6xl" />;
}
