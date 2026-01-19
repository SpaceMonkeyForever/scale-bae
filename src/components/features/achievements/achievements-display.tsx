"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AchievementBadge } from "./achievement-badge";
import { ACHIEVEMENT_TYPES, UnlockedAchievement } from "@/lib/achievement-types";

interface AchievementsDisplayProps {
  unlockedAchievements: UnlockedAchievement[];
}

export function AchievementsDisplay({ unlockedAchievements }: AchievementsDisplayProps) {
  const unlockedSet = new Set(unlockedAchievements.map((a) => a.type.id));
  const allAchievements = Object.values(ACHIEVEMENT_TYPES);

  const getUnlockedAt = (typeId: string) => {
    const found = unlockedAchievements.find((a) => a.type.id === typeId);
    return found?.unlockedAt;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Achievements</span>
          <span className="text-sm font-normal text-bae-500">
            {unlockedAchievements.length}/{allAchievements.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {allAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={unlockedSet.has(achievement.id)}
              unlockedAt={getUnlockedAt(achievement.id)}
              size="sm"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
