"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/features/upload/dropzone";
import { ImagePreview } from "@/components/features/upload/image-preview";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface OCRResult {
  success: boolean;
  weight?: number;
  unit?: "lb" | "kg";
  confidence?: "high" | "medium" | "low";
  rawText?: string;
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsLoading(true);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const result: OCRResult = await res.json();

      if (!res.ok || !result.success) {
        setError(result.error || "Failed to read weight from image");
        setIsLoading(false);
        return;
      }

      // Store result and navigate to confirm page
      sessionStorage.setItem(
        "pendingWeight",
        JSON.stringify({
          weight: result.weight,
          unit: result.unit,
          confidence: result.confidence,
          rawText: result.rawText,
          imagePreview: previewUrl,
        })
      );

      router.push("/confirm");
    } catch (err) {
      setError("Failed to process image. Please try again.");
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Log Your Weight</CardTitle>
          <CardDescription>
            Take a photo of your scale and I'll read it for you
          </CardDescription>
        </CardHeader>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 rounded-[var(--radius-bae)] bg-red-50 border border-red-200 text-red-700 text-center">
              {error}
              <button
                onClick={handleRetake}
                className="block mx-auto mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {preview && !isLoading ? (
            <ImagePreview src={preview} onRetake={handleRetake} />
          ) : (
            <Dropzone onFileSelect={handleFileSelect} isLoading={isLoading} />
          )}
        </div>
      </Card>
    </div>
  );
}
