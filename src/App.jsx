import { BrowserRouter, useLocation } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import queryClient from "./queryClient";
import AppRoutes from "./routes";
import ErrorBoundary from "./components/common/ErrorBoundary";
import IdleLogoutWatcher from "./components/common/IdleLogoutWatcher";

// Remounts the boundary on every navigation, so a crash on one page
// doesn't leave every subsequent page stuck on the fallback screen.
function RouteErrorBoundary() {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <IdleLogoutWatcher />
        <RouteErrorBoundary />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#FFFFFF",
              color: "#10143f",
              border: "1px solid #E2DED5",
              borderRadius: "14px",
              fontSize: "13px",
              fontFamily: "Geist, sans-serif",
              maxWidth: "340px",
            },
            success: { iconTheme: { primary: "#1F744F", secondary: "#FFFFFF" } },
            error:   { iconTheme: { primary: "#DC4A4A", secondary: "#FFFFFF" } },
          }}
        />
      </BrowserRouter>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
