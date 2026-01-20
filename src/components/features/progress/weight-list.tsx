"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { formatRelativeDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UnlockedAchievement } from "@/lib/achievement-types";

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2 },
  },
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
    <motion.div
      data-testid="weight-list"
      className="space-y-2"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {entries.map((entry, index) => {
        const prevEntry = entries[index + 1];
        const change = prevEntry ? entry.weight - prevEntry.weight : null;
        const dayAchievements = getAchievementsForDate(entry.recordedAt);

        return (
          <motion.div
            key={entry.id}
            variants={itemVariants}
            data-testid="weight-list-item"
            className="flex items-center justify-between p-4 bg-white rounded-[var(--radius-bae)] border border-bae-100 hover:border-bae-200 transition-colors"
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
                    <Image
                      key={a.type.id}
                      src={a.type.image}
                      alt={a.type.name}
                      title={a.type.name}
                      width={24}
                      height={24}
                      className="rounded-full"
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
    </motion.div>
  );
}
