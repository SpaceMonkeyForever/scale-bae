import { CelebrationData } from "@/components/features/celebration/celebration-modal";

// Milestones in kg (every 2.5kg below 60kg)
const KG_MILESTONES = [60, 57.5, 55, 52.5, 50, 47.5, 45, 42.5, 40];
// Convert to lb equivalents (rough)
const LB_MILESTONES = KG_MILESTONES.map(kg => Math.round(kg * 2.20462));

function getMilestones(unit: "lb" | "kg"): number[] {
  return unit === "kg" ? KG_MILESTONES : LB_MILESTONES;
}

function crossedMilestone(
  prevWeight: number | null,
  newWeight: number,
  unit: "lb" | "kg"
): number | null {
  if (!prevWeight) return null;

  const milestones = getMilestones(unit);

  // Find any milestone that we crossed (went from above to at/below)
  for (const milestone of milestones) {
    if (prevWeight > milestone && newWeight <= milestone) {
      return milestone;
    }
  }

  return null;
}

const ENCOURAGEMENT_MESSAGES = [
  "You're doing amazing! Every step counts.",
  "Look at you go! Your consistency is paying off.",
  "That's the spirit! Keep up the great work.",
  "You're on fire! Nothing can stop you now.",
  "Incredible progress! You should be so proud.",
  "Yes queen! You're absolutely crushing it.",
  "Your dedication is inspiring! Keep shining.",
  "Way to go! You're becoming the best version of yourself.",
];

const MILESTONE_MESSAGES = [
  "This is HUGE! You've hit a major milestone!",
  "What an achievement! You're officially in new territory!",
  "You did it! This milestone was waiting for you!",
  "Incredible! You've unlocked a new chapter in your journey!",
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function checkForCelebration(
  newWeight: number,
  unit: "lb" | "kg",
  previousWeight: number | null,
  goalWeight: number | null
): CelebrationData | null {
  // Priority 1: Goal reached!
  if (goalWeight && newWeight <= goalWeight) {
    return {
      type: "goal_reached",
      title: "You Did It!",
      message: `You've reached your goal of ${goalWeight} ${unit}! This is an incredible achievement. All your hard work and dedication has paid off. Time to celebrate and maybe set a new goal!`,
      unit,
    };
  }

  // Priority 2: Milestone crossed
  const milestone = crossedMilestone(previousWeight, newWeight, unit);
  if (milestone) {
    return {
      type: "milestone",
      title: "Milestone Reached!",
      message: getRandomMessage(MILESTONE_MESSAGES),
      milestone,
      unit,
    };
  }

  // Priority 3: Weight loss from last entry
  if (previousWeight && newWeight < previousWeight) {
    const weightLost = previousWeight - newWeight;
    const formattedLoss = weightLost.toFixed(1);

    return {
      type: "weight_loss",
      title: "Nice Progress!",
      message: `Wow, you lost ${formattedLoss} ${unit} since last time! ${getRandomMessage(ENCOURAGEMENT_MESSAGES)}`,
      weightLost,
      unit,
    };
  }

  return null;
}
