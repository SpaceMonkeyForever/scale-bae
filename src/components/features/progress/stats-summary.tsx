"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 20, stiffness: 300 },
  },
};

interface StatsSummaryProps {
  currentWeight?: number;
  latestRecordedAt?: string;
  startWeight?: number;
  goalWeight?: number;
  unit: "lb" | "kg";
  totalEntries: number;
}

export function StatsSummary({
  currentWeight,
  latestRecordedAt,
  startWeight,
  goalWeight,
  unit,
  totalEntries,
}: StatsSummaryProps) {
  const change = currentWeight && startWeight ? currentWeight - startWeight : null;
  const goalProgress =
    currentWeight && startWeight && goalWeight
      ? startWeight === goalWeight
        ? (currentWeight === goalWeight ? 100 : 0)
        : ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100
      : null;

  const stats = [
    {
      label: "Latest weigh-in",
      detail: latestRecordedAt && <time dateTime={latestRecordedAt}>{formatDate(new Date(latestRecordedAt))}</time>,
      value: currentWeight ? `${currentWeight.toFixed(1)} ${unit}` : "-",
      image: "/unicorns/scales.png",
      testId: "current-weight",
    },
    {
      label: "Change",
      detail: totalEntries > 0 && "Since your first weigh-in",
      value: change !== null ? `${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}` : "-",
      image: "/unicorns/chart.png",
      color: change !== null ? (change < 0 ? "text-mint-500" : "text-bae-600") : undefined,
      testId: "total-change",
    },
    {
      label: "Entries",
      value: totalEntries.toString(),
      image: "/unicorns/note.png",
      testId: "total-entries",
    },
    {
      label: "Goal Progress",
      value:
        goalProgress !== null
          ? `${Math.min(100, Math.max(0, goalProgress)).toFixed(0)}%`
          : "-",
      image: "/unicorns/goal.png",
      testId: "goal-progress",
    },
  ];

  return (
    <motion.div
      data-testid="stats-summary"
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={cardVariants}>
          <Card data-testid={stat.testId} className="journal-stat">
            <Image src={stat.image} width={86} height={86} alt="" sizes="68px" />
            <div>
              <div className="stat-label">{stat.label}</div>
              {stat.detail && <div className="stat-detail">{stat.detail}</div>}
            </div>
            <div className={cn("stat-value", stat.color)}>
              {stat.value}
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
