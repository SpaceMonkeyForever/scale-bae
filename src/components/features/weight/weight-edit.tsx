"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface WeightEditProps {
  initialWeight: number;
  initialUnit: "lb" | "kg";
  onSave: (weight: number, unit: "lb" | "kg") => void;
  onCancel: () => void;
}

export function WeightEdit({
  initialWeight,
  initialUnit,
  onSave,
  onCancel,
}: WeightEditProps) {
  const [weight, setWeight] = useState(initialWeight.toString());
  const [unit, setUnit] = useState<"lb" | "kg">(initialUnit);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numWeight = parseFloat(weight);
    if (!isNaN(numWeight) && numWeight > 0) {
      onSave(numWeight, unit);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="weight">Weight</Label>
        <Input
          id="weight"
          data-testid="weight-input"
          type="number"
          step="0.1"
          min="0"
          max="1000"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="text-center text-2xl h-14"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label>Unit</Label>
        <div data-testid="unit-select" className="flex gap-2">
          {(["lb", "kg"] as const).map((u) => (
            <button
              key={u}
              type="button"
              data-testid={`unit-${u}`}
              onClick={() => setUnit(u)}
              className={cn(
                "flex-1 py-3 rounded-[var(--radius-bae)] font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 focus-visible:ring-offset-2",
                unit === u
                  ? "bg-bae-500 text-white"
                  : "bg-bae-100 text-bae-600 hover:bg-bae-200"
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1" data-testid="edit-cancel-button">
          Cancel
        </Button>
        <Button type="submit" className="flex-1" data-testid="edit-save-button">
          Save
        </Button>
      </div>
    </form>
  );
}
