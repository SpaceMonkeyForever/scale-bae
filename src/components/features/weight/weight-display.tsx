"use client";

import { cn } from "@/lib/utils";

interface WeightDisplayProps {
  weight: number;
  unit: "lb" | "kg";
  confidence?: "high" | "medium" | "low";
  className?: string;
}

export function WeightDisplay({
  weight,
  unit,
  confidence,
  className,
}: WeightDisplayProps) {
  return (
    <div className={cn("text-center", className)}>
      <div className="text-7xl font-bold text-bae-700 animate-[slide-up_200ms_ease-out]">
        {weight.toFixed(1)}
      </div>
      <div className="text-2xl text-bae-500 font-medium">{unit}</div>
      {confidence && (
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium",
            confidence === "high" && "bg-mint-100 text-mint-500",
            confidence === "medium" && "bg-cream-200 text-bae-700",
            confidence === "low" && "bg-red-100 text-red-600"
          )}
        >
          {confidence === "high" && "High confidence"}
          {confidence === "medium" && "Check this looks right"}
          {confidence === "low" && "Please verify"}
        </div>
      )}
    </div>
  );
}
