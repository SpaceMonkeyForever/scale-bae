"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeightDisplay } from "@/components/features/weight/weight-display";
import { WeightEdit } from "@/components/features/weight/weight-edit";
import { CelebrationModal, CelebrationData } from "@/components/features/celebration/celebration-modal";
import { ShareButton } from "@/components/features/celebration/share-button";
import { AchievementUnlockedModal } from "@/components/features/achievements/achievement-unlocked-modal";
import { checkForCelebration } from "@/lib/celebrations";
import { UnlockedAchievement, ACHIEVEMENT_TYPES } from "@/lib/achievement-types";

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
  displayName: string | null;
}

export default function ConfirmPage() {
  const router = useRouter();
  const [pendingWeight, setPendingWeight] = useState<PendingWeight | null>(null);
  const [userData, setUserData] = useState<UserData>({ previousWeight: null, goalWeight: null, displayName: null });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [note, setNote] = useState("");
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<UnlockedAchievement[]>([]);
  const [savedWeight, setSavedWeight] = useState<{ weight: number; unit: "lb" | "kg"; imagePreview?: string } | null>(null);

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
      const [weightsRes, prefsRes, userRes] = await Promise.all([
        fetch("/api/weights"),
        fetch("/api/preferences"),
        fetch("/api/user"),
      ]);
      const weightsData = await weightsRes.json();
      const prefsData = await prefsRes.json();
      const userData = await userRes.json();

      setUserData({
        previousWeight: weightsData.weights?.[0]?.weight || null,
        goalWeight: prefsData.preferences?.goalWeight || null,
        displayName: userData.user?.displayName || null,
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

      // Save the weight info for the share button (including image)
      setSavedWeight({
        weight: pendingWeight.weight,
        unit: pendingWeight.unit,
        imagePreview: pendingWeight.imagePreview,
      });

      // Check for new achievements
      const achievementsRes = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: pendingWeight.weight,
          unit: pendingWeight.unit,
          goalWeight: userData.goalWeight,
        }),
      });
      const achievementsData = await achievementsRes.json();
      const newAchievements: UnlockedAchievement[] = (achievementsData.newAchievements || []).map(
        (a: { type: { id: string }; unlockedAt: string }) => ({
          type: ACHIEVEMENT_TYPES[a.type.id] || a.type,
          unlockedAt: new Date(a.unlockedAt),
        })
      );

      // Check for celebration
      const celebrationData = checkForCelebration(
        pendingWeight.weight,
        pendingWeight.unit,
        userData.previousWeight,
        userData.goalWeight,
        userData.displayName || undefined
      );

      // Store achievements to show (after celebration if there is one)
      setPendingAchievements(newAchievements);

      if (celebrationData) {
        setCelebration(celebrationData);
      } else if (newAchievements.length > 0) {
        // No celebration, show first achievement directly
        // (achievements will be shifted when modal closes)
      }
      // Otherwise just show the "Weight Saved!" screen
      setIsSaving(false);
    } catch (error) {
      console.error("Save error:", error);
      setIsSaving(false);
    }
  };

  const handleCelebrationClose = () => {
    setCelebration(null);
    // If there are pending achievements, they'll show next
    // Otherwise navigate to progress
    if (pendingAchievements.length === 0) {
      router.push("/progress");
    }
  };

  const handleAchievementClose = () => {
    // Remove the first achievement and show next one, or navigate away
    setPendingAchievements((prev) => prev.slice(1));
    if (pendingAchievements.length <= 1) {
      router.push("/progress");
    }
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Image
          src="/unicorns/1.png"
          alt=""
          width={120}
          height={120}
          className="animate-[float_3s_ease-in-out_infinite]"
        />
        <p className="text-bae-600 font-medium">Loading...</p>
      </div>
    );
  }

  // Show saved state with share option (when saved but no celebration or achievement modal)
  if (savedWeight && !celebration && pendingAchievements.length === 0) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Weight Saved!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <Image
              src="/unicorns/4.png"
              alt=""
              width={100}
              height={100}
              className="mx-auto animate-[bounce-soft_2s_ease-in-out_infinite]"
            />
            <div className="text-3xl font-bold text-bae-700">
              {savedWeight.weight} {savedWeight.unit}
            </div>
            <p className="text-bae-600">Your weight has been logged.</p>

            <div className="space-y-3">
              <ShareButton
                weight={savedWeight.weight}
                unit={savedWeight.unit}
                imageDataUrl={savedWeight.imagePreview}
                className="w-full"
              />
              <Button onClick={() => router.push("/progress")} className="w-full">
                View Progress
              </Button>
            </div>
          </CardContent>
        </Card>
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
        imageDataUrl={savedWeight?.imagePreview}
        onClose={handleCelebrationClose}
      />

      <AchievementUnlockedModal
        achievement={!celebration && pendingAchievements.length > 0 ? pendingAchievements[0] : null}
        onClose={handleAchievementClose}
      />
    </div>
  );
}
