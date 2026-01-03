import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to convert storage IDs to URLs
async function resolveImageUrls(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  storageIds: string[]
): Promise<string[]> {
  const urls = await Promise.all(
    storageIds.map(async (id) => {
      // If it's already a URL, return it
      if (id.startsWith("http")) return id;
      // Otherwise, get the URL from storage
      return await ctx.storage.getUrl(id);
    })
  );
  return urls.filter((url): url is string => url !== null);
}

export const list = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    status: v.optional(
      v.union(v.literal("active"), v.literal("sold"), v.literal("hidden"))
    ),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let products;

    if (args.categoryId) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }

    // Filter by status
    if (args.status) {
      products = products.filter((p) => p.status === args.status);
    }

    // Filter by featured
    if (args.featured !== undefined) {
      products = products.filter((p) => p.featured === args.featured);
    }

    // Sort by created date (newest first) and resolve image URLs
    const sorted = products.sort((a, b) => b.createdAt - a.createdAt);

    // Resolve image URLs for all products
    const productsWithUrls = await Promise.all(
      sorted.map(async (product) => ({
        ...product,
        images: await resolveImageUrls(ctx, product.images),
      }))
    );

    return productsWithUrls;
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;

    return {
      ...product,
      images: await resolveImageUrls(ctx, product.images),
    };
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();

    const active = products
      .filter((p) => p.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt);

    const limited = args.limit ? active.slice(0, args.limit) : active;

    // Resolve image URLs
    const productsWithUrls = await Promise.all(
      limited.map(async (product) => ({
        ...product,
        images: await resolveImageUrls(ctx, product.images),
      }))
    );

    return productsWithUrls;
  },
});

export const getNewArrivals = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_created")
      .order("desc")
      .collect();

    const active = products.filter((p) => p.status === "active");
    const limited = args.limit ? active.slice(0, args.limit) : active;

    // Resolve image URLs
    const productsWithUrls = await Promise.all(
      limited.map(async (product) => ({
        ...product,
        images: await resolveImageUrls(ctx, product.images),
      }))
    );

    return productsWithUrls;
  },
});

export const getRelated = query({
  args: { productId: v.id("products"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", product.categoryId))
      .collect();

    const related = products
      .filter((p) => p._id !== args.productId && p.status === "active")
      .sort((a, b) => b.createdAt - a.createdAt);

    const limited = args.limit ? related.slice(0, args.limit) : related;

    // Resolve image URLs
    const productsWithUrls = await Promise.all(
      limited.map(async (product) => ({
        ...product,
        images: await resolveImageUrls(ctx, product.images),
      }))
    );

    return productsWithUrls;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    categoryId: v.id("categories"),
    type: v.union(v.literal("unique"), v.literal("stock")),
    quantity: v.number(),
    brand: v.optional(v.string()),
    condition: v.union(
      v.literal("new"),
      v.literal("like-new"),
      v.literal("good"),
      v.literal("fair")
    ),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      sold: 0,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.array(v.string()),
    categoryId: v.id("categories"),
    type: v.union(v.literal("unique"), v.literal("stock")),
    quantity: v.number(),
    brand: v.optional(v.string()),
    condition: v.union(
      v.literal("new"),
      v.literal("like-new"),
      v.literal("good"),
      v.literal("fair")
    ),
    featured: v.boolean(),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("hidden")
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("products"),
    status: v.union(
      v.literal("active"),
      v.literal("sold"),
      v.literal("hidden")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(args.id, { featured: !product.featured });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// For admin dashboard stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();

    return {
      total: products.length,
      active: products.filter((p) => p.status === "active").length,
      sold: products.filter((p) => p.status === "sold").length,
      lowStock: products.filter(
        (p) => p.status === "active" && p.quantity <= 1 && p.type === "stock"
      ).length,
    };
  },
});
