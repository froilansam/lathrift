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

    // Handle checkout.session.payment.paid event
    if (eventType === "checkout_session.payment.paid") {
      const checkoutSession = event.attributes.data;
      const referenceNumber = checkoutSession?.attributes?.reference_number;
      const paymentId = checkoutSession?.attributes?.payments?.[0]?.id || checkoutSession.id;

      console.log("Payment successful for order:", referenceNumber);

      if (referenceNumber) {
        try {
          await convex.mutation(api.orders.updatePayment, {
            id: referenceNumber as Id<"orders">,
            paymentId: paymentId,
            status: "paid",
          });
          console.log(`Order ${referenceNumber} marked as paid`);
        } catch (error) {
          console.error("Failed to update order:", error);
        }
      }
    }

    // Handle payment.paid event (direct payments)
    if (eventType === "payment.paid") {
      const payment = event.attributes.data;
      const metadata = payment?.attributes?.metadata;
      const orderId = metadata?.order_id;

      if (orderId) {
        try {
          await convex.mutation(api.orders.updatePayment, {
            id: orderId as Id<"orders">,
            paymentId: payment.id,
            status: "paid",
          });
          console.log(`Order ${orderId} marked as paid via payment.paid`);
        } catch (error) {
          console.error("Failed to update order:", error);
        }
      }
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
