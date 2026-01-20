export interface AchievementType {
  id: string;
  name: string;
  description: string;
  image: string;
}

export const ACHIEVEMENT_TYPES: Record<string, AchievementType> = {
  first_weigh_in: {
    id: "first_weigh_in",
    name: "First Steps",
    description: "Log your first weight",
    image: "/unicorns/first-steps.png",
  },
  streak_7: {
    id: "streak_7",
    name: "Week Warrior",
    description: "Log weight 7 days in a row",
    image: "/unicorns/warrior.png",
  },
  entries_10: {
    id: "entries_10",
    name: "Dedicated",
    description: "Log 10 weight entries",
    image: "/unicorns/dedicated.png",
  },
  entries_30: {
    id: "entries_30",
    name: "Consistent",
    description: "Log 30 weight entries",
    image: "/unicorns/consistent.png",
  },
  goal_reached: {
    id: "goal_reached",
    name: "Goal Getter",
    description: "Reach your goal weight",
    image: "/unicorns/goal-setter.png",
  },
  down_5: {
    id: "down_5",
    name: "Down 5",
    description: "Lose 5 kg (or 11 lb)",
    image: "/unicorns/down-5kg.png",
  },
  down_10: {
    id: "down_10",
    name: "Down 10",
    description: "Lose 10 kg (or 22 lb)",
    image: "/unicorns/down-10kg.png",
  },
};

export interface UnlockedAchievement {
  type: AchievementType;
  unlockedAt: Date;
}
