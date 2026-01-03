import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

// Base64 encode for Convex (no Buffer available)
function base64Encode(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const bytes = new TextEncoder().encode(str);
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? chars[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < len ? chars[b3 & 63] : "=";
  }

  return result;
}

// Create PayMongo checkout session
export const createCheckoutSession = action({
  args: {
    orderId: v.id("orders"),
    lineItems: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        amount: v.number(), // in centavos
      })
    ),
    customerEmail: v.optional(v.string()),
    customerName: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

    if (!PAYMONGO_SECRET_KEY) {
      throw new Error("PAYMONGO_SECRET_KEY is not configured");
    }

    // Build line items for PayMongo (amount in centavos)
    const lineItems = args.lineItems.map((item) => ({
      currency: "PHP",
      amount: item.amount, // already in centavos
      name: item.name,
      quantity: item.quantity,
    }));

    const payload = {
      data: {
        attributes: {
          billing: {
            name: args.customerName,
            email: args.customerEmail || undefined,
          },
          send_email_receipt: !!args.customerEmail,
          show_description: true,
          show_line_items: true,
          line_items: lineItems,
          payment_method_types: [
            "gcash",
            "grab_pay",
            "paymaya",
            "qrph",
            "card",
          ],
          success_url: args.successUrl,
          cancel_url: args.cancelUrl,
          reference_number: args.orderId,
          description: `LA Thrift Order #${args.orderId.slice(-8).toUpperCase()}`,
        },
      },
    };

    try {
      const authString = base64Encode(PAYMONGO_SECRET_KEY + ":");

      const response = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("PayMongo error:", error);
        throw new Error("Failed to create checkout session");
      }

      const data = await response.json();
      const checkoutUrl = data.data.attributes.checkout_url;
      const checkoutId = data.data.id;

      // Update order with PayMongo checkout ID
      await ctx.runMutation(api.orders.updatePaymentId, {
        id: args.orderId,
        paymentId: checkoutId,
      });

      return { checkoutUrl, checkoutId };
    } catch (error) {
      console.error("PayMongo checkout error:", error);
      throw new Error("Failed to create payment session");
    }
  },
});

// Verify payment status
export const verifyPayment = action({
  args: {
    checkoutId: v.string(),
  },
  handler: async (ctx, args) => {
    const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

    if (!PAYMONGO_SECRET_KEY) {
      throw new Error("PAYMONGO_SECRET_KEY is not configured");
    }

    try {
      const authString = base64Encode(PAYMONGO_SECRET_KEY + ":");

      const response = await fetch(
        `${PAYMONGO_API_URL}/checkout_sessions/${args.checkoutId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${authString}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify payment");
      }

      const data = await response.json();
      const status = data.data.attributes.payment_intent?.attributes?.status;
      const referenceNumber = data.data.attributes.reference_number;

      return {
        status: status === "succeeded" ? "paid" : "pending",
        referenceNumber,
        paymentIntentId: data.data.attributes.payment_intent?.id,
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      throw new Error("Failed to verify payment");
    }
  },
});
