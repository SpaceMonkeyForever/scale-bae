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
import { format } from "date-fns";

interface WeightChartProps {
  data: Array<{ date: Date; weight: number }>;
  goalWeight?: number;
  unit: "lb" | "kg";
}

export const WeightChart = forwardRef<HTMLDivElement, WeightChartProps>(
  function WeightChart({ data, goalWeight, unit }, ref) {
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
  const padding = (maxWeight - minWeight) * 0.1 || 5;

  if (data.length === 0) {
    return (
      <div ref={ref} className="flex flex-col items-center justify-center h-[300px] text-bae-500">
        <div className="text-4xl mb-2">📊</div>
        <p>No data yet. Log your first weight!</p>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white p-2 rounded-lg">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#FFD6E0" />
          <XAxis
            dataKey="date"
            stroke="#9A2D47"
            tick={{ fill: "#9A2D47", fontSize: 12 }}
            tickLine={{ stroke: "#FFD6E0" }}
          />
          <YAxis
            stroke="#9A2D47"
            tick={{ fill: "#9A2D47", fontSize: 12 }}
            tickLine={{ stroke: "#FFD6E0" }}
            domain={[minWeight - padding, maxWeight + padding]}
            tickFormatter={(value) => `${value}`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFF5F7",
              border: "1px solid #FFD6E0",
              borderRadius: "1rem",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#9A2D47", fontWeight: 600 }}
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
                position: "right",
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#FF85A1"
            strokeWidth={3}
            dot={{ fill: "#FF85A1", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: "#FF6B8A" }}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});
