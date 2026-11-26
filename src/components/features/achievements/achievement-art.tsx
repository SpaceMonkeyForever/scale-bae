import Image from "next/image";
import type { AchievementType } from "@/lib/achievement-types";
import { cn } from "@/lib/utils";

interface AchievementArtProps {
  achievement: AchievementType;
  size: number;
  className?: string;
  title?: string;
}

export function AchievementArt({ achievement, size, className, title }: AchievementArtProps) {
  return (
    <picture
      className={cn("block max-h-full max-w-full", className)}
      style={{ width: size, height: size }}
      title={title}
    >
      {achievement.animation && (
        <source media="(prefers-reduced-motion: no-preference)" type="image/webp" srcSet={achievement.animation} />
      )}
      <Image src={achievement.image} alt={achievement.name} width={size} height={size} className="size-full object-contain" />
    </picture>
  );
}
