"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dropzone } from "@/components/features/upload/dropzone";
import { ImagePreview } from "@/components/features/upload/image-preview";
import { JournalCover } from "@/components/layout/journal-cover";
import Image from "next/image";
import { compressImage } from "@/lib/image-compression";

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
  const [userName, setUserName] = useState<string | undefined>();

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setUserName(data.user?.displayName || data.user?.username);
      })
      .catch(() => {});
  }, []);

  const handleFileSelect = async (file: File) => {
    setError(null);
    setIsLoading(true);

    // Create preview from original file
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      // Compress image before upload for better performance
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
      });

      const formData = new FormData();
      formData.append("image", compressedFile);

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
    } catch {
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
    <div className="upload-layout">
      <JournalCover page="upload" />
      <section className="upload-panel" aria-label="Upload a scale photo">
        {error && (
          <div role="alert" data-testid="upload-error" className="mb-4 p-4 rounded-[var(--radius-bae)] bg-red-50 border border-red-200 text-red-700 text-center">
            {error}
            <button
              onClick={handleRetake}
              className="block mx-auto mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {preview && isLoading ? (
          <div className="scale-scan" role="status" data-testid="upload-loading">
            <div className="scan-photo">
              <Image src={preview} alt="Selected scale photo" fill unoptimized sizes="240px" />
              <span aria-hidden="true" />
            </div>
            <p>Reading your scale…</p>
          </div>
        ) : preview ? (
          <ImagePreview src={preview} onRetake={handleRetake} />
        ) : (
          <Dropzone onFileSelect={handleFileSelect} isLoading={isLoading} name={userName} />
        )}
      </section>
    </div>
  );
}
