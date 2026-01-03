import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let customers = await ctx.db.query("customers").collect();

    // Search by email or phone
    if (args.search) {
      const search = args.search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.email?.toLowerCase().includes(search) ||
          c.phone?.includes(search) ||
          c.name.toLowerCase().includes(search)
      );
    }

    // Sort by most recent first
    return customers.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getById = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmailOrPhone = query({
  args: {
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.email) {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      if (customer) return customer;
    }

    if (args.phone) {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_phone", (q) => q.eq("phone", args.phone))
        .first();
      if (customer) return customer;
    }

    return null;
  },
});

export const findOrCreate = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        province: v.string(),
        zip: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Try to find existing customer
    if (args.email) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
      if (existing) {
        // Update address if provided
        if (args.address) {
          await ctx.db.patch(existing._id, { address: args.address });
        }
        return existing._id;
      }
    }

    if (args.phone) {
      const existing = await ctx.db
        .query("customers")
        .withIndex("by_phone", (q) => q.eq("phone", args.phone))
        .first();
      if (existing) {
        // Update address if provided
        if (args.address) {
          await ctx.db.patch(existing._id, { address: args.address });
        }
        return existing._id;
      }
    }

    // Create new customer
    return await ctx.db.insert("customers", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      orderCount: 0,
      totalSpent: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateStats = mutation({
  args: {
    id: v.id("customers"),
    orderTotal: v.number(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) throw new Error("Customer not found");

    await ctx.db.patch(args.id, {
      orderCount: customer.orderCount + 1,
      totalSpent: customer.totalSpent + args.orderTotal,
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const customers = await ctx.db.query("customers").collect();
    return {
      total: customers.length,
      withOrders: customers.filter((c) => c.orderCount > 0).length,
    };
  },
});
