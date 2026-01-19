"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsSummaryProps {
  currentWeight?: number;
  startWeight?: number;
  goalWeight?: number;
  unit: "lb" | "kg";
  totalEntries: number;
}

export function StatsSummary({
  currentWeight,
  startWeight,
  goalWeight,
  unit,
  totalEntries,
}: StatsSummaryProps) {
  const change = currentWeight && startWeight ? currentWeight - startWeight : null;
  const goalProgress =
    currentWeight && startWeight && goalWeight
      ? ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100
      : null;

  const stats = [
    {
      label: "Current",
      value: currentWeight ? `${currentWeight.toFixed(1)} ${unit}` : "-",
      icon: "⚖️",
    },
    {
      label: "Change",
      value: change !== null ? `${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}` : "-",
      icon: change !== null && change < 0 ? "📉" : "📈",
      color: change !== null ? (change < 0 ? "text-mint-500" : "text-bae-600") : undefined,
    },
    {
      label: "Entries",
      value: totalEntries.toString(),
      icon: "📝",
    },
    {
      label: "Goal Progress",
      value:
        goalProgress !== null
          ? `${Math.min(100, Math.max(0, goalProgress)).toFixed(0)}%`
          : "-",
      icon: "🎯",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 text-center">
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className={cn("text-xl font-bold text-bae-700", stat.color)}>
            {stat.value}
          </div>
          <div className="text-sm text-bae-500">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}
