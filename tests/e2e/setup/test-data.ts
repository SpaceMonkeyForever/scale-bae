import { randomUUID } from "crypto";

export function generateUniqueUsername(prefix = "test"): string {
  return `${prefix}_${randomUUID().slice(0, 8)}`;
}

export const TEST_PASSWORD = "testpass123";
export const ADMIN_USERNAME = "spacemonkey";
export const ADMIN_PASSWORD = "admin123456";

export const WEIGHT_FIXTURES = {
  // Basic progress data over 30 days
  progressWeights: [
    { weight: 180, unit: "lb" as const, daysAgo: 30 },
    { weight: 178, unit: "lb" as const, daysAgo: 23 },
    { weight: 176, unit: "lb" as const, daysAgo: 16 },
    { weight: 174, unit: "lb" as const, daysAgo: 9 },
    { weight: 172, unit: "lb" as const, daysAgo: 2 },
  ],

  // 7 consecutive days for streak testing
  streakWeights: (startWeight: number) =>
    Array.from({ length: 7 }, (_, i) => ({
      weight: startWeight - i * 0.2,
      unit: "lb" as const,
      daysAgo: 6 - i, // Days 6, 5, 4, 3, 2, 1, 0
    })),

  // 6 consecutive days (one short of streak)
  almostStreakWeights: (startWeight: number) =>
    Array.from({ length: 6 }, (_, i) => ({
      weight: startWeight - i * 0.2,
      unit: "lb" as const,
      daysAgo: 5 - i,
    })),

  // 6 consecutive days for weekly summary testing (user logs 7th)
  weeklySummarySetup: (startWeight: number) =>
    Array.from({ length: 6 }, (_, i) => ({
      weight: startWeight - i * 0.3,
      unit: "lb" as const,
      daysAgo: 6 - i, // Days 6, 5, 4, 3, 2, 1 (user logs day 0)
    })),

  // 13 consecutive days for week 2 testing (user logs 14th)
  twoWeekSummarySetup: (startWeight: number) =>
    Array.from({ length: 13 }, (_, i) => ({
      weight: startWeight - i * 0.2,
      unit: "lb" as const,
      daysAgo: 13 - i,
    })),

  // 10 entries for "Dedicated" achievement
  tenEntries: (startWeight: number) =>
    Array.from({ length: 10 }, (_, i) => ({
      weight: startWeight - i * 0.5,
      unit: "lb" as const,
      daysAgo: 30 - i * 3,
    })),

  // 30 entries for "Consistent" achievement
  thirtyEntries: (startWeight: number) =>
    Array.from({ length: 30 }, (_, i) => ({
      weight: startWeight - i * 0.3,
      unit: "lb" as const,
      daysAgo: 60 - i * 2,
    })),

  // Single entry
  singleEntry: (weight: number, unit: "lb" | "kg" = "lb", daysAgo = 0) => [
    { weight, unit, daysAgo },
  ],

  // Weight loss progression for milestone testing (in kg)
  kgMilestoneWeights: [
    { weight: 62, unit: "kg" as const, daysAgo: 14 },
    { weight: 61, unit: "kg" as const, daysAgo: 7 },
  ],

  // 5kg loss test data
  fiveKgLossWeights: [
    { weight: 80, unit: "kg" as const, daysAgo: 30 },
    { weight: 78, unit: "kg" as const, daysAgo: 20 },
    { weight: 76, unit: "kg" as const, daysAgo: 10 },
  ],

  // 10kg loss test data
  tenKgLossWeights: [
    { weight: 85, unit: "kg" as const, daysAgo: 60 },
    { weight: 80, unit: "kg" as const, daysAgo: 40 },
    { weight: 78, unit: "kg" as const, daysAgo: 20 },
  ],
};

export const ACHIEVEMENT_TYPES = {
  FIRST_WEIGH_IN: "first_weigh_in",
  STREAK_7: "streak_7",
  ENTRIES_10: "entries_10",
  ENTRIES_30: "entries_30",
  GOAL_REACHED: "goal_reached",
  DOWN_5: "down_5",
  DOWN_10: "down_10",
} as const;
