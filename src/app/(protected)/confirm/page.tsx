"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightDisplay } from "@/components/features/weight/weight-display";
import { WeightEdit } from "@/components/features/weight/weight-edit";
import { CelebrationModal, CelebrationData } from "@/components/features/celebration/celebration-modal";
import { checkForCelebration } from "@/lib/celebrations";

interface PendingWeight {
  weight: number;
  unit: "lb" | "kg";
  confidence: "high" | "medium" | "low";
  rawText: string;
  imagePreview: string;
}

interface UserData {
  previousWeight: number | null;
  goalWeight: number | null;
}

export default function ConfirmPage() {
  const router = useRouter();
  const [pendingWeight, setPendingWeight] = useState<PendingWeight | null>(null);
  const [userData, setUserData] = useState<UserData>({ previousWeight: null, goalWeight: null });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState("");
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingWeight");
    if (!stored) {
      router.push("/upload");
      return;
    }
    setPendingWeight(JSON.parse(stored));
    fetchUserData();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const [weightsRes, prefsRes] = await Promise.all([
        fetch("/api/weights"),
        fetch("/api/preferences"),
      ]);
      const weightsData = await weightsRes.json();
      const prefsData = await prefsRes.json();

      setUserData({
        previousWeight: weightsData.weights?.[0]?.weight || null,
        goalWeight: prefsData.preferences?.goalWeight || null,
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  const handleSave = async () => {
    if (!pendingWeight) return;

    setIsSaving(true);

    try {
      const res = await fetch("/api/weights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: pendingWeight.weight,
          unit: pendingWeight.unit,
          recordedAt: new Date().toISOString(),
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save weight");
      }

      sessionStorage.removeItem("pendingWeight");

      // Check for celebration
      const celebrationData = checkForCelebration(
        pendingWeight.weight,
        pendingWeight.unit,
        userData.previousWeight,
        userData.goalWeight
      );

      if (celebrationData) {
        setCelebration(celebrationData);
        setIsSaving(false);
      } else {
        router.push("/progress");
      }
    } catch (error) {
      console.error("Save error:", error);
      setIsSaving(false);
    }
  };

  const handleCelebrationClose = () => {
    setCelebration(null);
    router.push("/progress");
  };

  const handleEdit = (weight: number, unit: "lb" | "kg") => {
    setPendingWeight((prev) =>
      prev ? { ...prev, weight, unit, confidence: "high" } : null
    );
    setIsEditing(false);
  };

  const handleCancel = () => {
    sessionStorage.removeItem("pendingWeight");
    router.push("/upload");
  };

  if (!pendingWeight) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-bae-200 border-t-bae-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Confirm Your Weight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {pendingWeight.imagePreview && (
            <div className="relative w-32 h-32 mx-auto rounded-[var(--radius-bae)] overflow-hidden border-2 border-bae-200">
              <Image
                src={pendingWeight.imagePreview}
                alt="Your scale reading"
                fill
                className="object-cover"
              />
            </div>
          )}

          {isEditing ? (
            <WeightEdit
              initialWeight={pendingWeight.weight}
              initialUnit={pendingWeight.unit}
              onSave={handleEdit}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              <WeightDisplay
                weight={pendingWeight.weight}
                unit={pendingWeight.unit}
                confidence={pendingWeight.confidence}
              />

              <button
                onClick={() => setIsEditing(true)}
                className="w-full text-center text-bae-600 text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 rounded"
              >
                Not right? Edit manually
              </button>

              <div className="space-y-2">
                <label
                  htmlFor="note"
                  className="block text-sm font-medium text-bae-700"
                >
                  Add a note (optional)
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="How are you feeling today?"
                  className="w-full h-20 px-4 py-2 rounded-[var(--radius-bae)] border border-bae-200 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 focus-visible:ring-offset-2"
                  maxLength={500}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CelebrationModal
        celebration={celebration}
        onClose={handleCelebrationClose}
      />
    </div>
  );
}
