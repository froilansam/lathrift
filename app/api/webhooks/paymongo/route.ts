import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import crypto from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Verify PayMongo webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const [timestamp, testSig, liveSig] = signature.split(",").map((s) => s.split("=")[1]);
  const sig = testSig || liveSig;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return sig === expectedSig;
}

// Extract order ID from various event structures
function extractOrderId(event: any): string | null {
  const data = event?.attributes?.data;

  // From checkout session
  if (data?.attributes?.reference_number) {
    return data.attributes.reference_number;
  }

  // From payment metadata
  if (data?.attributes?.metadata?.order_id) {
    return data.attributes.metadata.order_id;
  }

  // From direct attributes
  if (event?.attributes?.reference_number) {
    return event.attributes.reference_number;
  }

  return null;
}

// Extract payment ID
function extractPaymentId(event: any): string | null {
  const data = event?.attributes?.data;

  // From checkout session payments array
  if (data?.attributes?.payments?.[0]?.id) {
    return data.attributes.payments[0].id;
  }

  // From direct data id
  if (data?.id) {
    return data.id;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    // Verify signature if webhook secret is set
    if (webhookSecret && signature) {
      const isValid = verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const event = body.data;
    const eventType = event?.attributes?.type;

    console.log("PayMongo webhook received:", eventType);

    const orderId = extractOrderId(event);
    const paymentId = extractPaymentId(event);

    switch (eventType) {
      // ==========================================
      // CHECKOUT SESSION EVENTS
      // ==========================================
      case "checkout_session.payment.paid": {
        console.log("Checkout payment successful for order:", orderId);

        if (orderId) {
          try {
            await convex.mutation(api.orders.updatePayment, {
              id: orderId as Id<"orders">,
              paymentId: paymentId || undefined,
              status: "paid",
            });
            console.log(`Order ${orderId} marked as paid`);
          } catch (error) {
            console.error("Failed to update order:", error);
          }
        }
        break;
      }

      // ==========================================
      // QRPH EVENTS
      // ==========================================
      case "qrph.expired": {
        console.log("QR payment expired for order:", orderId);

        if (orderId) {
          try {
            // Cancel the order since QR payment expired
            await convex.mutation(api.orders.cancel, {
              id: orderId as Id<"orders">,
            });
            console.log(`Order ${orderId} cancelled due to QR expiry`);
          } catch (error) {
            console.error("Failed to cancel order:", error);
          }
        }
        break;
      }

      // ==========================================
      // PAYMENT EVENTS
      // ==========================================
      case "payment.paid": {
        console.log("Payment successful for order:", orderId);

        if (orderId) {
          try {
            await convex.mutation(api.orders.updatePayment, {
              id: orderId as Id<"orders">,
              paymentId: paymentId || undefined,
              status: "paid",
            });
            console.log(`Order ${orderId} marked as paid via payment.paid`);
          } catch (error) {
            console.error("Failed to update order:", error);
          }
        }
        break;
      }

      case "payment.failed": {
        console.log("Payment failed for order:", orderId);

        if (orderId) {
          try {
            // Update order status to reflect failed payment
            await convex.mutation(api.orders.updateStatus, {
              id: orderId as Id<"orders">,
              status: "cancelled",
            });
            console.log(`Order ${orderId} cancelled due to payment failure`);
          } catch (error) {
            console.error("Failed to update order:", error);
          }
        }
        break;
      }

      case "payment.refunded": {
        console.log("Payment refunded for order:", orderId);

        if (orderId) {
          try {
            await convex.mutation(api.orders.updateStatus, {
              id: orderId as Id<"orders">,
              status: "refunded",
            });
            console.log(`Order ${orderId} marked as refunded`);
          } catch (error) {
            console.error("Failed to update order:", error);
          }
        }
        break;
      }

      case "payment.refund.updated": {
        const refundStatus = event?.attributes?.data?.attributes?.status;
        console.log("Refund updated for order:", orderId, "Status:", refundStatus);

        if (orderId && refundStatus === "succeeded") {
          try {
            await convex.mutation(api.orders.updateStatus, {
              id: orderId as Id<"orders">,
              status: "refunded",
            });
            console.log(`Order ${orderId} refund completed`);
          } catch (error) {
            console.error("Failed to update order:", error);
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// PayMongo sends GET request to verify webhook endpoint
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
