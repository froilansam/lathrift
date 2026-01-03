"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { formatPrice, formatDateTime, STATUS_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const productStats = useQuery(api.products.getStats);
  const orderStats = useQuery(api.orders.getStats);
  const customerStats = useQuery(api.customers.getStats);
  const recentOrders = useQuery(api.orders.getRecent, { limit: 5 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted">Welcome back to LA Thrift admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={orderStats ? formatPrice(orderStats.revenue) : "..."}
          subtext={
            orderStats
              ? `${formatPrice(orderStats.todayRevenue)} today`
              : "Loading..."
          }
          icon={TrendingUp}
          iconColor="text-success"
        />
        <StatCard
          title="Orders"
          value={orderStats?.total ?? "..."}
          subtext={`${orderStats?.pending ?? 0} pending`}
          icon={ShoppingCart}
          iconColor="text-accent"
        />
        <StatCard
          title="Products"
          value={productStats?.active ?? "..."}
          subtext={`${productStats?.sold ?? 0} sold`}
          icon={Package}
          iconColor="text-primary"
        />
        <StatCard
          title="Customers"
          value={customerStats?.total ?? "..."}
          subtext={`${customerStats?.withOrders ?? 0} with orders`}
          icon={Users}
          iconColor="text-muted"
        />
      </div>

      {/* Alerts */}
      {productStats && productStats.lowStock > 0 && (
        <div className="rounded-lg border border-accent bg-accent/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Low Stock Alert</p>
              <p className="text-sm text-muted">
                {productStats.lowStock} product(s) with low stock
              </p>
            </div>
            <Link
              href="/admin/products"
              className="ml-auto text-sm font-medium text-accent hover:underline"
            >
              View Products
            </Link>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-medium">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-muted hover:text-foreground flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentOrders === undefined ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-secondary" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted">
            No orders yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/admin/orders?id=${order._id}`}
                className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
              >
                <div>
                  <p className="font-medium">
                    Order #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-muted">
                    {formatDateTime(order.createdAt)} •{" "}
                    {order.items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(order.total)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/admin/products?action=new"
          title="Add Product"
          description="List a new item for sale"
          icon={Package}
        />
        <QuickAction
          href="/admin/orders"
          title="Manage Orders"
          description="View and update orders"
          icon={ShoppingCart}
        />
        <QuickAction
          href="/admin/categories"
          title="Categories"
          description="Organize your products"
          icon={Package}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{title}</p>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted">{subtext}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
}) {
  const variants: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
    pending: "warning",
    paid: "success",
    processing: "default",
    shipped: "default",
    delivered: "success",
    cancelled: "destructive",
    refunded: "secondary",
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border p-4 hover:bg-secondary/50 transition-colors"
    >
      <Icon className="h-8 w-8 mb-3 text-accent" />
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
    </Link>
  );
}
