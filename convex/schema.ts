import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Product categories
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    order: v.number(),
  }).index("by_slug", ["slug"]),

  // Products
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.array(v.string()), // Convex storage IDs
    categoryId: v.id("categories"),
    type: v.union(v.literal("unique"), v.literal("stock")),
    quantity: v.number(), // 1 for unique, n for stock
    sold: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("hidden")
    ),
    brand: v.optional(v.string()),
    condition: v.union(
      v.literal("new"),
      v.literal("like-new"),
      v.literal("good"),
      v.literal("fair")
    ),
    featured: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_status", ["status"])
    .index("by_featured", ["featured"])
    .index("by_created", ["createdAt"]),

  // Customers (guest checkout)
  customers: defineTable({
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
    orderCount: v.number(),
    totalSpent: v.number(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"]),

  // Orders
  orders: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    paymentMethod: v.union(
      v.literal("qrph"),
      v.literal("tiktok"),
      v.literal("cod")
    ),
    paymentId: v.optional(v.string()), // PayMongo reference
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
    trackingNumber: v.optional(v.string()),
    courier: v.optional(
      v.union(
        v.literal("jnt"),
        v.literal("lbc"),
        v.literal("flash"),
        v.literal("ninja"),
        v.literal("gogoxpress"),
        v.literal("lalamove"),
        v.literal("grab"),
        v.literal("other")
      )
    ),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    shippedAt: v.optional(v.number()),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),
});
