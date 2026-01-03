import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Courier tracking URLs
const COURIER_TRACKING_URLS: Record<string, string | null> = {
  jnt: "https://www.jtexpress.ph/track?billcode=",
  lbc: "https://www.lbcexpress.com/track/?tracking_no=",
  flash: "https://flashexpress.ph/tracking?tracking_number=",
  ninja: "https://www.ninjavan.co/en-ph/tracking?id=",
  gogoxpress: "https://www.gogoxpress.com/track/",
  lalamove: null,
  grab: null,
  other: null,
};

const COURIER_LABELS: Record<string, string> = {
  jnt: "J&T Express",
  lbc: "LBC Express",
  flash: "Flash Express",
  ninja: "Ninja Van",
  gogoxpress: "GoGo Xpress",
  lalamove: "Lalamove",
  grab: "Grab Express",
  other: "Other Courier",
};

function getTrackingUrl(courier: string, trackingNumber: string): string | null {
  const baseUrl = COURIER_TRACKING_URLS[courier];
  if (!baseUrl) return null;
  return `${baseUrl}${trackingNumber}`;
}

function formatPrice(price: number): string {
  return `₱${price.toLocaleString()}`;
}

// LA Thrift Logo URL
const LOGO_URL = "https://i.ibb.co/GQHyq1tJ/logo.png";

// LA Thrift Brand Colors
const COLORS = {
  maroon: "#A94442",
  maroonLight: "#C4706E",
  background: "#fafafa",
  foreground: "#0a0a0a",
  muted: "#737373",
  border: "#e5e5e5",
  success: "#16a34a",
  warning: "#f59e0b",
};

// Minimalist email templates
function getEmailContent(
  status: string,
  orderDetails: {
    orderId: string;
    customerName: string;
    items: { name: string; quantity: number; price: number }[];
    total: number;
    trackingNumber?: string;
    courier?: string;
  }
): { subject: string; html: string } {
  const orderIdShort = orderDetails.orderId.slice(-8).toUpperCase();

  const itemsHtml = orderDetails.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid ${COLORS.border};">
          <p style="margin: 0; color: ${COLORS.foreground}; font-size: 15px;">${item.name}</p>
          <p style="margin: 4px 0 0 0; color: ${COLORS.muted}; font-size: 13px;">Qty: ${item.quantity}</p>
        </td>
        <td style="padding: 16px 0; border-bottom: 1px solid ${COLORS.border}; text-align: right; vertical-align: top;">
          <p style="margin: 0; color: ${COLORS.foreground}; font-size: 15px; font-weight: 600;">${formatPrice(item.price * item.quantity)}</p>
        </td>
      </tr>
    `
    )
    .join("");

  // Minimalist wrapper
  const emailWrapper = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f0f0; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${COLORS.background};">

              <!-- Logo Header -->
              <tr>
                <td style="padding: 40px 40px 30px 40px; text-align: center;">
                  <img src="${LOGO_URL}" alt="LA Thrift" width="120" style="max-width: 120px; height: auto;" />
                </td>
              </tr>
  `;

  const emailFooter = `
              <!-- Footer -->
              <tr>
                <td style="padding: 40px; border-top: 1px solid ${COLORS.border};">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0 0 20px 0; color: ${COLORS.muted}; font-size: 14px;">Follow us for new drops</p>
                        <a href="https://tiktok.com/@lathrift" style="color: ${COLORS.maroon}; text-decoration: none; font-size: 13px; margin: 0 12px;">TikTok</a>
                        <a href="https://instagram.com/lathrift" style="color: ${COLORS.maroon}; text-decoration: none; font-size: 13px; margin: 0 12px;">Instagram</a>
                        <a href="https://facebook.com/lathrift" style="color: ${COLORS.maroon}; text-decoration: none; font-size: 13px; margin: 0 12px;">Facebook</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Bottom Bar -->
              <tr>
                <td style="background-color: ${COLORS.maroon}; padding: 20px 40px; text-align: center;">
                  <a href="https://lathrift.com/shop" style="color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">SHOP NEW ARRIVALS</a>
                </td>
              </tr>
            </table>

            <!-- Copyright -->
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              <tr>
                <td style="padding: 20px; text-align: center;">
                  <p style="margin: 0; color: ${COLORS.muted}; font-size: 12px;">Questions? Reply to this email or DM us on socials.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Progress steps component
  const getProgressSteps = (currentStep: number) => {
    const steps = ["Paid", "Packing", "Shipped", "Delivered"];
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
        <tr>
          ${steps.map((step, index) => `
            <td style="width: 25%; text-align: center;">
              <div style="width: 24px; height: 24px; margin: 0 auto 8px auto; border-radius: 50%; background-color: ${index < currentStep ? COLORS.maroon : index === currentStep ? COLORS.maroon : COLORS.border}; display: flex; align-items: center; justify-content: center;">
                ${index < currentStep ? '<span style="color: #fff; font-size: 12px;">✓</span>' : index === currentStep ? '<span style="color: #fff; font-size: 10px;">●</span>' : ''}
              </div>
              <p style="margin: 0; font-size: 11px; color: ${index <= currentStep ? COLORS.foreground : COLORS.muted}; font-weight: ${index === currentStep ? '600' : '400'};">${step}</p>
            </td>
          `).join('')}
        </tr>
        <tr>
          <td colspan="4" style="padding-top: 15px;">
            <div style="height: 3px; background-color: ${COLORS.border}; border-radius: 2px; position: relative;">
              <div style="height: 3px; background-color: ${COLORS.maroon}; border-radius: 2px; width: ${currentStep * 33.33}%;"></div>
            </div>
          </td>
        </tr>
      </table>
    `;
  };

  switch (status) {
    case "paid":
      return {
        subject: `Order Confirmed #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Status -->
              <tr>
                <td style="padding: 0 40px 30px 40px; text-align: center;">
                  <h1 style="margin: 0 0 8px 0; color: ${COLORS.foreground}; font-size: 24px; font-weight: 600;">Payment Confirmed</h1>
                  <p style="margin: 0; color: ${COLORS.muted}; font-size: 15px;">Thank you for your order</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="color: ${COLORS.foreground}; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">
                    Hi ${orderDetails.customerName},
                  </p>
                  <p style="color: ${COLORS.muted}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    We've received your payment for order <span style="color: ${COLORS.maroon}; font-weight: 600;">#${orderIdShort}</span>. We'll start preparing your items right away.
                  </p>

                  <!-- Progress -->
                  ${getProgressSteps(1)}

                  <!-- Order Summary -->
                  <div style="background-color: #ffffff; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 24px; margin-top: 30px;">
                    <p style="margin: 0 0 16px 0; color: ${COLORS.foreground}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Order Summary</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 20px 0 0 0;">
                          <p style="margin: 0; color: ${COLORS.foreground}; font-size: 14px; font-weight: 600;">Total</p>
                        </td>
                        <td style="padding: 20px 0 0 0; text-align: right;">
                          <p style="margin: 0; color: ${COLORS.maroon}; font-size: 18px; font-weight: 700;">${formatPrice(orderDetails.total)}</p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <p style="color: ${COLORS.muted}; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                    We'll send you tracking info once your order ships.
                  </p>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "processing":
      return {
        subject: `Preparing Your Order #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Status -->
              <tr>
                <td style="padding: 0 40px 30px 40px; text-align: center;">
                  <h1 style="margin: 0 0 8px 0; color: ${COLORS.foreground}; font-size: 24px; font-weight: 600;">Preparing Your Order</h1>
                  <p style="margin: 0; color: ${COLORS.muted}; font-size: 15px;">We're packing your items</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="color: ${COLORS.foreground}; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">
                    Hi ${orderDetails.customerName},
                  </p>
                  <p style="color: ${COLORS.muted}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Great news! Your order <span style="color: ${COLORS.maroon}; font-weight: 600;">#${orderIdShort}</span> is now being prepared for shipment.
                  </p>

                  <!-- Progress -->
                  ${getProgressSteps(2)}

                  <!-- Items -->
                  <div style="background-color: #ffffff; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 24px; margin-top: 30px;">
                    <p style="margin: 0 0 16px 0; color: ${COLORS.foreground}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Items Being Packed</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                    </table>
                  </div>

                  <p style="color: ${COLORS.muted}; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                    You'll receive tracking details once we ship your order.
                  </p>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "shipped":
      const courierName = orderDetails.courier ? COURIER_LABELS[orderDetails.courier] : "Courier";
      const trackingUrl = orderDetails.courier && orderDetails.trackingNumber
        ? getTrackingUrl(orderDetails.courier, orderDetails.trackingNumber)
        : null;

      return {
        subject: `Your Order is On Its Way #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Status -->
              <tr>
                <td style="padding: 0 40px 30px 40px; text-align: center;">
                  <h1 style="margin: 0 0 8px 0; color: ${COLORS.foreground}; font-size: 24px; font-weight: 600;">Order Shipped!</h1>
                  <p style="margin: 0; color: ${COLORS.muted}; font-size: 15px;">Your package is on its way</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="color: ${COLORS.foreground}; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">
                    Hi ${orderDetails.customerName},
                  </p>
                  <p style="color: ${COLORS.muted}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Your order <span style="color: ${COLORS.maroon}; font-weight: 600;">#${orderIdShort}</span> has been shipped and is on its way to you!
                  </p>

                  <!-- Tracking Box -->
                  <div style="background-color: ${COLORS.maroon}; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.8); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
                    <p style="margin: 0 0 6px 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 1px;">${orderDetails.trackingNumber || "N/A"}</p>
                    <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.8); font-size: 14px;">via ${courierName}</p>
                    ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; background-color: #ffffff; color: ${COLORS.maroon}; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Track Package</a>` : ""}
                  </div>

                  <!-- Progress -->
                  ${getProgressSteps(3)}

                  <!-- Items -->
                  <div style="background-color: #ffffff; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 24px; margin-top: 30px;">
                    <p style="margin: 0 0 16px 0; color: ${COLORS.foreground}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Items Shipped</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                    </table>
                  </div>

                  <p style="color: ${COLORS.muted}; font-size: 14px; margin: 30px 0 0 0; text-align: center;">
                    Estimated delivery: 3-7 business days
                  </p>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "delivered":
      return {
        subject: `Order Delivered #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Status -->
              <tr>
                <td style="padding: 0 40px 30px 40px; text-align: center;">
                  <h1 style="margin: 0 0 8px 0; color: ${COLORS.foreground}; font-size: 24px; font-weight: 600;">Order Delivered!</h1>
                  <p style="margin: 0; color: ${COLORS.muted}; font-size: 15px;">Enjoy your new finds</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="color: ${COLORS.foreground}; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">
                    Hi ${orderDetails.customerName},
                  </p>
                  <p style="color: ${COLORS.muted}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Your order <span style="color: ${COLORS.maroon}; font-weight: 600;">#${orderIdShort}</span> has been delivered. We hope you love your new items!
                  </p>

                  <!-- Progress -->
                  ${getProgressSteps(4)}

                  <!-- Thank You Box -->
                  <div style="background-color: #ffffff; border: 2px solid ${COLORS.maroon}; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="margin: 0 0 12px 0; color: ${COLORS.maroon}; font-size: 18px; font-weight: 600;">Thank you for shopping with us!</p>
                    <p style="margin: 0; color: ${COLORS.muted}; font-size: 14px; line-height: 1.6;">
                      Tag us @lathrift on your unboxing or fit pics<br>for a chance to be featured.
                    </p>
                  </div>

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align: center;">
                        <a href="https://lathrift.com/shop" style="display: inline-block; background-color: ${COLORS.maroon}; color: #ffffff; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">Shop More</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "refunded":
      return {
        subject: `Refund Processed #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Status -->
              <tr>
                <td style="padding: 0 40px 30px 40px; text-align: center;">
                  <h1 style="margin: 0 0 8px 0; color: ${COLORS.foreground}; font-size: 24px; font-weight: 600;">Refund Processed</h1>
                  <p style="margin: 0; color: ${COLORS.muted}; font-size: 15px;">Your refund has been completed</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="color: ${COLORS.foreground}; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">
                    Hi ${orderDetails.customerName},
                  </p>
                  <p style="color: ${COLORS.muted}; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Your refund for order <span style="color: ${COLORS.maroon}; font-weight: 600;">#${orderIdShort}</span> has been processed. The amount will be credited back to your original payment method within 5-10 business days.
                  </p>

                  <!-- Refund Box -->
                  <div style="background-color: #ffffff; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                    <p style="margin: 0 0 16px 0; color: ${COLORS.foreground}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Refund Details</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 20px 0 0 0;">
                          <p style="margin: 0; color: ${COLORS.foreground}; font-size: 14px; font-weight: 600;">Refund Amount</p>
                        </td>
                        <td style="padding: 20px 0 0 0; text-align: right;">
                          <p style="margin: 0; color: ${COLORS.maroon}; font-size: 18px; font-weight: 700;">${formatPrice(orderDetails.total)}</p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <p style="color: ${COLORS.muted}; font-size: 14px; margin: 0; text-align: center;">
                    If you have any questions about your refund, please reply to this email.
                  </p>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    default:
      return {
        subject: `Order Update #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Status -->
              <tr>
                <td style="padding: 0 40px 30px 40px; text-align: center;">
                  <h1 style="margin: 0 0 8px 0; color: ${COLORS.foreground}; font-size: 24px; font-weight: 600;">Order Update</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 0 40px 40px 40px;">
                  <p style="color: ${COLORS.foreground}; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">
                    Hi ${orderDetails.customerName},
                  </p>
                  <p style="color: ${COLORS.muted}; font-size: 15px; line-height: 1.6; margin: 0;">
                    Your order <span style="color: ${COLORS.maroon}; font-weight: 600;">#${orderIdShort}</span> has been updated. Check your account for details.
                  </p>
                </td>
              </tr>
          ${emailFooter}
        `,
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, status, orderId, customerName, items, total, trackingNumber, courier } = body;

    if (!to || !status || !orderId || !customerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.log("Gmail credentials not configured, skipping email");
      return NextResponse.json({ success: false, error: "Email not configured" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const { subject, html } = getEmailContent(status, {
      orderId,
      customerName,
      items: items || [],
      total: total || 0,
      trackingNumber,
      courier,
    });

    const info = await transporter.sendMail({
      from: `"LA Thrift" <${gmailUser}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}
