"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "convex/react";
import { XCircle } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order") as Id<"orders"> | null;

  const cancelOrder = useMutation(api.orders.cancel);

  useEffect(() => {
    // Cancel the order if payment was cancelled
    const cancel = async () => {
      if (orderId) {
        try {
          await cancelOrder({ id: orderId });
        } catch (error) {
          console.error("Failed to cancel order:", error);
        }
      }
    };

    cancel();
  }, [orderId, cancelOrder]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
        <XCircle className="w-8 h-8 text-destructive" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Payment Cancelled</h1>

      <p className="text-muted mb-6">
        Your payment was cancelled. No charges have been made to your account.
      </p>

      <p className="text-sm text-muted mb-8">
        If you experienced any issues, please try again or contact us for help.
      </p>

      <div className="flex gap-3 justify-center">
        <Button asChild>
          <Link href="/checkout">Try Again</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </div>
    </div>
  );
}
