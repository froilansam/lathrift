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

// LA Thrift Logo (SVG-style text logo)
const laThriftLogo = `
  <div style="text-align: center; margin-bottom: 8px;">
    <div style="display: inline-block; background: linear-gradient(180deg, #FF4444 0%, #CC0000 100%); padding: 12px 24px; border-radius: 4px; transform: skew(-3deg);">
      <span style="font-family: 'Impact', 'Arial Black', sans-serif; font-size: 32px; font-weight: 900; color: #FFFFFF; letter-spacing: 4px; text-shadow: 3px 3px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000;">LA THRIFT</span>
    </div>
  </div>
  <p style="font-family: 'Courier New', monospace; font-size: 11px; color: #888; letter-spacing: 3px; text-transform: uppercase; margin: 0;">Streetwear • Vintage • Rare Finds</p>
`;

// Street-style email templates
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
        <td style="padding: 16px; background: #1A1A1A; border-bottom: 1px solid #333;">
          <span style="color: #FFF; font-weight: 600; font-size: 14px; font-family: 'Helvetica Neue', Arial, sans-serif;">${item.name}</span>
          <br>
          <span style="color: #666; font-size: 12px; font-family: 'Courier New', monospace;">QTY: ${item.quantity}</span>
        </td>
        <td style="padding: 16px; background: #1A1A1A; border-bottom: 1px solid #333; text-align: right;">
          <span style="color: #FF4444; font-weight: 700; font-size: 16px; font-family: 'Helvetica Neue', Arial, sans-serif;">${formatPrice(item.price * item.quantity)}</span>
        </td>
      </tr>
    `
    )
    .join("");

  // Street-style wrapper
  const emailWrapper = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0D0D0D; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0D0D0D; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111111; border: 1px solid #222;">
  `;

  const emailFooter = `
              <!-- Footer -->
              <tr>
                <td style="padding: 40px 30px; background: linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%); text-align: center; border-top: 3px solid #FF4444;">
                  ${laThriftLogo}

                  <!-- Social Links -->
                  <div style="margin: 30px 0;">
                    <a href="https://tiktok.com/@lathrift" style="display: inline-block; background: #000; border: 2px solid #333; color: #FFF; padding: 10px 20px; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 1px; margin: 5px; transition: all 0.3s;">TIKTOK</a>
                    <a href="https://instagram.com/lathrift" style="display: inline-block; background: #000; border: 2px solid #333; color: #FFF; padding: 10px 20px; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 1px; margin: 5px;">INSTAGRAM</a>
                    <a href="https://facebook.com/lathrift" style="display: inline-block; background: #000; border: 2px solid #333; color: #FFF; padding: 10px 20px; text-decoration: none; font-size: 12px; font-weight: 600; letter-spacing: 1px; margin: 5px;">FACEBOOK</a>
                  </div>

                  <p style="color: #444; font-size: 11px; margin: 20px 0 0 0; font-family: 'Courier New', monospace; letter-spacing: 1px;">
                    Questions? DM us on socials or reply to this email
                  </p>
                </td>
              </tr>
            </table>

            <!-- Bottom CTA Banner -->
            <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 2px;">
              <tr>
                <td style="background: #FF4444; padding: 25px; text-align: center;">
                  <p style="color: #FFF; font-size: 13px; margin: 0 0 15px 0; font-family: 'Courier New', monospace; letter-spacing: 2px; text-transform: uppercase;">New drops every week. Don't sleep on it.</p>
                  <a href="https://lathrift.com/shop" style="display: inline-block; background: #000; color: #FFF; padding: 14px 40px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">SHOP NOW →</a>
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
        subject: `Payment Confirmed - Order #${orderIdShort} | LA THRIFT`,
        html: `
          ${emailWrapper}
              <!-- Logo Header -->
              <tr>
                <td style="padding: 30px; background: #0D0D0D; text-align: center; border-bottom: 1px solid #222;">
                  ${laThriftLogo}
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="background: linear-gradient(90deg, #FF4444 0%, #CC0000 100%); padding: 30px; text-align: center;">
                  <p style="font-family: 'Courier New', monospace; font-size: 12px; color: rgba(255,255,255,0.7); margin: 0 0 8px 0; letter-spacing: 3px; text-transform: uppercase;">Order Status</p>
                  <h1 style="color: #FFF; font-size: 28px; margin: 0; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">PAYMENT RECEIVED</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; background: #111;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 5px 0; font-family: 'Courier New', monospace; text-transform: uppercase; letter-spacing: 1px;">Hey,</p>
                  <p style="color: #FFF; font-size: 20px; margin: 0 0 25px 0; font-weight: 600;">${orderDetails.customerName}</p>

                  <p style="color: #AAA; font-size: 15px; line-height: 1.7; margin: 0 0 30px 0;">
                    We got your payment for Order <span style="color: #FF4444; font-weight: 700; font-family: 'Courier New', monospace;">#${orderIdShort}</span>. Your items are being pulled from the vault. Stay tuned.
                  </p>

                  <!-- Order Box -->
                  <div style="background: #0D0D0D; border: 1px solid #333; margin-bottom: 30px;">
                    <div style="background: #1A1A1A; padding: 16px 20px; border-bottom: 1px solid #333;">
                      <span style="color: #FF4444; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-family: 'Courier New', monospace;">YOUR ITEMS</span>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 20px 16px; background: #1A1A1A;">
                          <span style="color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">TOTAL</span>
                        </td>
                        <td style="padding: 20px 16px; background: #1A1A1A; text-align: right;">
                          <span style="color: #FFF; font-weight: 700; font-size: 22px;">${formatPrice(orderDetails.total)}</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- What's Next -->
                  <div style="border-left: 4px solid #FF4444; padding-left: 20px;">
                    <p style="color: #FF4444; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px 0; font-family: 'Courier New', monospace;">WHAT'S NEXT</p>
                    <p style="color: #888; font-size: 14px; margin: 0; line-height: 1.6;">
                      We'll hit you up with tracking info once your order ships. Usually takes 3-7 business days.
                    </p>
                  </div>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "processing":
      return {
        subject: `Packing Your Order #${orderIdShort} | LA THRIFT`,
        html: `
          ${emailWrapper}
              <!-- Logo Header -->
              <tr>
                <td style="padding: 30px; background: #0D0D0D; text-align: center; border-bottom: 1px solid #222;">
                  ${laThriftLogo}
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="background: linear-gradient(90deg, #FFB800 0%, #FF8C00 100%); padding: 30px; text-align: center;">
                  <p style="font-family: 'Courier New', monospace; font-size: 12px; color: rgba(0,0,0,0.6); margin: 0 0 8px 0; letter-spacing: 3px; text-transform: uppercase;">Order Status</p>
                  <h1 style="color: #000; font-size: 28px; margin: 0; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">PACKING YOUR ORDER</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; background: #111;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 5px 0; font-family: 'Courier New', monospace; text-transform: uppercase; letter-spacing: 1px;">Yo,</p>
                  <p style="color: #FFF; font-size: 20px; margin: 0 0 25px 0; font-weight: 600;">${orderDetails.customerName}</p>

                  <p style="color: #AAA; font-size: 15px; line-height: 1.7; margin: 0 0 30px 0;">
                    Order <span style="color: #FFB800; font-weight: 700; font-family: 'Courier New', monospace;">#${orderIdShort}</span> is getting packed right now. We're making sure everything's crispy before it ships.
                  </p>

                  <!-- Progress Bar -->
                  <div style="margin-bottom: 35px;">
                    <div style="background: #222; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 15px;">
                      <div style="background: linear-gradient(90deg, #FF4444 0%, #FFB800 50%); width: 50%; height: 100%;"></div>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 25%; text-align: left;">
                          <span style="color: #FF4444; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">✓ PAID</span>
                        </td>
                        <td style="width: 25%; text-align: center;">
                          <span style="color: #FFB800; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">● PACKING</span>
                        </td>
                        <td style="width: 25%; text-align: center;">
                          <span style="color: #444; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">SHIPPED</span>
                        </td>
                        <td style="width: 25%; text-align: right;">
                          <span style="color: #444; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">DELIVERED</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Order Box -->
                  <div style="background: #0D0D0D; border: 1px solid #333; margin-bottom: 30px;">
                    <div style="background: #1A1A1A; padding: 16px 20px; border-bottom: 1px solid #333;">
                      <span style="color: #FFB800; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-family: 'Courier New', monospace;">ITEMS IN YOUR ORDER</span>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                    </table>
                  </div>

                  <p style="color: #666; font-size: 13px; text-align: center; margin: 0; font-family: 'Courier New', monospace;">
                    Tracking info coming soon. We got you.
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
        subject: `Your Order is On Its Way! #${orderIdShort} | LA THRIFT`,
        html: `
          ${emailWrapper}
              <!-- Logo Header -->
              <tr>
                <td style="padding: 30px; background: #0D0D0D; text-align: center; border-bottom: 1px solid #222;">
                  ${laThriftLogo}
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="background: linear-gradient(90deg, #00C853 0%, #00E676 100%); padding: 30px; text-align: center;">
                  <p style="font-family: 'Courier New', monospace; font-size: 12px; color: rgba(0,0,0,0.6); margin: 0 0 8px 0; letter-spacing: 3px; text-transform: uppercase;">Order Status</p>
                  <h1 style="color: #000; font-size: 28px; margin: 0; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">ORDER SHIPPED!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; background: #111;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 5px 0; font-family: 'Courier New', monospace; text-transform: uppercase; letter-spacing: 1px;">Let's go,</p>
                  <p style="color: #FFF; font-size: 20px; margin: 0 0 25px 0; font-weight: 600;">${orderDetails.customerName}</p>

                  <p style="color: #AAA; font-size: 15px; line-height: 1.7; margin: 0 0 30px 0;">
                    Your order <span style="color: #00C853; font-weight: 700; font-family: 'Courier New', monospace;">#${orderIdShort}</span> just left the building. It's on its way to you right now!
                  </p>

                  <!-- Tracking Box -->
                  <div style="background: linear-gradient(135deg, #00C853 0%, #00E676 100%); padding: 30px; margin-bottom: 30px; text-align: center;">
                    <p style="font-family: 'Courier New', monospace; font-size: 11px; color: rgba(0,0,0,0.6); margin: 0 0 10px 0; letter-spacing: 2px; text-transform: uppercase;">TRACKING NUMBER</p>
                    <p style="color: #000; font-size: 28px; font-weight: 900; margin: 0 0 8px 0; font-family: 'Courier New', monospace; letter-spacing: 3px;">${orderDetails.trackingNumber || "N/A"}</p>
                    <p style="color: rgba(0,0,0,0.7); font-size: 14px; margin: 0 0 20px 0; font-weight: 600;">via ${courierName}</p>
                    ${trackingUrl ? `<a href="${trackingUrl}" style="display: inline-block; background: #000; color: #FFF; padding: 14px 40px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">TRACK PACKAGE →</a>` : ""}
                  </div>

                  <!-- Progress Bar -->
                  <div style="margin-bottom: 35px;">
                    <div style="background: #222; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 15px;">
                      <div style="background: linear-gradient(90deg, #FF4444 0%, #FFB800 33%, #00C853 66%); width: 75%; height: 100%;"></div>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 25%; text-align: left;">
                          <span style="color: #FF4444; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">✓ PAID</span>
                        </td>
                        <td style="width: 25%; text-align: center;">
                          <span style="color: #FFB800; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">✓ PACKED</span>
                        </td>
                        <td style="width: 25%; text-align: center;">
                          <span style="color: #00C853; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">● SHIPPED</span>
                        </td>
                        <td style="width: 25%; text-align: right;">
                          <span style="color: #444; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">DELIVERED</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Order Box -->
                  <div style="background: #0D0D0D; border: 1px solid #333; margin-bottom: 30px;">
                    <div style="background: #1A1A1A; padding: 16px 20px; border-bottom: 1px solid #333;">
                      <span style="color: #00C853; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; font-family: 'Courier New', monospace;">ITEMS SHIPPED</span>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${itemsHtml}
                    </table>
                  </div>

                  <div style="background: #0A1F0A; border: 1px solid #00C853; padding: 20px; text-align: center;">
                    <p style="color: #00C853; font-size: 14px; margin: 0; font-weight: 600; font-family: 'Courier New', monospace;">
                      📍 ESTIMATED DELIVERY: 3-7 BUSINESS DAYS
                    </p>
                  </div>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    case "delivered":
      return {
        subject: `Order Delivered! #${orderIdShort} | LA THRIFT`,
        html: `
          ${emailWrapper}
              <!-- Logo Header -->
              <tr>
                <td style="padding: 30px; background: #0D0D0D; text-align: center; border-bottom: 1px solid #222;">
                  ${laThriftLogo}
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td style="background: linear-gradient(90deg, #FF4444 0%, #FF6B6B 100%); padding: 30px; text-align: center;">
                  <p style="font-family: 'Courier New', monospace; font-size: 12px; color: rgba(255,255,255,0.7); margin: 0 0 8px 0; letter-spacing: 3px; text-transform: uppercase;">Order Status</p>
                  <h1 style="color: #FFF; font-size: 28px; margin: 0; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">DELIVERED!</h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px; background: #111;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 5px 0; font-family: 'Courier New', monospace; text-transform: uppercase; letter-spacing: 1px;">Nice one,</p>
                  <p style="color: #FFF; font-size: 20px; margin: 0 0 25px 0; font-weight: 600;">${orderDetails.customerName}</p>

                  <p style="color: #AAA; font-size: 15px; line-height: 1.7; margin: 0 0 30px 0;">
                    Your order <span style="color: #FF4444; font-weight: 700; font-family: 'Courier New', monospace;">#${orderIdShort}</span> has been delivered. Enjoy your new heat! 🔥
                  </p>

                  <!-- Progress Bar Complete -->
                  <div style="margin-bottom: 35px;">
                    <div style="background: #222; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 15px;">
                      <div style="background: linear-gradient(90deg, #FF4444 0%, #FFB800 33%, #00C853 66%, #FF4444 100%); width: 100%; height: 100%;"></div>
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 25%; text-align: left;">
                          <span style="color: #FF4444; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">✓ PAID</span>
                        </td>
                        <td style="width: 25%; text-align: center;">
                          <span style="color: #FFB800; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">✓ PACKED</span>
                        </td>
                        <td style="width: 25%; text-align: center;">
                          <span style="color: #00C853; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">✓ SHIPPED</span>
                        </td>
                        <td style="width: 25%; text-align: right;">
                          <span style="color: #FF4444; font-size: 10px; font-weight: 700; letter-spacing: 1px; font-family: 'Courier New', monospace;">✓ DELIVERED</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Thank You Box -->
                  <div style="background: linear-gradient(135deg, #1A0A0A 0%, #2A1515 100%); border: 2px solid #FF4444; padding: 30px; margin-bottom: 30px; text-align: center;">
                    <p style="color: #FF4444; font-size: 24px; margin: 0 0 15px 0; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">THANK YOU FAM!</p>
                    <p style="color: #888; font-size: 14px; margin: 0 0 25px 0; line-height: 1.6;">
                      Your support keeps the thrift game alive. <br>Follow us for more rare finds and weekly drops!
                    </p>
                    <div>
                      <a href="https://tiktok.com/@lathrift" style="display: inline-block; background: #000; border: 2px solid #FFF; color: #FFF; padding: 12px 24px; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin: 5px;">TIKTOK</a>
                      <a href="https://instagram.com/lathrift" style="display: inline-block; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #FFF; padding: 12px 24px; text-decoration: none; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin: 5px; border: none;">INSTAGRAM</a>
                    </div>
                  </div>

                  <!-- Share CTA -->
                  <div style="background: #0D0D0D; border: 1px solid #333; padding: 25px; text-align: center;">
                    <p style="color: #FFF; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">📸 SHOW US YOUR FIT</p>
                    <p style="color: #666; font-size: 13px; margin: 0; line-height: 1.6; font-family: 'Courier New', monospace;">
                      Post your unboxing or fit check and tag <span style="color: #FF4444;">@lathrift</span> for a chance to be featured!
                    </p>
                  </div>
                </td>
              </tr>
          ${emailFooter}
        `,
      };

    default:
      return {
        subject: `Order Update - #${orderIdShort} | LA THRIFT`,
        html: `
          ${emailWrapper}
              <!-- Logo Header -->
              <tr>
                <td style="padding: 30px; background: #0D0D0D; text-align: center; border-bottom: 1px solid #222;">
                  ${laThriftLogo}
                </td>
              </tr>

              <tr>
                <td style="background: #FF4444; padding: 30px; text-align: center;">
                  <h1 style="color: #FFF; font-size: 28px; margin: 0; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">ORDER UPDATE</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px; background: #111;">
                  <p style="color: #888; font-size: 14px; margin: 0 0 5px 0; font-family: 'Courier New', monospace; text-transform: uppercase; letter-spacing: 1px;">Hey,</p>
                  <p style="color: #FFF; font-size: 20px; margin: 0 0 25px 0; font-weight: 600;">${orderDetails.customerName}</p>
                  <p style="color: #AAA; font-size: 15px; line-height: 1.7;">
                    Your order <span style="color: #FF4444; font-weight: 700; font-family: 'Courier New', monospace;">#${orderIdShort}</span> has been updated. Check your account for more details.
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
