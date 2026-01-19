"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export function Dropzone({ onFileSelect, isLoading }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      data-testid="dropzone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[300px] p-8",
        "border-2 border-dashed rounded-[var(--radius-bae)] transition-all duration-200",
        "cursor-pointer",
        isDragging
          ? "border-bae-500 bg-bae-100"
          : "border-bae-300 bg-bae-50 hover:border-bae-400 hover:bg-bae-100",
        isLoading && "pointer-events-none opacity-60"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
        aria-label="Upload an image of your scale"
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/unicorns/1.png"
            alt=""
            width={120}
            height={120}
            className="animate-pulse"
          />
          <p className="text-bae-600 font-medium">Reading your scale...</p>
        </div>
      ) : (
        <>
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold text-bae-800 mb-2">
            Show me your progress, babe!
          </h3>
          <p className="text-bae-600 text-center max-w-xs">
            Drop a photo of your scale here, or tap to take a picture
          </p>
          <p className="text-sm text-bae-500 mt-4">
            Supports JPEG, PNG, WebP, GIF
          </p>
        </>
      )}
    </div>
  );
}
