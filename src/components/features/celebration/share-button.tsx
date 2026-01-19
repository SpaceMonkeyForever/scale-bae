"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  weight: number;
  unit: "lb" | "kg";
  imageDataUrl?: string;
  celebrationType?: "weight_loss" | "milestone" | "goal_reached" | null;
  milestone?: number;
  goalWeight?: number;
  className?: string;
}

function getShareMessage(
  weight: number,
  unit: "lb" | "kg",
  celebrationType?: "weight_loss" | "milestone" | "goal_reached" | null,
  milestone?: number,
  goalWeight?: number
): string {
  if (celebrationType === "goal_reached" && goalWeight) {
    return `I DID IT!! I reached my goal of ${goalWeight} ${unit}! Currently at ${weight} ${unit}. Thank you for everything!!`;
  }
  if (celebrationType === "milestone" && milestone) {
    return `Big news - I hit ${milestone} ${unit}! Can you believe it?! Currently at ${weight} ${unit}!`;
  }
  if (celebrationType === "weight_loss") {
    return `Just logged ${weight} ${unit} today - making progress!`;
  }
  return `Just logged ${weight} ${unit} today.`;
}

function getButtonText(celebrationType?: "weight_loss" | "milestone" | "goal_reached" | null): string {
  if (celebrationType === "goal_reached") {
    return "Share the news! 💕";
  }
  if (celebrationType === "milestone") {
    return "Share this! 🎉";
  }
  return "Share";
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

export function ShareButton({
  weight,
  unit,
  imageDataUrl,
  celebrationType,
  milestone,
  goalWeight,
  className,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const message = getShareMessage(weight, unit, celebrationType, milestone, goalWeight);
  const buttonText = getButtonText(celebrationType);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      // Check if Web Share API is supported
      if (!navigator.share) {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(message);
        alert("Message copied to clipboard!");
        return;
      }

      const shareData: ShareData = {
        title: celebrationType === "goal_reached" ? "Goal Reached!"
             : celebrationType === "milestone" ? "Milestone!"
             : "Weight Update",
        text: message,
      };

      // Try to share with image if available
      if (imageDataUrl && navigator.canShare) {
        try {
          const file = await dataUrlToFile(imageDataUrl, "scale-photo.jpg");
          const dataWithFile = { ...shareData, files: [file] };

          if (navigator.canShare(dataWithFile)) {
            shareData.files = [file];
          }
        } catch (e) {
          console.log("Could not attach image:", e);
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

  const baseClasses = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer";

  const styleClasses = celebrationType === "goal_reached"
    ? "bg-gradient-to-r from-yellow-400 to-bae-400 text-white hover:from-yellow-500 hover:to-bae-500 focus-visible:ring-yellow-500 shadow-lg"
    : celebrationType === "milestone"
    ? "bg-gradient-to-r from-lavender-400 to-bae-400 text-white hover:from-lavender-500 hover:to-bae-500 focus-visible:ring-lavender-500 shadow-lg"
    : "bg-mint-500 text-white hover:bg-mint-600 focus-visible:ring-mint-500";

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={cn(baseClasses, styleClasses, isSharing && "opacity-70", className)}
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
      {isSharing ? "Sharing..." : buttonText}
    </button>
  );
}
