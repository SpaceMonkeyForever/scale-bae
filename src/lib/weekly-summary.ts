export interface WeeklySummaryData {
  weekNumber: number;
  entriesThisWeek: number;
  startWeight: number | null;
  endWeight: number;
  weeklyChange: number | null;
  unit: "lb" | "kg";
  quote: string;
  displayName: string;
}

// Quotes for good progress (lost weight this week)
const GOOD_PROGRESS_QUOTES = [
  "{name}, you absolutely crushed it this week! Your dedication is inspiring.",
  "Look at you go, {name}! This week was all about making progress.",
  "{name}, your effort this week has been incredible. So proud of you!",
  "What a week, {name}! You're making it happen.",
  "{name}, you're proving that small steps lead to big changes. Amazing work!",
  "This week belonged to you, {name}! Keep riding this wave of success.",
  "{name}, your determination is beautiful. Another powerful week in the books!",
];

// Quotes for steady week (maintained weight)
const STEADY_QUOTES = [
  "{name}, consistency is your superpower. Another week in the books!",
  "Staying steady is still winning, {name}. You're building lifelong habits.",
  "{name}, maintaining is progress too! Keep it up.",
  "Not every week is about the scale, {name}. Your commitment is what matters.",
  "{name}, you're playing the long game and that's exactly right. Keep going!",
  "Another week of dedication, {name}! The results will follow your effort.",
  "{name}, your consistency speaks volumes. This journey is a marathon, not a sprint.",
];

// Quotes for challenging week (gained weight)
const CHALLENGING_QUOTES = [
  "{name}, every week teaches us something. You're still showing up!",
  "Progress isn't always linear, {name}. What matters is you're still here!",
  "{name}, some weeks are harder than others. Your persistence is beautiful.",
  "Hey {name}, one week doesn't define your journey. Tomorrow is a fresh start!",
  "{name}, the scale is just one measure. Your commitment to tracking is the real win.",
  "{name}, your resilience is showing. Keep trusting the process!",
  "Not every chapter is easy, {name}. But you're still writing your story!",
];

// Quotes when there's only one entry this week (no comparison possible)
const SINGLE_ENTRY_QUOTES = [
  "{name}, week {week} is in the books! Every entry counts.",
  "Another week, another step forward, {name}! Keep tracking.",
  "{name}, you checked in this week and that's what matters!",
  "Week {week} complete, {name}! You're staying on top of it.",
];

function getRandomQuote(quotes: string[], displayName: string, weekNumber?: number): string {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return quote
    .replace(/{name}/g, displayName)
    .replace(/{week}/g, String(weekNumber || 1));
}

export interface WeeklyCheckInput {
  weights: Array<{
    weight: number;
    unit: "lb" | "kg";
    recordedAt: Date | string;
  }>;
  displayName?: string;
  lastWeeklySummaryWeek?: number; // Last week number when summary was shown
}

export function checkForWeeklySummary(
  input: WeeklyCheckInput
): WeeklySummaryData | null {
  const { weights, displayName = "babe", lastWeeklySummaryWeek = 0 } = input;

  if (weights.length === 0) return null;

  // Sort weights by date (oldest first to find the first entry)
  const sortedWeights = [...weights]
    .map((w) => ({
      ...w,
      recordedAt: typeof w.recordedAt === "string" ? new Date(w.recordedAt) : w.recordedAt,
    }))
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  const firstEntryDate = sortedWeights[0].recordedAt;
  const now = new Date();

  // Calculate how many complete weeks have passed since the first entry
  const msSinceFirst = now.getTime() - firstEntryDate.getTime();
  const daysSinceFirst = Math.floor(msSinceFirst / (1000 * 60 * 60 * 24));
  const completedWeeks = Math.floor(daysSinceFirst / 7);

  // Only show if we've completed at least 1 week and haven't shown this week's summary yet
  if (completedWeeks < 1) return null;
  if (lastWeeklySummaryWeek >= completedWeeks) return null;

  // Get the week boundaries for the just-completed week
  const weekEndDate = new Date(firstEntryDate);
  weekEndDate.setDate(weekEndDate.getDate() + completedWeeks * 7);
  weekEndDate.setHours(23, 59, 59, 999);

  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekStartDate.getDate() - 7);
  weekStartDate.setHours(0, 0, 0, 0);

  // Get entries from the completed week
  const weekEntries = sortedWeights.filter(
    (w) => w.recordedAt >= weekStartDate && w.recordedAt <= weekEndDate
  );

  // Need at least one entry in the week to show a summary
  if (weekEntries.length === 0) return null;

  // Sort week entries by date (oldest to newest)
  weekEntries.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  const entriesThisWeek = weekEntries.length;
  const endWeight = weekEntries[weekEntries.length - 1].weight;
  const unit = weekEntries[weekEntries.length - 1].unit;

  // Calculate change if we have more than one entry
  let startWeight: number | null = null;
  let weeklyChange: number | null = null;

  if (weekEntries.length > 1) {
    startWeight = weekEntries[0].weight;
    weeklyChange = endWeight - startWeight;
  }

  // Select quote category based on progress
  let quotes: string[];
  if (weeklyChange === null) {
    quotes = SINGLE_ENTRY_QUOTES;
  } else if (weeklyChange < -0.1) {
    quotes = GOOD_PROGRESS_QUOTES;
  } else if (weeklyChange > 0.5) {
    quotes = CHALLENGING_QUOTES;
  } else {
    quotes = STEADY_QUOTES;
  }

  return {
    weekNumber: completedWeeks,
    entriesThisWeek,
    startWeight,
    endWeight,
    weeklyChange,
    unit,
    quote: getRandomQuote(quotes, displayName, completedWeeks),
    displayName,
  };
}
