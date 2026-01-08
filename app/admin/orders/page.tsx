"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Search, ChevronDown, Package } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  formatDateTime,
  STATUS_LABELS,
  SHIPPING_LABELS,
  COURIER_LABELS,
  getTrackingUrl,
} from "@/lib/utils";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

type CourierType =
  | "jnt"
  | "lbc"
  | "flash"
  | "ninja"
  | "gogoxpress"
  | "lalamove"
  | "grab"
  | "other";

const COURIER_OPTIONS: CourierType[] = [
  "jnt",
  "lbc",
  "flash",
  "ninja",
  "gogoxpress",
  "lalamove",
  "grab",
  "other",
];

export default function OrdersPage() {
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Id<"orders"> | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [selectedCourier, setSelectedCourier] = useState<CourierType | "">("");

  const orders = useQuery(api.orders.list, {
    status: filterStatus === "all" ? undefined : filterStatus,
  });
  const updateStatus = useMutation(api.orders.updateStatus);
  const updateTracking = useMutation(api.orders.updateTracking);
  const cancelOrder = useMutation(api.orders.cancel);

  const handleStatusChange = async (
    orderId: Id<"orders">,
    newStatus: OrderStatus
  ) => {
    await updateStatus({ id: orderId, status: newStatus });
  };

  const handleAddTracking = async (orderId: Id<"orders">) => {
    if (!trackingNumber.trim() || !selectedCourier) return;
    await updateTracking({ id: orderId, trackingNumber, courier: selectedCourier });
    setTrackingNumber("");
    setSelectedCourier("");
    setSelectedOrder(null);
  };

  const handleCancel = async (orderId: Id<"orders">) => {
    if (confirm("Are you sure you want to cancel this order?")) {
      await cancelOrder({ id: orderId });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted">{orders?.length ?? 0} order(s)</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 -mx-4 px-4 pb-2 overflow-x-auto scrollbar-hide sm:mx-0 sm:px-0">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            filterStatus === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted hover:text-foreground"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders === undefined ? (
          [...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-secondary"
            />
          ))
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-border p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted mb-4" />
            <p className="text-muted">No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isExpanded={selectedOrder === order._id}
              onToggle={() =>
                setSelectedOrder(
                  selectedOrder === order._id ? null : order._id
                )
              }
              onStatusChange={(status) =>
                handleStatusChange(order._id, status)
              }
              onCancel={() => handleCancel(order._id)}
              trackingNumber={trackingNumber}
              setTrackingNumber={setTrackingNumber}
              selectedCourier={selectedCourier}
              setSelectedCourier={setSelectedCourier}
              onAddTracking={() => handleAddTracking(order._id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
  onStatusChange,
  onCancel,
  trackingNumber,
  setTrackingNumber,
  selectedCourier,
  setSelectedCourier,
  onAddTracking,
}: {
  order: {
    _id: Id<"orders">;
    customerId: Id<"customers">;
    items: { productId: Id<"products">; name: string; quantity: number; price: number }[];
    subtotal: number;
    shippingFee: number;
    total: number;
    status: OrderStatus;
    paymentMethod: "qrph" | "tiktok" | "cod";
    shippingMethod: "gogo" | "lalamove" | "tiktok" | "flat";
    shippingAddress: { street: string; city: string; province: string; zip: string };
    notes?: string;
    trackingNumber?: string;
    courier?: CourierType;
    createdAt: number;
    paidAt?: number;
    shippedAt?: number;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onCancel: () => void;
  trackingNumber: string;
  setTrackingNumber: (value: string) => void;
  selectedCourier: CourierType | "";
  setSelectedCourier: (value: CourierType | "") => void;
  onAddTracking: () => void;
}) {
  const customer = useQuery(api.customers.getById, { id: order.customerId });

  const variants: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    pending: "warning",
    paid: "success",
    processing: "default",
    shipped: "default",
    delivered: "success",
    cancelled: "destructive",
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="text-left min-w-0">
          <p className="font-medium text-sm sm:text-base">
            Order #{order._id.slice(-8).toUpperCase()}
          </p>
          <p className="text-xs sm:text-sm text-muted">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="text-right">
            <p className="font-bold text-sm sm:text-base">{formatPrice(order.total)}</p>
            <Badge variant={variants[order.status]} className="text-xs">
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Details */}
      {isExpanded && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Customer Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Customer</h4>
              <p className="text-sm">{customer?.name}</p>
              {customer?.email && (
                <p className="text-sm text-muted">{customer.email}</p>
              )}
              {customer?.phone && (
                <p className="text-sm text-muted">{customer.phone}</p>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-2">Shipping Address</h4>
              <p className="text-sm">{order.shippingAddress.street}</p>
              <p className="text-sm text-muted">
                {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
                {order.shippingAddress.zip}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-medium mb-2">Items</h4>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping ({SHIPPING_LABELS[order.shippingMethod]})</span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-sm text-muted">{order.notes}</p>
            </div>
          )}

          {/* Tracking */}
          {order.trackingNumber ? (
            <div>
              <h4 className="font-medium mb-2">Tracking Information</h4>
              <div className="space-y-1">
                {order.courier && (
                  <p className="text-sm">
                    <span className="text-muted">Courier:</span>{" "}
                    <span className="font-medium">{COURIER_LABELS[order.courier]}</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-muted">Tracking #:</span>{" "}
                  <span className="font-mono font-medium">{order.trackingNumber}</span>
                </p>
                {order.courier && getTrackingUrl(order.courier, order.trackingNumber) && (
                  <a
                    href={getTrackingUrl(order.courier, order.trackingNumber)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    Track Package →
                  </a>
                )}
              </div>
            </div>
          ) : order.status === "processing" || order.status === "paid" ? (
            <div className="space-y-3">
              <h4 className="font-medium">Ship Order</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={selectedCourier}
                  onChange={(e) => setSelectedCourier(e.target.value as CourierType | "")}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select Courier</option>
                  {COURIER_OPTIONS.map((courier) => (
                    <option key={courier} value={courier}>
                      {COURIER_LABELS[courier]}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
              <Button
                onClick={onAddTracking}
                disabled={!selectedCourier || !trackingNumber.trim()}
              >
                Mark as Shipped
              </Button>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {order.status !== "cancelled" && order.status !== "delivered" && (
              <>
                <select
                  value={order.status}
                  onChange={(e) =>
                    onStatusChange(e.target.value as OrderStatus)
                  }
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.filter((s) => s !== "cancelled").map(
                    (status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    )
                  )}
                </select>
                {order.status === "pending" && (
                  <Button variant="destructive" onClick={onCancel}>
                    Cancel Order
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
