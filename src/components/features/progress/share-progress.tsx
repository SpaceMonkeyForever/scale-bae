"use client";

import { useState } from "react";
import Image from "next/image";
import html2canvas from "html2canvas";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ShareProgressProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  currentWeight?: number;
  startWeight?: number;
  goalWeight?: number;
  unit: "lb" | "kg";
  totalEntries: number;
}

function getProgressMessage(
  currentWeight: number | undefined,
  startWeight: number | undefined,
  goalWeight: number | undefined,
  unit: string,
  totalEntries: number
): string {
  const parts: string[] = [];

  if (currentWeight) {
    parts.push(`Currently at ${currentWeight} ${unit}`);
  }

  if (startWeight && currentWeight && startWeight !== currentWeight) {
    const change = startWeight - currentWeight;
    if (change > 0) {
      parts.push(`Down ${change.toFixed(1)} ${unit} so far!`);
    }
  }

  if (goalWeight && currentWeight) {
    if (currentWeight <= goalWeight) {
      parts.push(`Goal of ${goalWeight} ${unit} reached!`);
    } else {
      const remaining = currentWeight - goalWeight;
      parts.push(`${remaining.toFixed(1)} ${unit} to go`);
    }
  }

  if (totalEntries > 1) {
    parts.push(`${totalEntries} weigh-ins tracked`);
  }

  return parts.length > 0 ? parts.join(". ") : "Tracking my progress!";
}

async function canvasToFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], "my-progress.png", { type: "image/png" }));
    }, "image/png");
  });
}

export function ShareProgress({
  chartRef,
  currentWeight,
  startWeight,
  goalWeight,
  unit,
  totalEntries,
}: ShareProgressProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const message = getProgressMessage(
        currentWeight,
        startWeight,
        goalWeight,
        unit,
        totalEntries
      );

      // Try to capture the chart
      let imageFile: File | undefined;
      if (chartRef.current) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            backgroundColor: "#ffffff",
            scale: 2, // Higher resolution
          });
          imageFile = await canvasToFile(canvas);
        } catch (e) {
          console.log("Could not capture chart:", e);
        }
      }

      // Check if Web Share API is supported
      if (!navigator.share) {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(message);
        alert("Progress copied to clipboard!");
        return;
      }

      const shareData: ShareData = {
        title: "My Progress",
        text: message,
      };

      // Try to share with image if available
      if (imageFile && navigator.canShare) {
        const dataWithFile = { ...shareData, files: [imageFile] };
        if (navigator.canShare(dataWithFile)) {
          shareData.files = [imageFile];
        }
      }

      await navigator.share(shareData);
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const isDisabled = totalEntries === 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Image
            src="/unicorns/3.png"
            alt=""
            width={60}
            height={60}
            className="flex-shrink-0"
          />
          <button
            onClick={handleShare}
            disabled={isSharing || isDisabled}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[var(--radius-bae)] font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 focus-visible:ring-offset-2",
              isDisabled
                ? "bg-bae-100 text-bae-400 cursor-not-allowed"
                : "bg-bae-500 text-white hover:bg-bae-600"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {isSharing ? "Sharing..." : "Share Progress"}
          </button>
        </div>
        {isDisabled && (
          <p className="text-xs text-bae-500 text-center mt-2">
            Log your first weight to share
          </p>
        )}
      </CardContent>
    </Card>
  );
}
