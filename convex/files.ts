import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    // If it's already a URL, return as-is
    if (args.storageId.startsWith("http")) {
      return args.storageId;
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getUrls = query({
  args: { storageIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map((id) => {
        // If it's already a URL, return as-is
        if (id.startsWith("http")) {
          return id;
        }
        return ctx.storage.getUrl(id);
      })
    );
    return urls.filter((url): url is string => url !== null);
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
  },
});
