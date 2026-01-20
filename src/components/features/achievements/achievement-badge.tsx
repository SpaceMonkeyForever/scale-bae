"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { AchievementType } from "@/lib/achievement-types";

interface AchievementBadgeProps {
  achievement: AchievementType;
  unlocked: boolean;
  unlockedAt?: Date;
  size?: "sm" | "md" | "lg";
}

export function AchievementBadge({
  achievement,
  unlocked,
  unlockedAt,
  size = "md",
}: AchievementBadgeProps) {
  const sizeMap = {
    sm: 64,
    md: 80,
    lg: 96,
  };

  const imageSize = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-1" data-testid="achievement-badge">
      <div
        className={cn(
          "flex items-center justify-center rounded-full transition-all overflow-hidden",
          size === "sm" && "w-16 h-16",
          size === "md" && "w-20 h-20",
          size === "lg" && "w-24 h-24",
          unlocked
            ? "bg-gradient-to-br from-lavender-100 to-bae-100 border-2 border-lavender-300 shadow-bae"
            : "bg-bae-100 border-2 border-bae-200 grayscale opacity-50"
        )}
        title={unlocked ? `Unlocked: ${achievement.description}` : `Locked: ${achievement.description}`}
      >
        <Image
          src={achievement.image}
          alt={achievement.name}
          width={imageSize}
          height={imageSize}
          className={cn("object-cover", !unlocked && "opacity-50")}
        />
      </div>
      <span
        className={cn(
          "text-xs font-medium text-center",
          unlocked ? "text-bae-700" : "text-bae-400"
        )}
      >
        {achievement.name}
      </span>
      {unlocked && unlockedAt && (
        <span className="text-[10px] text-bae-500">
          {unlockedAt.toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
