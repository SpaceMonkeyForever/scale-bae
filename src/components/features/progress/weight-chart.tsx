"use client";

import { forwardRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useReducedMotion } from "motion/react";
import { format } from "date-fns";

interface WeightChartProps {
  data: Array<{ date: Date; weight: number }>;
  goalWeight?: number;
  unit: "lb" | "kg";
}

export const WeightChart = forwardRef<HTMLDivElement, WeightChartProps>(
  function WeightChart({ data, goalWeight, unit }, ref) {
  const reducedMotion = useReducedMotion();
  const chartData = data.map((d) => ({
    date: format(d.date, "MMM d"),
    weight: d.weight,
    fullDate: format(d.date, "MMM d, yyyy"),
  }));

  const weights = data.map((d) => d.weight);
  // Include goal weight in min/max calculation so it's always visible
  const allValues = goalWeight ? [...weights, goalWeight] : weights;
  const minWeight = Math.min(...allValues);
  const maxWeight = Math.max(...allValues);
  const range = maxWeight - minWeight;
  // Round domain to nice values (whole numbers or 0.5)
  const roundToHalf = (n: number) => Math.round(n * 2) / 2;
  const padding = Math.max(range * 0.1, 2);
  const domainMin = roundToHalf(minWeight - padding);
  const domainMax = roundToHalf(maxWeight + padding);

  // Generate nice tick values (whole numbers or 0.5 increments)
  const tickCount = 5;
  const tickStep = roundToHalf((domainMax - domainMin) / (tickCount - 1)) || 1;
  const ticks: number[] = [];
  for (let t = domainMin; t <= domainMax + 0.01; t += tickStep) {
    ticks.push(roundToHalf(t));
  }

  if (data.length === 0) {
    return (
      <div ref={ref} data-testid="weight-chart" className="flex flex-col items-center justify-center h-[300px] text-bae-500">
        <div className="text-4xl mb-2">📊</div>
        <p>No data yet. Log your first weight!</p>
      </div>
    );
  }

  return (
    <div ref={ref} data-testid="weight-chart" className="bg-white p-2 rounded-lg">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 16, left: 0, bottom: 5 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 5" stroke="#e5dfea" />
          <XAxis
            dataKey="date"
            stroke="#514662"
            tick={{ fill: "#514662", fontSize: 12 }}
            tickLine={{ stroke: "#e5dfea" }}
          />
          <YAxis
            stroke="#514662"
            tick={{ fill: "#514662", fontSize: 12 }}
            tickLine={{ stroke: "#e5dfea" }}
            domain={[domainMin, domainMax]}
            ticks={ticks}
            tickFormatter={(value) => `${value}`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#faf8ff",
              border: "1px solid #e5dfea",
              borderRadius: "1rem",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#514662", fontWeight: 600 }}
            formatter={(value) => [`${value} ${unit}`, "Weight"]}
            labelFormatter={(_, payload) =>
              payload[0]?.payload?.fullDate || ""
            }
          />
          {goalWeight && (
            <ReferenceLine
              y={goalWeight}
              stroke="#A855F7"
              strokeDasharray="5 5"
              label={{
                value: `Goal: ${goalWeight} ${unit}`,
                fill: "#A855F7",
                fontSize: 12,
                position: "insideBottomRight",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#8653bd"
            strokeWidth={3}
            dot={{ fill: "#8653bd", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#593885" }}
            isAnimationActive={!reducedMotion}
            animationDuration={750}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
