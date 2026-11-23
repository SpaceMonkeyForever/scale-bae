"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { subMonths, subWeeks } from "date-fns";
import { Button } from "@/components/ui/button";
import { Toast, ToastDescription, ToastProvider, ToastViewport } from "@/components/ui/toast";
import { formatDate, weightChange, weightInUnit } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { WeightChart } from "@/components/features/progress/weight-chart";
import { StatsSummary } from "@/components/features/progress/stats-summary";
import { WeightList } from "@/components/features/progress/weight-list";
import { GoalSetter } from "@/components/features/progress/goal-setter";
import { ShareProgress } from "@/components/features/progress/share-progress";
import { AchievementsDisplay } from "@/components/features/achievements/achievements-display";
import { JournalCover } from "@/components/layout/journal-cover";
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
  const [goal, setGoal] = useState<{ weight: number; unit: "lb" | "kg" } | null>(null);
  const [deletions, setDeletions] = useState<{ entry: WeightEntry; token: string }[]>([]);
  const [deleteError, setDeleteError] = useState("");
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setTimeRange] = useState<TimeRange | null>(null);
  const allTimeButton = useRef<HTMLButtonElement>(null);
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
      const prefs = data.preferences;
      setGoal(prefs?.goalWeight != null ? { weight: prefs.goalWeight, unit: prefs.goalUnit ?? prefs.preferredUnit } : null);
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

  const handleSaveGoal = async (value: number | null) => {
    const res = await fetch("/api/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalWeight: value, goalUnit: unit }),
    });
    if (!res.ok) {
      throw new Error("Failed to save goal");
    }
    setGoal(value === null ? null : { weight: value, unit });
  };

  const handleDelete = async (id: string) => {
    const entry = entries.find((item) => item.id === id);
    if (!entry) return;
    setDeleteError("");
    try {
      const res = await fetch(`/api/weights/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      const { undoToken } = await res.json();
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setDeletions((prev) => [...prev, { entry, token: undoToken }]);
    } catch {
      setDeleteError("Couldn’t delete the weigh-in. Refresh to check your history.");
    }
  };

  const dismissDeletion = (id: string) => setDeletions((prev) => prev.filter(({ entry }) => entry.id !== id));

  const undoDelete = async (entry: WeightEntry, token: string) => {
    try {
      const res = await fetch(`/api/weights/${entry.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ undoToken: token }),
      });
      if (res.status === 410) {
        dismissDeletion(entry.id);
        setDeleteError("The time to undo this deletion has passed.");
        return;
      }
      if (!res.ok) throw new Error();
      setEntries((prev) => [...prev.filter((e) => e.id !== entry.id), entry]
        .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt)));
      dismissDeletion(entry.id);
      setDeleteError("");
    } catch {
      setDeleteError("Couldn’t restore the weigh-in. Try Undo again.");
    }
  };

  const latestEntry = entries[0];
  const unit = latestEntry?.unit ?? goal?.unit ?? "lb";
  const goalWeight = goal ? weightInUnit(goal, unit) : null;
  const now = new Date();
  const cutoffs = { "1w": subWeeks(now, 1), "1m": subMonths(now, 1), "3m": subMonths(now, 3) };
  const defaultRange = latestEntry && new Date(latestEntry.recordedAt) < cutoffs["1m"] ? "all" : "1m";
  const timeRange = selectedRange ?? defaultRange;
  const filteredEntries = timeRange === "all"
    ? entries
    : entries.filter((entry) => new Date(entry.recordedAt) >= cutoffs[timeRange]);
  const chartData = filteredEntries
    .map((e) => ({
      date: new Date(e.recordedAt),
      weight: weightInUnit(e, unit),
    }))
    .reverse();

  const currentWeight = latestEntry?.weight;
  const previousEntry = entries[1];
  const firstEntry = entries[entries.length - 1];
  const startWeight = firstEntry ? weightInUnit(firstEntry, unit) : undefined;

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
    <div className="progress-layout space-y-6">
      <ToastProvider duration={10000}>
        {deletions.map(({ entry, token }) => (
          <Toast key={token} onOpenChange={(open) => { if (!open) dismissDeletion(entry.id); }}>
            <ToastDescription>Deleted {entry.weight} {entry.unit} · {formatDate(new Date(entry.recordedAt))}</ToastDescription>
            <Button variant="secondary" size="sm" onClick={() => undoDelete(entry, token)}>Undo</Button>
          </Toast>
        ))}
        {deleteError && <Toast variant="error" onOpenChange={(open) => { if (!open) setDeleteError(""); }}>
          <ToastDescription>{deleteError}</ToastDescription>
        </Toast>}
        <ToastViewport className="gap-2 empty:hidden" />
      </ToastProvider>
      <div className="progress-cover">
        <JournalCover page="progress" />
        <Link href="/upload" className="progress-log">Log weight</Link>
      </div>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <StatsSummary
          currentWeight={currentWeight}
          latestRecordedAt={latestEntry?.recordedAt}
          previousWeight={previousEntry ? weightInUnit(previousEntry, unit) : undefined}
          previousRecordedAt={previousEntry?.recordedAt}
          change={latestEntry && previousEntry ? weightChange(latestEntry, previousEntry) : undefined}
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
        <Card>
          <CardHeader className="flex flex-wrap gap-3 items-center justify-between">
            <CardTitle>Weight Over Time</CardTitle>
            <div className="flex flex-wrap gap-1" aria-label="Chart time range" role="group">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  ref={range.value === "all" ? allTimeButton : undefined}
                  aria-pressed={timeRange === range.value}
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
            {entries.length > 0 && chartData.length === 0 ? (
              <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-bae-700">
                <p role="status">No weigh-ins in this period.</p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTimeRange("all");
                    allTimeButton.current?.focus({ preventScroll: true });
                  }}
                >
                  View all time
                </Button>
              </div>
            ) : (
              <WeightChart key={timeRange} ref={chartRef} data={chartData} unit={unit} goalWeight={goalWeight ?? undefined} />
            )}
          </CardContent>
        </Card>
      </motion.div>

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

      <AchievementsDisplay unlockedAchievements={achievements} />

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
              entries={entries.map((e) => ({
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
