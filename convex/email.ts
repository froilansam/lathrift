import { v } from "convex/values";
import { internalAction } from "./_generated/server";

// Send order status email via Next.js API route (uses Gmail SMTP)
export const sendOrderStatusEmail = internalAction({
  args: {
    to: v.string(),
    status: v.string(),
    orderId: v.string(),
    customerName: v.string(),
    items: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    total: v.number(),
    trackingNumber: v.optional(v.string()),
    courier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.to) {
      console.log("No email address provided, skipping email");
      return { success: false, error: "No email address" };
    }

    // Get the site URL from Convex dashboard environment
    const siteUrl = process.env.SITE_URL;

    if (!siteUrl) {
      console.log("SITE_URL not configured in Convex dashboard, skipping email");
      return { success: false, error: "Site URL not configured" };
    }

    try {
      const response = await fetch(`${siteUrl}/api/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: args.to,
          status: args.status,
          orderId: args.orderId,
          customerName: args.customerName,
          items: args.items,
          total: args.total,
          trackingNumber: args.trackingNumber,
          courier: args.courier,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Email API error:", error);
        return { success: false, error: "Failed to send email" };
      }

      const data = await response.json();
      console.log("Email sent successfully:", data.messageId);
      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error("Email sending error:", error);
      return { success: false, error: "Email service error" };
    }
  },
});
