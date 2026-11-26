const dayInMilliseconds = 86_400_000;

export function weighInMilestones(dates: Date[], timeZone = "UTC") {
  const options = { year: "numeric", month: "numeric", day: "numeric" } as const;
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone });
  } catch {
    formatter = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
  }

  // Compare calendar dates in the logger's time zone, including across DST changes.
  const days = new Set(dates.map(date => {
    const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
    return Date.UTC(+parts.year, +parts.month - 1, +parts.day) / dayInMilliseconds;
  }));
  let longestStreak = 0;
  let streak = 0;
  let hasComeback = false;
  let previousDay: number | undefined;
  for (const day of [...days].sort((a, b) => a - b)) {
    streak = previousDay !== undefined && day === previousDay + 1 ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
    if (previousDay !== undefined && day - previousDay >= 8) hasComeback = true;
    previousDay = day;
  }
  return { longestStreak, hasComeback };
}
