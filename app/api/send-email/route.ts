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

// Beautiful email templates with marketing
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
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
          <span style="color: #333; font-weight: 500;">${item.name}</span>
          <br>
          <span style="color: #888; font-size: 13px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: 600; color: #A94442;">
          ${formatPrice(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  // Common styles
  const emailWrapper = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
  `;

  const emailFooter = `
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #1a1a1a; text-align: center;">
                  <h3 style="color: #A94442; font-size: 24px; margin: 0 0 10px 0; font-weight: 700;">LA THRIFT</h3>
                  <p style="color: #888; font-size: 14px; margin: 0 0 20px 0;">Thrifting made easy for you!</p>

                  <!-- Social Links -->
                  <div style="margin-bottom: 20px;">
                    <a href="https://tiktok.com/@lathrift" style="color: #A94442; text-decoration: none; margin: 0 10px; font-size: 14px;">TikTok</a>
                    <span style="color: #444;">|</span>
                    <a href="https://instagram.com/lathrift" style="color: #A94442; text-decoration: none; margin: 0 10px; font-size: 14px;">Instagram</a>
                    <span style="color: #444;">|</span>
                    <a href="https://facebook.com/lathrift" style="color: #A94442; text-decoration: none; margin: 0 10px; font-size: 14px;">Facebook</a>
                  </div>

                  <p style="color: #666; font-size: 12px; margin: 0;">
                    Questions? Reply to this email or DM us on socials!
                  </p>
                </td>
              </tr>
            </table>

            <!-- Bottom CTA -->
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 20px;">
              <tr>
                <td style="text-align: center; padding: 20px;">
                  <p style="color: #888; font-size: 13px; margin: 0 0 15px 0;">New drops every week! Follow us for first dibs on rare finds.</p>
                  <a href="https://lathrift.com/shop" style="display: inline-block; background: linear-gradient(135deg, #A94442 0%, #8B3634 100%); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 14px;">SHOP NEW ARRIVALS</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  switch (status) {
    case "paid":
      return {
        subject: `🎉 Payment Confirmed! Order #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #A94442 0%, #8B3634 100%); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
                  <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 700;">Payment Received!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0 0;">Thank you for your purchase</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi <strong>${orderDetails.customerName}</strong>,
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Great news! We've received your payment for Order <strong style="color: #A94442;">#${orderIdShort}</strong>. Our team is now preparing your items for shipment.
                  </p>

                  <!-- Order Box -->
                  <div style="background-color: #fafafa; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="color: #333; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">📦 Order Summary</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 16px 0 0 0; font-weight: 700; font-size: 16px; color: #333;">Total</td>
                        <td style="padding: 16px 0 0 0; text-align: right; font-weight: 700; font-size: 18px; color: #A94442;">${formatPrice(orderDetails.total)}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- What's Next -->
                  <div style="border-left: 4px solid #A94442; padding-left: 20px; margin-bottom: 30px;">
                    <h4 style="color: #333; margin: 0 0 10px 0; font-size: 15px;">What's Next?</h4>
                    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
                      We'll send you another email with tracking info once your order ships. Expect delivery within 3-7 business days.
                    </p>
                  </div>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "processing":
      return {
        subject: `📦 Packing Your Order #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #5B6EAE 0%, #404E7C 100%); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
                  <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 700;">Preparing Your Order</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0 0;">We're packing your goodies!</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi <strong>${orderDetails.customerName}</strong>,
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Your order <strong style="color: #5B6EAE;">#${orderIdShort}</strong> is now being prepared! Our team is carefully packing your items to make sure they arrive in perfect condition.
                  </p>

                  <!-- Progress Bar -->
                  <div style="background-color: #f0f0f0; border-radius: 10px; height: 8px; margin-bottom: 30px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #A94442, #5B6EAE); width: 50%; height: 100%; border-radius: 10px;"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <span style="color: #A94442; font-size: 12px; font-weight: 600;">✓ Paid</span>
                    <span style="color: #5B6EAE; font-size: 12px; font-weight: 600;">● Packing</span>
                    <span style="color: #ccc; font-size: 12px;">Shipped</span>
                    <span style="color: #ccc; font-size: 12px;">Delivered</span>
                  </div>

                  <!-- Order Box -->
                  <div style="background-color: #fafafa; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="color: #333; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">🛍️ Your Items</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                    </table>
                  </div>

                  <p style="color: #888; font-size: 14px; text-align: center; margin: 0;">
                    You'll receive tracking info once we ship your order!
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
        subject: `🚚 Your Order is On Its Way! #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2D8B5F 0%, #1D6B4A 100%); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 10px;">🚚</div>
                  <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 700;">Order Shipped!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0 0;">Your package is on its way</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi <strong>${orderDetails.customerName}</strong>,
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Exciting news! Your order <strong style="color: #2D8B5F;">#${orderIdShort}</strong> has been shipped and is now on its way to you!
                  </p>

                  <!-- Tracking Box -->
                  <div style="background: linear-gradient(135deg, #2D8B5F 0%, #1D6B4A 100%); border-radius: 16px; padding: 28px; margin-bottom: 30px; text-align: center;">
                    <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</p>
                    <p style="color: #fff; font-size: 24px; font-weight: 700; margin: 0 0 5px 0; font-family: monospace; letter-spacing: 2px;">${orderDetails.trackingNumber || "N/A"}</p>
                    <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 0 0 20px 0;">via ${courierName}</p>
                    ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; background-color: #fff; color: #2D8B5F; padding: 14px 32px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 14px;">TRACK YOUR PACKAGE →</a>` : ""}
                  </div>

                  <!-- Progress Bar -->
                  <div style="background-color: #f0f0f0; border-radius: 10px; height: 8px; margin-bottom: 30px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #A94442, #5B6EAE, #2D8B5F); width: 75%; height: 100%; border-radius: 10px;"></div>
                  </div>

                  <!-- Order Box -->
                  <div style="background-color: #fafafa; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                    <h3 style="color: #333; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">📬 Items Shipped</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                    </table>
                  </div>

                  <div style="background-color: #E8F5E9; border-radius: 12px; padding: 20px; text-align: center;">
                    <p style="color: #2D8B5F; font-size: 14px; margin: 0; font-weight: 500;">
                      📍 Estimated delivery: 3-7 business days
                    </p>
                  </div>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "delivered":
      return {
        subject: `✅ Order Delivered! #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #A94442 0%, #8B3634 100%); padding: 40px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
                  <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 700;">Order Delivered!</h1>
                  <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 10px 0 0 0;">Enjoy your new finds!</p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi <strong>${orderDetails.customerName}</strong>,
                  </p>
                  <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                    Your order <strong style="color: #A94442;">#${orderIdShort}</strong> has been delivered! We hope you love your new thrift finds. 🙌
                  </p>

                  <!-- Progress Bar Complete -->
                  <div style="background-color: #f0f0f0; border-radius: 10px; height: 8px; margin-bottom: 30px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #A94442, #5B6EAE, #2D8B5F, #A94442); width: 100%; height: 100%; border-radius: 10px;"></div>
                  </div>

                  <!-- Thank You Box -->
                  <div style="background: linear-gradient(135deg, #FFF5F5 0%, #FFF0F0 100%); border: 2px solid #A94442; border-radius: 16px; padding: 28px; margin-bottom: 30px; text-align: center;">
                    <h3 style="color: #A94442; font-size: 20px; margin: 0 0 10px 0;">Thank You for Shopping!</h3>
                    <p style="color: #666; font-size: 14px; margin: 0 0 20px 0;">Your support means the world to us. Follow us for more rare finds!</p>
                    <div>
                      <a href="https://tiktok.com/@lathrift" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-size: 13px; margin: 5px;">Follow on TikTok</a>
                      <a href="https://instagram.com/lathrift" style="display: inline-block; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-size: 13px; margin: 5px;">Follow on Instagram</a>
                    </div>
                  </div>

                  <!-- Review CTA -->
                  <div style="background-color: #fafafa; border-radius: 12px; padding: 24px; text-align: center;">
                    <p style="color: #555; font-size: 15px; margin: 0 0 15px 0;">
                      💬 Got your items? Share your unboxing on TikTok/IG and tag us <strong>@lathrift</strong> for a chance to be featured!
                    </p>
                  </div>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    default:
      return {
        subject: `Order Update - #${orderIdShort}`,
        html: `
          ${emailWrapper}
              <tr>
                <td style="background: linear-gradient(135deg, #A94442 0%, #8B3634 100%); padding: 40px; text-align: center;">
                  <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 700;">Order Update</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Hi ${orderDetails.customerName}, your order #${orderIdShort} has been updated.
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
