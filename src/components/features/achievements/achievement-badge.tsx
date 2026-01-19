"use client";

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
  const sizeClasses = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex items-center justify-center rounded-full transition-all",
          sizeClasses[size],
          unlocked
            ? "bg-gradient-to-br from-lavender-100 to-bae-100 border-2 border-lavender-300 shadow-bae"
            : "bg-bae-100 border-2 border-bae-200 grayscale opacity-50"
        )}
        title={unlocked ? `Unlocked: ${achievement.description}` : `Locked: ${achievement.description}`}
      >
        <span className={cn(!unlocked && "opacity-50")}>
          {achievement.emoji}
        </span>
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
