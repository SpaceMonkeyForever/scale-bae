import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface OCRResult {
  success: boolean;
  weight?: number;
  unit?: "lb" | "kg";
  confidence?: "high" | "medium" | "low";
  rawText?: string;
  error?: string;
}

export async function extractWeightFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<OCRResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: `You are analyzing a photo of a weight scale display. Extract the weight shown on the scale.

IMPORTANT INSTRUCTIONS:
1. Look for the main numeric display showing the weight
2. Identify the unit (lb, kg, or st for stones - convert stones to lb)
3. If you see multiple numbers, focus on the largest/primary display
4. Return ONLY a JSON object with no additional text

Response format:
{
  "weight": <number>,
  "unit": "lb" | "kg",
  "confidence": "high" | "medium" | "low",
  "rawText": "<exactly what you see on the display>"
}

If you cannot read the weight clearly, return:
{
  "weight": null,
  "unit": null,
  "confidence": "low",
  "rawText": "<what you can see>",
  "error": "<reason why you couldn't read it>"
}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: "Could not parse response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.weight !== null) {
      return {
        success: true,
        weight: parsed.weight,
        unit: parsed.unit,
        confidence: parsed.confidence,
        rawText: parsed.rawText,
      };
    } else {
      return {
        success: false,
        confidence: parsed.confidence,
        rawText: parsed.rawText,
        error: parsed.error || "Could not extract weight",
      };
    }
  } catch (error) {
    console.error("Claude Vision error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
