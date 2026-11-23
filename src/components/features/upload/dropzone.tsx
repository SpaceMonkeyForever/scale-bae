"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  name?: string;
}

export function Dropzone({ onFileSelect, isLoading, name }: DropzoneProps) {
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
      if (!isLoading && file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect, isLoading]
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
      data-dragging={isDragging}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "upload-well relative flex flex-col items-center justify-center w-full min-h-[300px] p-8",
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
        capture="environment"
        onChange={handleFileInput}
        className="absolute z-10 inset-0 w-full h-full opacity-0 cursor-pointer"
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
            className="animate-[float_3s_ease-in-out_infinite]"
          />
          <p className="text-bae-600 font-medium">Reading your scale...</p>
        </div>
      ) : (
        <>
          <span className="camera-tile" aria-hidden="true">
            <svg width="38" height="38" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 10h6l2-4h8l2 4h6v16H4z" strokeLinejoin="round" />
              <circle cx="16" cy="17" r="5" />
            </svg>
          </span>
          <h2>{isDragging ? "Drop your photo" : "Add a scale photo"}</h2>
          <p>{name ? `Ready, ${name}? ` : ""}Drag a photo here or use your camera.</p>
          <span className="photo-action">Choose photo</span>
          <small>JPEG, PNG, WebP or GIF</small>
        </>
      )}
    </div>
  );
}
