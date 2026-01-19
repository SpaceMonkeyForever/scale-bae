"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImagePreviewProps {
  src: string;
  onRetake: () => void;
}

export function ImagePreview({ src, onRetake }: ImagePreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md aspect-square rounded-[var(--radius-bae)] overflow-hidden border-2 border-bae-200 shadow-[var(--shadow-bae)]">
        <Image
          src={src}
          alt="Preview of uploaded scale image"
          fill
          className="object-contain bg-white"
        />
      </div>
      <Button variant="secondary" onClick={onRetake}>
        Take Another Photo
      </Button>
    </div>
  );
}
