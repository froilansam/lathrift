"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useAction } from "convex/react";
import {
  ChevronLeft,
  ShoppingBag,
  Truck,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formatPrice,
  getRegion,
  SHIPPING_RATES,
  SHIPPING_LABELS,
} from "@/lib/utils";

type ShippingMethod = "flat" | "tiktok";

interface FormData {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  zip: string;
  notes: string;
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState<"info" | "shipping" | "processing">("info");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("flat");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    province: "",
    zip: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const findOrCreateCustomer = useMutation(api.customers.findOrCreate);
  const createOrder = useMutation(api.orders.create);
  const updateCustomerStats = useMutation(api.customers.updateStats);
  const createCheckoutSession = useAction(api.paymongo.createCheckoutSession);

  // Calculate shipping based on province
  const region = formData.province ? getRegion(formData.province) : "metro-manila";
  const shippingFee =
    shippingMethod === "tiktok" ? 0 : SHIPPING_RATES.flat[region] || 99;
  const total = subtotal + shippingFee;

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required for payment receipt";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.street.trim()) newErrors.street = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.province.trim()) newErrors.province = "Province is required";
    if (!formData.zip.trim()) newErrors.zip = "ZIP code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitInfo = () => {
    if (validateForm()) {
      setStep("shipping");
    }
  };

  const handleProceedToPayment = async () => {
    if (items.length === 0) return;

    setIsSubmitting(true);
    setStep("processing");

    try {
      // Find or create customer
      const customerId = await findOrCreateCustomer({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          zip: formData.zip,
        },
      });

      // Create order
      const orderItems = items.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const orderId = await createOrder({
        customerId,
        items: orderItems,
        subtotal,
        shippingFee,
        total,
        paymentMethod: "qrph",
        shippingMethod: shippingMethod === "tiktok" ? "tiktok" : "flat",
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          zip: formData.zip,
        },
        notes: formData.notes || undefined,
      });

      // Update customer stats
      await updateCustomerStats({
        id: customerId,
        orderTotal: total,
      });

      // Build line items for PayMongo (amount in centavos)
      const lineItems = items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        amount: Math.round(item.price * 100), // Convert to centavos
      }));

      // Add shipping as a line item if not TikTok
      if (shippingMethod !== "tiktok" && shippingFee > 0) {
        lineItems.push({
          name: "Shipping Fee",
          quantity: 1,
          amount: Math.round(shippingFee * 100),
        });
      }

      // Create PayMongo checkout session
      const baseUrl = window.location.origin;
      const successUrl = shippingMethod === "tiktok"
        ? `${baseUrl}/checkout/success?order=${orderId}&tiktok=true`
        : `${baseUrl}/checkout/success?order=${orderId}`;

      const { checkoutUrl } = await createCheckoutSession({
        orderId,
        lineItems,
        customerEmail: formData.email,
        customerName: formData.name,
        successUrl,
        cancelUrl: `${baseUrl}/checkout/cancel?order=${orderId}`,
      });

      // Clear cart and redirect to PayMongo
      clearCart();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to process checkout. Please try again.");
      setStep("shipping");
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && step !== "processing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <ShoppingBag className="mx-auto h-12 w-12 text-muted mb-4" />
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <p className="text-muted mt-2">Add some items to checkout</p>
        <Button className="mt-6" asChild>
          <Link href="/shop">Browse Products</Link>
        </Button>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        <h1 className="text-xl font-bold">Processing your order...</h1>
        <p className="text-muted mt-2">Redirecting to payment gateway</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back Link */}
      {step === "info" && (
        <Link
          href="/shop"
          className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Continue Shopping
        </Link>
      )}

      {step === "shipping" && (
        <button
          onClick={() => setStep("info")}
          className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Information
        </button>
      )}

      <h1 className="text-2xl font-bold mb-8">
        {step === "info" && "Checkout"}
        {step === "shipping" && "Shipping & Payment"}
      </h1>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Step 1: Customer Info */}
          {step === "info" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="rounded-lg border border-border p-6 space-y-4">
                <h2 className="font-medium">Contact Information</h2>
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={errors.name}
                  placeholder="Juan Dela Cruz"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    error={errors.email}
                    placeholder="juan@email.com"
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    error={errors.phone}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border p-6 space-y-4">
                <h2 className="font-medium">Shipping Address</h2>
                <Input
                  label="Street Address"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  error={errors.street}
                  placeholder="123 Main St, Brgy. Sample"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="City"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    error={errors.city}
                    placeholder="Quezon City"
                  />
                  <Input
                    label="Province"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    error={errors.province}
                    placeholder="Metro Manila"
                  />
                </div>
                <Input
                  label="ZIP Code"
                  value={formData.zip}
                  onChange={(e) =>
                    setFormData({ ...formData, zip: e.target.value })
                  }
                  error={errors.zip}
                  placeholder="1100"
                />
              </div>

              <div className="rounded-lg border border-border p-6">
                <h2 className="font-medium mb-4">Order Notes (Optional)</h2>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Any special instructions..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                />
              </div>

              <Button
                size="lg"
                className="w-full bg-accent hover:bg-accent-light text-accent-foreground"
                onClick={handleSubmitInfo}
              >
                Continue to Shipping
              </Button>
            </motion.div>
          )}

          {/* Step 2: Shipping Method */}
          {step === "shipping" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="font-medium mb-4">Select Shipping Method</h2>

              {/* Standard Delivery */}
              <button
                onClick={() => setShippingMethod("flat")}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  shippingMethod === "flat"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted"
                }`}
              >
                <div className="flex items-start gap-4">
                  <Truck className="h-6 w-6 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Standard Delivery</span>
                      <span className="font-bold">
                        {formatPrice(SHIPPING_RATES.flat[region] || 99)}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      {SHIPPING_LABELS.flat} • 3-7 business days
                    </p>
                  </div>
                </div>
              </button>

              {/* TikTok Shop */}
              <button
                onClick={() => setShippingMethod("tiktok")}
                className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                  shippingMethod === "tiktok"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted"
                }`}
              >
                <div className="flex items-start gap-4">
                  <ExternalLink className="h-6 w-6 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">TikTok Shop Shipping</span>
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                          Cheapest
                        </span>
                      </div>
                      <span className="font-bold text-success">Free*</span>
                    </div>
                    <p className="text-sm text-muted mt-1">
                      Pay here, then complete shipping via TikTok Shop
                    </p>
                  </div>
                </div>
              </button>

              {/* Payment Info */}
              <div className="rounded-lg border border-border p-4 mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <CreditCard className="h-5 w-5 text-accent" />
                  <h3 className="font-medium">Secure Payment via PayMongo</h3>
                </div>
                <p className="text-sm text-muted">
                  Pay securely with GCash, Maya, Credit/Debit Card, or QR Ph.
                  You&apos;ll be redirected to PayMongo&apos;s secure checkout.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full mt-6 bg-accent hover:bg-accent-light text-accent-foreground"
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay {formatPrice(shippingMethod === "tiktok" ? subtotal : total)}
                  </>
                )}
              </Button>

              {shippingMethod === "tiktok" && (
                <p className="text-xs text-muted text-center">
                  *After payment, you&apos;ll order shipping via TikTok Shop
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border border-border p-6">
            <h2 className="font-medium mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative h-16 w-16 rounded-md bg-secondary overflow-hidden">
                    {item.image && item.image.startsWith("http") ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-muted" />
                      </div>
                    )}
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Shipping</span>
                <span>
                  {shippingMethod === "tiktok"
                    ? "Via TikTok"
                    : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span>
                  {shippingMethod === "tiktok"
                    ? formatPrice(subtotal)
                    : formatPrice(total)}
                </span>
              </div>
              {shippingMethod === "tiktok" && (
                <p className="text-xs text-muted">
                  + shipping via TikTok Shop
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
