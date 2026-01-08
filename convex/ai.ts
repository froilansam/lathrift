import { v } from "convex/values";
import { action } from "./_generated/server";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

// Type for the AI analysis result
interface AIAnalysisResult {
  suggestedName: string;
  description: string;
  brand: string | null;
  suggestedCategory: string;
  condition: "new" | "like-new" | "good" | "fair";
  conditionNotes: string;
}

// Analyze product images using Claude Vision
export const analyzeProductImages = action({
  args: {
    storageIds: v.array(v.string()),
    existingCategories: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<AIAnalysisResult> => {
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Please add it to your Convex environment variables."
      );
    }

    if (args.storageIds.length === 0) {
      throw new Error("At least one image is required for analysis");
    }

    // Limit to first 2 images for efficiency
    const imageIds = args.storageIds.slice(0, 2);

    // Get URLs for storage IDs
    const imageUrls: string[] = [];
    for (const storageId of imageIds) {
      if (storageId.startsWith("http")) {
        imageUrls.push(storageId);
      } else {
        const url = await ctx.storage.getUrl(storageId);
        if (url) imageUrls.push(url);
      }
    }

    if (imageUrls.length === 0) {
      throw new Error("Could not resolve any image URLs");
    }

    // Use URL-based image source (more memory efficient than base64)
    const imageContents = imageUrls.map((url) => ({
      type: "image" as const,
      source: {
        type: "url" as const,
        url: url,
      },
    }));

    // Build category list for the prompt
    const categoryList = args.existingCategories.map((c) => c.name).join(", ");

    // System prompt for thrift store analysis
    const systemPrompt = `You are an expert thrift store product analyst specializing in vintage and second-hand clothing, accessories, and goods.
Your task is to analyze product images and provide detailed information for an online thrift store listing.

Available categories: ${categoryList}

IMPORTANT RULES:
1. For clothing items (shirts, pants, jackets, etc.), LOOK FOR SIZE TAGS OR LABELS in the images. If you can see a size tag (S, M, L, XL, or numeric sizes), include it in the description. If no size tag is visible, DO NOT guess the size - just don't mention size at all.
2. Only state facts you can actually see in the images. Never guess or assume.
3. If brand is not clearly visible, set it to null.

You must respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "suggestedName": "Short, catchy product title (e.g., 'Vintage Nike Windbreaker', 'Y2K Graphic Tee')",
  "description": "1-2 sentences about the item. End with: Size: [size or 'Not visible'] | Color: [color]",
  "brand": "Brand name if visible/identifiable, or null if unknown",
  "suggestedCategory": "Exact match from available categories listed above",
  "condition": "new|like-new|good|fair",
  "conditionNotes": "Brief notes on condition: any visible wear, stains, or defects. If item looks good, say so."
}

Example description: "Classic crew neck t-shirt with a vintage graphic print on front. Soft cotton material in great condition. Size: L | Color: Navy Blue"`;

    // Build message content with images and text
    const userContent = [
      ...imageContents,
      {
        type: "text" as const,
        text: "Please analyze these thrift store product images and provide the product details in JSON format. Focus on what would help sell this item.",
      },
    ];

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Anthropic API error:", error);
        throw new Error("Failed to analyze images. Please try again.");
      }

      const data = await response.json();
      const textContent = data.content.find(
        (c: { type: string }) => c.type === "text"
      );

      if (!textContent?.text) {
        throw new Error("No response from AI");
      }

      // Parse JSON from response (handle potential markdown code blocks)
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const analysis = JSON.parse(jsonStr) as AIAnalysisResult;

      // Validate condition is one of the allowed values
      const validConditions = ["new", "like-new", "good", "fair"];
      if (!validConditions.includes(analysis.condition)) {
        analysis.condition = "good"; // Default fallback
      }

      // Ensure brand is null if empty string
      if (analysis.brand === "") {
        analysis.brand = null;
      }

      return analysis;
    } catch (error) {
      console.error("AI analysis error:", error);
      if (error instanceof SyntaxError) {
        throw new Error(
          "Failed to parse AI response. Please try again."
        );
      }
      throw error instanceof Error
        ? error
        : new Error("Failed to analyze product images. Please try again.");
    }
  },
});
