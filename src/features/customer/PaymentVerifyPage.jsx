import { useEffect } from "react";
import { XCircle, CheckCircle2 } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { verifyPayment } from "@/api/payments";
import Loader from "@/components/common/Loader";
import Button from "@/components/common/Button";

export default function PaymentVerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reference = params.get("reference");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verify-payment", reference],
    queryFn: () => verifyPayment(reference),
    enabled: !!reference,
    retry: 2,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data?.success) {
      const timer = setTimeout(() => {
        navigate(`/customer/orders/${data.order_id}`, { replace: true });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!reference) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="text-center">
          <XCircle className="w-14 h-14 text-red-500" strokeWidth={1.5} />
          <h2 className="text-ink font-bold text-xl mt-4">Invalid Payment Link</h2>
          <p className="text-slate-muted text-sm mt-2">No payment reference found.</p>
          <Button className="mt-6" onClick={() => navigate("/customer/home")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loader fullscreen text="Verifying your payment..." />;
  }

  if (isError || !data?.success) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <XCircle className="w-14 h-14 text-red-500" strokeWidth={1.5} />
          <h2 className="text-ink font-bold text-xl mt-4">Payment Failed</h2>
          <p className="text-slate-muted text-sm mt-2">{error?.message || "Payment was not completed. No money was charged."}</p>
          <Button className="mt-6" onClick={() => navigate("/customer/cart")}>Back to Cart</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6">
      <div className="text-center max-w-sm animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-teal/10 border-2 border-teal flex items-center justify-center text-4xl mx-auto">
              <CheckCircle2 className="w-14 h-14 text-teal" strokeWidth={1.5} />
        </div>
        <h2 className="text-ink font-black text-2xl mt-5">Payment Successful!</h2>
        <p className="text-slate-muted text-sm mt-2">Your order has been confirmed. Redirecting to order details...</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-teal text-sm">
          <span className="w-4 h-4 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <span>Redirecting...</span>
        </div>
        <Button className="mt-4" variant="ghost" size="sm" onClick={() => navigate(`/customer/orders/${data.order_id}`)}>
          View Order Now
        </Button>
      </div>
    </div>
  );
}
