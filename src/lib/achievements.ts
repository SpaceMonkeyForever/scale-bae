import { v4 as uuidv4 } from "uuid";
import { getAchievementsByUserId, createAchievement, getWeightsByUserId } from "@/db/queries";
import { ACHIEVEMENT_TYPES, UnlockedAchievement } from "./achievement-types";
import { convertWeight } from "./utils";
import { weighInMilestones } from "./achievement-streaks";

// Re-export types for convenience
export { ACHIEVEMENT_TYPES, type AchievementType, type UnlockedAchievement } from "./achievement-types";

export async function checkForNewAchievements(
  userId: string,
  newWeight: number,
  unit: "lb" | "kg",
  goalWeight: number | null,
  timeZone = "UTC"
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

    const created = await createAchievement({
      id: uuidv4(),
      userId,
      type: typeId,
    });
    if (!created) return false;

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

  const { longestStreak, hasComeback } = weighInMilestones(weights.map(w => w.recordedAt), timeZone);
  for (const days of [7, 14, 30]) {
    if (longestStreak >= days) await tryUnlock(`streak_${days}`);
  }
  if (hasComeback) await tryUnlock("comeback");

  // Check: Goal reached
  if (goalWeight && newWeight <= goalWeight) {
    await tryUnlock("goal_reached");
  }

  // Check: Weight loss milestones
  if (weights.length >= 2) {
    // Get the oldest weight (starting weight)
    const first = weights[weights.length - 1];
    const lostInKg = convertWeight(first.weight, first.unit, "kg") - convertWeight(newWeight, unit, "kg");

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
