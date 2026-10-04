import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { roleHomePath } from "@/utils";

export default function RoleRoute({ role, children }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== role) {
    return <Navigate to={roleHomePath(user?.role)} replace />;
  }
  return children;
}
