import { v4 as uuidv4 } from "uuid";
import { getAchievementsByUserId, createAchievement, getWeightsByUserId } from "@/db/queries";
import { ACHIEVEMENT_TYPES, UnlockedAchievement } from "./achievement-types";

// Re-export types for convenience
export { ACHIEVEMENT_TYPES, type AchievementType, type UnlockedAchievement } from "./achievement-types";

function hasConsecutiveDays(dates: Date[], requiredDays: number): boolean {
  if (dates.length < requiredDays) return false;

  // Sort dates descending (most recent first)
  const sortedDates = [...dates].sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  for (let i = 1; i < sortedDates.length && streak < requiredDays; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];

    // Check if dates are on consecutive days
    const diffDays = Math.floor(
      (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      streak++;
    } else if (diffDays > 1) {
      streak = 1; // Reset streak
    }
    // diffDays === 0 means same day, don't count but continue
  }

  return streak >= requiredDays;
}

export async function checkForNewAchievements(
  userId: string,
  newWeight: number,
  unit: "lb" | "kg",
  goalWeight: number | null
): Promise<UnlockedAchievement[]> {
  const existingAchievements = await getAchievementsByUserId(userId);
  const existingTypes = new Set(existingAchievements.map((a) => a.type));

  const weights = await getWeightsByUserId(userId);
  const newAchievements: UnlockedAchievement[] = [];

  // Helper to check and unlock achievement
  const tryUnlock = async (typeId: string): Promise<boolean> => {
    if (existingTypes.has(typeId)) return false;

    const type = ACHIEVEMENT_TYPES[typeId];
    if (!type) return false;

    await createAchievement({
      id: uuidv4(),
      userId,
      type: typeId,
    });

    newAchievements.push({
      type,
      unlockedAt: new Date(),
    });

    return true;
  };

  // Check: First weigh-in (award if user has any weights and doesn't have it yet)
  if (weights.length >= 1) {
    await tryUnlock("first_weigh_in");
  }

  // Check: Entry count milestones
  if (weights.length >= 10) {
    await tryUnlock("entries_10");
  }
  if (weights.length >= 30) {
    await tryUnlock("entries_30");
  }

  // Check: 7-day streak
  const dates = weights.map((w) => new Date(w.recordedAt));
  if (hasConsecutiveDays(dates, 7)) {
    await tryUnlock("streak_7");
  }

  // Check: Goal reached
  if (goalWeight && newWeight <= goalWeight) {
    await tryUnlock("goal_reached");
  }

  // Check: Weight loss milestones
  if (weights.length >= 2) {
    // Get the oldest weight (starting weight)
    const startWeight = weights[weights.length - 1].weight;
    const totalLost = startWeight - newWeight;

    // Convert to kg for comparison
    const lostInKg = unit === "kg" ? totalLost : totalLost / 2.20462;

    if (lostInKg >= 5) {
      await tryUnlock("down_5");
    }
    if (lostInKg >= 10) {
      await tryUnlock("down_10");
    }
  }

  return newAchievements;
}

export async function getUserAchievements(
  userId: string
): Promise<UnlockedAchievement[]> {
  const achievements = await getAchievementsByUserId(userId);

  return achievements.map((a) => ({
    type: ACHIEVEMENT_TYPES[a.type] || {
      id: a.type,
      name: a.type,
      description: "",
      emoji: "🏅",
    },
    unlockedAt: new Date(a.unlockedAt),
  }));
}
