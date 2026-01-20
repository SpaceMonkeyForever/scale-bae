"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WeightChart } from "@/components/features/progress/weight-chart";
import { StatsSummary } from "@/components/features/progress/stats-summary";
import { WeightList } from "@/components/features/progress/weight-list";
import { GoalSetter } from "@/components/features/progress/goal-setter";
import { ShareProgress } from "@/components/features/progress/share-progress";
import { AchievementsDisplay } from "@/components/features/achievements/achievements-display";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UnlockedAchievement, ACHIEVEMENT_TYPES } from "@/lib/achievement-types";

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

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
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("1m");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWeights();
    fetchPreferences();
    fetchAchievements();
    logProgressView();
  }, []);

  const logProgressView = async () => {
    try {
      await fetch("/api/activity", { method: "POST" });
    } catch {
      // Silently fail - activity logging is non-critical
    }
  };

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

  const fetchAchievements = async () => {
    try {
      const res = await fetch("/api/achievements");
      const data = await res.json();
      const mapped = (data.achievements || []).map((a: { type: { id: string }; unlockedAt: string }) => ({
        type: ACHIEVEMENT_TYPES[a.type.id] || a.type,
        unlockedAt: new Date(a.unlockedAt),
      }));
      setAchievements(mapped);
    } catch (error) {
      console.error("Failed to fetch achievements:", error);
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Image
          src="/unicorns/1.png"
          alt=""
          width={120}
          height={120}
          className="animate-[float_3s_ease-in-out_infinite]"
        />
        <p className="text-bae-600 font-medium">Loading...</p>
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

      <motion.div
        className="grid gap-4 sm:grid-cols-2"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <GoalSetter
          currentGoal={goalWeight}
          unit={unit}
          onSave={handleSaveGoal}
        />
        <ShareProgress
          chartRef={chartRef}
          currentWeight={currentWeight}
          startWeight={startWeight}
          goalWeight={goalWeight ?? undefined}
          unit={unit}
          totalEntries={entries.length}
        />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <StatsSummary
          currentWeight={currentWeight}
          startWeight={startWeight}
          goalWeight={goalWeight ?? undefined}
          unit={unit}
          totalEntries={entries.length}
        />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <AchievementsDisplay unlockedAchievements={achievements} />
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
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
            <WeightChart ref={chartRef} data={chartData} unit={unit} goalWeight={goalWeight ?? undefined} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
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
              achievements={achievements}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
