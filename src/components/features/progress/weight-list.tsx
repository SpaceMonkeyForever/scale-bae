"use client";

import { useEffect, useRef, useState } from "react";
import { AchievementArt } from "@/components/features/achievements/achievement-art";
import { motion, useReducedMotion } from "motion/react";
import { cn, formatRelativeDate, weightChange } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UnlockedAchievement } from "@/lib/achievement-types";

const HISTORY_BATCH_SIZE = 10;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: (index % HISTORY_BATCH_SIZE) * 0.04, duration: 0.28, ease: "easeOut" as const },
  }),
};

interface WeightEntry {
  id: string;
  weight: number;
  unit: "lb" | "kg";
  recordedAt: Date;
  note?: string | null;
}

interface WeightListProps {
  entries: WeightEntry[];
  achievements?: UnlockedAchievement[];
  onDelete: (id: string) => Promise<void>;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function WeightList({ entries, achievements = [], onDelete }: WeightListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(HISTORY_BATCH_SIZE);
  const firstRevealedEntry = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    firstRevealedEntry.current?.focus();
  }, [visibleCount]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  // Get achievements unlocked on a specific date
  const getAchievementsForDate = (date: Date): UnlockedAchievement[] => {
    return achievements.filter((a) => isSameDay(a.unlockedAt, date));
  };

  if (entries.length === 0) {
    return (
      <div data-testid="weight-list" className="text-center py-8 text-bae-500">
        No entries yet. Start logging your weight!
      </div>
    );
  }

  return (
    <div data-testid="weight-list" className="space-y-2">
      {entries.slice(0, visibleCount).map((entry, index) => {
        const prevEntry = entries[index + 1];
        const change = prevEntry ? weightChange(entry, prevEntry) : null;
        const dayAchievements = getAchievementsForDate(entry.recordedAt);
        const firstRevealed = visibleCount > HISTORY_BATCH_SIZE && index === visibleCount - HISTORY_BATCH_SIZE;

        return (
          <motion.div
            key={entry.id}
            ref={firstRevealed ? firstRevealedEntry : undefined}
            tabIndex={firstRevealed ? -1 : undefined}
            custom={index}
            variants={itemVariants}
            initial={reducedMotion ? false : "hidden"}
            animate="visible"
            data-testid="weight-list-item"
            className="flex items-center justify-between p-4 bg-white rounded-[var(--radius-bae)] border border-bae-100 hover:border-bae-200 transition-colors scroll-mt-28"
          >
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-bae-700">
                {entry.weight.toFixed(1)} {entry.unit}
              </div>
              {change !== null && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    change < 0 ? "text-mint-500" : "text-bae-500"
                  )}
                >
                  {change > 0 ? "+" : ""}
                  {change.toFixed(1)}
                </span>
              )}
              {dayAchievements.length > 0 && (
                <div className="flex gap-1">
                  {dayAchievements.map((a) => (
                    <AchievementArt
                      key={a.type.id}
                      achievement={a.type}
                      title={a.type.name}
                      size={24}
                      className="overflow-hidden rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-bae-500">
                {formatRelativeDate(entry.recordedAt)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                data-testid="delete-weight-button"
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="text-bae-400 hover:text-red-500 hover:bg-red-50"
                aria-label={`Delete entry from ${formatRelativeDate(entry.recordedAt)}`}
              >
                {deletingId === entry.id ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                )}
              </Button>
            </div>
          </motion.div>
        );
      })}
      {entries.length > visibleCount && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <p className="text-sm text-bae-600">Showing {visibleCount} of {entries.length} weigh-ins</p>
          <Button variant="secondary" onClick={() => setVisibleCount((count) => count + HISTORY_BATCH_SIZE)}>
            Show older weigh-ins
          </Button>
        </div>
      )}
    </div>
  );
}
