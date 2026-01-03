import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("processing"),
        v.literal("shipped"),
        v.literal("delivered"),
        v.literal("cancelled"),
        v.literal("refunded")
      )
    ),
    customerId: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    let orders;

    if (args.customerId) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_customer", (q) => q.eq("customerId", args.customerId!))
        .collect();
    } else if (args.status) {
      orders = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      orders = await ctx.db.query("orders").collect();
    }

    // Sort by created date (newest first)
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByPaymentId = query({
  args: { paymentId: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db.query("orders").collect();
    return orders.find((o) => o.paymentId === args.paymentId);
  },
});

export const create = mutation({
  args: {
    customerId: v.id("customers"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        quantity: v.number(),
        price: v.number(),
      })
    ),
    subtotal: v.number(),
    shippingFee: v.number(),
    total: v.number(),
    paymentMethod: v.union(
      v.literal("qrph"),
      v.literal("tiktok"),
      v.literal("cod")
    ),
    shippingMethod: v.union(
      v.literal("gogo"),
      v.literal("lalamove"),
      v.literal("tiktok"),
      v.literal("flat")
    ),
    shippingAddress: v.object({
      street: v.string(),
      city: v.string(),
      province: v.string(),
      zip: v.string(),
    }),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create the order
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: args.paymentMethod === "cod" ? "processing" : "pending",
      createdAt: Date.now(),
    });

    // Update product quantities
    for (const item of args.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        const newQuantity = product.quantity - item.quantity;
        const newSold = product.sold + item.quantity;

        await ctx.db.patch(item.productId, {
          quantity: newQuantity,
          sold: newSold,
          status: newQuantity <= 0 ? "sold" : product.status,
        });
      }
    }

    return orderId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    const updates: Record<string, unknown> = { status: args.status };

    if (args.status === "paid") {
      updates.paidAt = Date.now();
    } else if (args.status === "shipped") {
      updates.shippedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);

    // Send email notification (except pending, cancelled)
    if (args.status !== "pending" && args.status !== "cancelled") {
      const customer = await ctx.db.get(order.customerId);
      if (customer?.email) {
        await ctx.scheduler.runAfter(0, internal.email.sendOrderStatusEmail, {
          to: customer.email,
          status: args.status,
          orderId: args.id,
          customerName: customer.name,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: order.total,
          trackingNumber: order.trackingNumber,
          courier: order.courier,
        });
      }
    }
  },
});

export const updatePayment = mutation({
  args: {
    id: v.id("orders"),
    paymentId: v.optional(v.string()),
    status: v.union(v.literal("paid"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.paymentId) {
      updates.paymentId = args.paymentId;
    }

    if (args.status === "paid") {
      updates.paidAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);

    // Send email notification when marked as paid
    if (args.status === "paid") {
      const customer = await ctx.db.get(order.customerId);
      if (customer?.email) {
        await ctx.scheduler.runAfter(0, internal.email.sendOrderStatusEmail, {
          to: customer.email,
          status: "paid",
          orderId: args.id,
          customerName: customer.name,
          items: order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: order.total,
          trackingNumber: order.trackingNumber,
          courier: order.courier,
        });
      }
    }
  },
});

export const updatePaymentId = mutation({
  args: {
    id: v.id("orders"),
    paymentId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { paymentId: args.paymentId });
  },
});

export const markAsPaid = mutation({
  args: {
    id: v.id("orders"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
    });
  },
});

export const updateTracking = mutation({
  args: {
    id: v.id("orders"),
    trackingNumber: v.string(),
    courier: v.union(
      v.literal("jnt"),
      v.literal("lbc"),
      v.literal("flash"),
      v.literal("ninja"),
      v.literal("gogoxpress"),
      v.literal("lalamove"),
      v.literal("grab"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    await ctx.db.patch(args.id, {
      trackingNumber: args.trackingNumber,
      courier: args.courier,
      status: "shipped",
      shippedAt: Date.now(),
    });

    // Send shipping notification email
    const customer = await ctx.db.get(order.customerId);
    if (customer?.email) {
      await ctx.scheduler.runAfter(0, internal.email.sendOrderStatusEmail, {
        to: customer.email,
        status: "shipped",
        orderId: args.id,
        customerName: customer.name,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
        trackingNumber: args.trackingNumber,
        courier: args.courier,
      });
    }
  },
});

export const cancel = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    // Only allow cancellation of pending orders
    if (order.status !== "pending") {
      throw new Error("Can only cancel pending orders");
    }

    // Restore product quantities
    for (const item of order.items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        await ctx.db.patch(item.productId, {
          quantity: product.quantity + item.quantity,
          sold: product.sold - item.quantity,
          status: "active",
        });
      }
    }

    await ctx.db.patch(args.id, { status: "cancelled" });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayOrders = orders.filter((o) => o.createdAt >= todayStart);
    const paidOrders = orders.filter(
      (o) => o.status !== "pending" && o.status !== "cancelled"
    );

    return {
      total: orders.length,
      today: todayOrders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      revenue: paidOrders.reduce((sum, o) => sum + o.total, 0),
      todayRevenue: todayOrders
        .filter((o) => o.status !== "pending" && o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0),
    };
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_created")
      .order("desc")
      .collect();

    return args.limit ? orders.slice(0, args.limit) : orders;
  },
});
