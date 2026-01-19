"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface GoalSetterProps {
  currentGoal: number | null;
  unit: "lb" | "kg";
  onSave: (goal: number | null) => Promise<void>;
}

export function GoalSetter({ currentGoal, unit, onSave }: GoalSetterProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [goalValue, setGoalValue] = useState(currentGoal?.toString() || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const value = goalValue.trim() === "" ? null : parseFloat(goalValue);
      await onSave(value);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save goal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setGoalValue(currentGoal?.toString() || "");
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Card className="p-4 bg-gradient-to-r from-lavender-100 to-bae-100 border-lavender-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/unicorns/2.png"
              alt=""
              width={80}
              height={80}
              className="animate-[float_3s_ease-in-out_infinite]"
            />
            <div>
              <div className="text-sm font-medium text-lavender-600">Goal Weight</div>
              <div className="text-xl font-bold text-bae-700">
                {currentGoal ? `${currentGoal} ${unit}` : "Not set"}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            {currentGoal ? "Edit" : "Set Goal"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-lavender-100 to-bae-100 border-lavender-200">
      <div className="space-y-3">
        <div className="text-sm font-medium text-lavender-600">Set Your Goal Weight</div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={goalValue}
            onChange={(e) => setGoalValue(e.target.value)}
            placeholder="Enter goal weight"
            className="w-32"
            min="0"
            max="1000"
            step="0.1"
          />
          <span className="text-bae-600 font-medium">{unit}</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          {currentGoal && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setGoalValue("");
                onSave(null);
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="text-bae-600"
            >
              Clear Goal
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
