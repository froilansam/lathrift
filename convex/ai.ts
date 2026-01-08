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

// Convert bytes to base64 (no Buffer in Convex runtime)
function bytesToBase64(bytes: Uint8Array): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? chars[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < len ? chars[b3 & 63] : "=";
  }

  return result;
}

// Fetch image and convert to base64
async function imageUrlToBase64(
  url: string
): Promise<{ base64: string; mediaType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = bytesToBase64(bytes);

  // Get media type from Content-Type header
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const mediaType = contentType.split(";")[0].trim();

  return { base64, mediaType };
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

    // Limit to first 4 images for API efficiency
    const imageIds = args.storageIds.slice(0, 4);

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

    // Convert images to base64 for Claude API
    const imageContents = await Promise.all(
      imageUrls.map(async (url) => {
        const { base64, mediaType } = await imageUrlToBase64(url);
        return {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: mediaType,
            data: base64,
          },
        };
      })
    );

    // Build category list for the prompt
    const categoryList = args.existingCategories.map((c) => c.name).join(", ");

    // System prompt for thrift store analysis
    const systemPrompt = `You are an expert thrift store product analyst specializing in vintage and second-hand clothing, accessories, and goods.
Your task is to analyze product images and provide detailed information for an online thrift store listing.

Available categories: ${categoryList}

IMPORTANT: You must respond ONLY with valid JSON in this exact format (no markdown, no code blocks, just pure JSON):
{
  "suggestedName": "Short, catchy product title (e.g., 'Vintage Nike Windbreaker', 'Y2K Graphic Tee')",
  "description": "Detailed product description including style, material observations, notable features, and any unique selling points. Write in a friendly, engaging tone suitable for a thrift store. 2-4 sentences.",
  "brand": "Brand name if visible/identifiable, or null if unknown",
  "suggestedCategory": "Exact match from available categories listed above",
  "condition": "new|like-new|good|fair",
  "conditionNotes": "Brief notes on condition: any visible wear, stains, or defects. If item looks good, say so."
}`;

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
