"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WeightChart } from "@/components/features/progress/weight-chart";
import { StatsSummary } from "@/components/features/progress/stats-summary";
import { WeightList } from "@/components/features/progress/weight-list";
import { GoalSetter } from "@/components/features/progress/goal-setter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface WeightEntry {
  id: string;
  weight: number;
  unit: "lb" | "kg";
  recordedAt: string;
  note?: string | null;
}

type TimeRange = "1w" | "1m" | "3m" | "all";

export default function ProgressPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goalWeight, setGoalWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("1m");

  useEffect(() => {
    fetchWeights();
    fetchPreferences();
  }, []);

  const fetchWeights = async () => {
    try {
      const res = await fetch("/api/weights");
      const data = await res.json();
      setEntries(data.weights || []);
    } catch (error) {
      console.error("Failed to fetch weights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/preferences");
      const data = await res.json();
      setGoalWeight(data.preferences?.goalWeight || null);
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    }
  };

  const handleSaveGoal = async (goal: number | null) => {
    const res = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalWeight: goal }),
    });
    if (!res.ok) {
      throw new Error("Failed to save goal");
    }
    setGoalWeight(goal);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/weights/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Failed to delete weight:", error);
    }
  };

  const filterByTimeRange = (entries: WeightEntry[]) => {
    const now = new Date();
    const cutoff = new Date();

    switch (timeRange) {
      case "1w":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "1m":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "3m":
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case "all":
      default:
        return entries;
    }

    return entries.filter((e) => new Date(e.recordedAt) >= cutoff);
  };

  const filteredEntries = filterByTimeRange(entries);
  const chartData = filteredEntries
    .map((e) => ({
      date: new Date(e.recordedAt),
      weight: e.weight,
    }))
    .reverse();

  const currentWeight = entries[0]?.weight;
  const startWeight = entries[entries.length - 1]?.weight;
  const unit = entries[0]?.unit || "lb";

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: "1w", label: "1 Week" },
    { value: "1m", label: "1 Month" },
    { value: "3m", label: "3 Months" },
    { value: "all", label: "All Time" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-bae-200 border-t-bae-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bae-800">Your Progress</h1>
        <Link href="/upload">
          <Button>Log Weight</Button>
        </Link>
      </div>

      <GoalSetter
        currentGoal={goalWeight}
        unit={unit}
        onSave={handleSaveGoal}
      />

      <StatsSummary
        currentWeight={currentWeight}
        startWeight={startWeight}
        goalWeight={goalWeight ?? undefined}
        unit={unit}
        totalEntries={entries.length}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Weight Over Time</CardTitle>
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 ${
                  timeRange === range.value
                    ? "bg-bae-500 text-white"
                    : "bg-bae-100 text-bae-600 hover:bg-bae-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <WeightChart data={chartData} unit={unit} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightList
            entries={filteredEntries.map((e) => ({
              ...e,
              recordedAt: new Date(e.recordedAt),
            }))}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
