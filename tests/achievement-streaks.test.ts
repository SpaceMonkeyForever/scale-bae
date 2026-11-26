import test from "node:test";
import assert from "node:assert/strict";
import { weighInMilestones } from "../src/lib/achievement-streaks";

test("daily weigh-ins cross months, with duplicate days and varying times", () => {
  const dates = Array.from({ length: 30 }, (_, i) => new Date(Date.UTC(2026, 0, 24 + i, i % 2 ? 1 : 23)));
  for (const days of [6, 7, 13, 14, 29, 30]) {
    const sample = [dates[0], ...dates.slice(0, days)].reverse();
    assert.deepEqual(weighInMilestones(sample), { longestStreak: days, hasComeback: false });
  }
  assert.equal(weighInMilestones(dates.filter((_, i) => i !== 9)).longestStreak, 20);
});

test("streaks follow the logger's midnight and daylight saving changes", () => {
  const nearMidnight = ["2026-06-01T15:55:00Z", "2026-06-01T16:05:00Z"].map(s => new Date(s));
  assert.equal(weighInMilestones(nearMidnight, "Asia/Makassar").longestStreak, 2);
  assert.equal(weighInMilestones(nearMidnight, "UTC").longestStreak, 1);
  const spring = ["2026-03-07T16:00:00Z", "2026-03-08T15:00:00Z", "2026-03-09T15:00:00Z"];
  assert.equal(weighInMilestones(spring.map(s => new Date(s)), "America/New_York").longestStreak, 3);
});

test("Comeback requires a weigh-in on both sides of seven empty calendar days", () => {
  const first = new Date("2026-11-01T12:00:00Z");
  assert.deepEqual(weighInMilestones([]), { longestStreak: 0, hasComeback: false });
  assert.equal(weighInMilestones([first]).hasComeback, false);
  assert.equal(weighInMilestones([first, new Date("2026-11-08T23:59:59Z")]).hasComeback, false);
  assert.equal(weighInMilestones([first, new Date("2026-11-09T00:00:00Z")]).hasComeback, true);
});
