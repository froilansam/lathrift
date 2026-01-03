"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { CheckCircle, ExternalLink, Package } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") as Id<"orders"> | null;
  const isTikTok = searchParams.get("tiktok") === "true";

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const order = useQuery(api.orders.getById, orderId ? { id: orderId } : "skip");
  const verifyPayment = useAction(api.paymongo.verifyPayment);
  const markAsPaid = useMutation(api.orders.markAsPaid);

  useEffect(() => {
    const verify = async () => {
      if (!order?.paymentId) {
        setVerifying(false);
        return;
      }

      try {
        const result = await verifyPayment({ checkoutId: order.paymentId });

        if (result.status === "paid" && order.status === "pending") {
          await markAsPaid({ id: orderId! });
        }

        setVerified(result.status === "paid");
      } catch (error) {
        console.error("Verification error:", error);
      } finally {
        setVerifying(false);
      }
    };

    if (order) {
      verify();
    }
  }, [order, orderId, verifyPayment, markAsPaid]);

  if (verifying) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <h1 className="text-xl font-bold">Verifying payment...</h1>
        <p className="text-muted mt-2">Please wait while we confirm your payment</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-success" />
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {verified ? "Payment Successful!" : "Order Placed!"}
      </h1>

      <p className="text-muted mb-6">
        {verified
          ? "Thank you for your purchase. Your order is being processed."
          : "We're confirming your payment. You'll receive an update soon."}
      </p>

      {orderId && (
        <p className="text-sm text-muted mb-6">
          Order ID: <span className="font-mono font-bold">{orderId.slice(-8).toUpperCase()}</span>
        </p>
      )}

      {/* TikTok Shipping Instructions */}
      {isTikTok && (
        <div className="rounded-lg border border-border p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-accent" />
            <h3 className="font-medium">Complete Your Shipping</h3>
          </div>
          <p className="text-sm text-muted mb-4">
            To get the cheapest shipping rate, please order our shipping placeholder
            item on TikTok. You&apos;ll only pay for the delivery fee there.
          </p>
          <ol className="text-sm text-muted space-y-2 list-decimal list-inside mb-4">
            <li>Click the button below to go to our TikTok</li>
            <li>Add the &quot;Shipping Placeholder&quot; item to cart</li>
            <li>Use your order ID as reference: <span className="font-mono font-bold">{orderId?.slice(-8).toUpperCase()}</span></li>
            <li>Complete checkout on TikTok</li>
          </ol>
          <Button className="w-full" asChild>
            <a
              href="https://tiktok.com/@l.athrift"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to TikTok
            </a>
          </Button>
        </div>
      )}

      {/* What's Next */}
      {!isTikTok && (
        <div className="rounded-lg border border-border p-6 mb-6 text-left">
          <h3 className="font-medium mb-3">What&apos;s Next?</h3>
          <ul className="text-sm text-muted space-y-2">
            <li>• We&apos;ll prepare your order for shipping</li>
            <li>• You&apos;ll receive tracking info via email/SMS</li>
            <li>• Estimated delivery: 3-7 business days</li>
          </ul>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="outline" asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <h1 className="text-xl font-bold">Loading...</h1>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
