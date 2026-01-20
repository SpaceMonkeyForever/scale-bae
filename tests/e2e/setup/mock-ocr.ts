import { Page, HTTPRequest } from "puppeteer";

export interface MockOCRResponse {
  weight?: number;
  unit?: "lb" | "kg";
  confidence?: "high" | "medium" | "low";
  rawText?: string;
  error?: string;
}

type RequestHandler = (request: HTTPRequest) => void;

const requestHandlers = new WeakMap<Page, RequestHandler>();

export async function mockOCRResponse(
  page: Page,
  response: MockOCRResponse
): Promise<void> {
  // Remove any existing handler
  await clearOCRMock(page);

  await page.setRequestInterception(true);

  const handler: RequestHandler = (request) => {
    if (request.url().includes("/api/ocr")) {
      request.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    } else {
      request.continue();
    }
  };

  requestHandlers.set(page, handler);
  page.on("request", handler);
}

export async function clearOCRMock(page: Page): Promise<void> {
  const existingHandler = requestHandlers.get(page);
  if (existingHandler) {
    page.off("request", existingHandler);
    requestHandlers.delete(page);
  }

  try {
    await page.setRequestInterception(false);
  } catch {
    // May already be false
  }
}

// Pre-built mock responses
export const OCR_RESPONSES = {
  valid: (weight: number, unit: "lb" | "kg" = "lb"): MockOCRResponse => ({
    weight,
    unit,
    confidence: "high",
    rawText: `${weight} ${unit}`,
  }),

  lowConfidence: (weight: number, unit: "lb" | "kg" = "lb"): MockOCRResponse => ({
    weight,
    unit,
    confidence: "low",
    rawText: `~${weight}`,
  }),

  mediumConfidence: (weight: number, unit: "lb" | "kg" = "lb"): MockOCRResponse => ({
    weight,
    unit,
    confidence: "medium",
    rawText: `${weight}?`,
  }),

  failure: (error = "Could not read scale display"): MockOCRResponse => ({
    error,
  }),
};

// Alternative approach: bypass OCR by setting sessionStorage directly
export async function setPendingWeight(
  page: Page,
  weight: number,
  unit: "lb" | "kg",
  confidence: "high" | "medium" | "low" = "high"
): Promise<void> {
  await page.evaluate(
    (data) => {
      sessionStorage.setItem("pendingWeight", JSON.stringify(data));
    },
    {
      weight,
      unit,
      confidence,
      rawText: `${weight} ${unit}`,
      // Minimal 1x1 transparent PNG as placeholder image
      imagePreview:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    }
  );
}

export async function clearPendingWeight(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.removeItem("pendingWeight");
  });
}
