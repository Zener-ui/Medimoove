import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { roleHomePath } from "@/utils";

export default function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) return <Navigate to={roleHomePath(user?.role)} replace />;
  return children;
}
