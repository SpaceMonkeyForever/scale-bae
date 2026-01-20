"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Confetti } from "./confetti";
import { ShareButton } from "./share-button";

export interface CelebrationData {
  type: "weight_loss" | "milestone" | "goal_reached";
  title: string;
  message: string;
  weightLost?: number;
  milestone?: number;
  unit: "lb" | "kg";
  currentWeight?: number;
  goalWeight?: number;
}

interface CelebrationModalProps {
  celebration: CelebrationData | null;
  imageDataUrl?: string;
  onClose: () => void;
}

export function CelebrationModal({ celebration, imageDataUrl, onClose }: CelebrationModalProps) {
  const isMilestone = celebration?.type === "milestone" || celebration?.type === "goal_reached";

  return (
    <AnimatePresence>
      {celebration && (
        <>
          <Confetti isActive={isMilestone} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
            onClick={onClose}
          >
            <motion.div
              data-testid="celebration-modal"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`
                relative max-w-sm w-full rounded-2xl p-6 text-center
                ${celebration.type === "goal_reached"
                  ? "bg-gradient-to-br from-yellow-100 via-bae-100 to-lavender-100"
                  : celebration.type === "milestone"
                  ? "bg-gradient-to-br from-lavender-100 to-bae-100"
                  : "bg-white"
                }
              `}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="text-6xl mb-4"
              >
                {celebration.type === "goal_reached" ? "🏆" :
                 celebration.type === "milestone" ? "🎉" : "✨"}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-bae-800 mb-2"
              >
                {celebration.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-bae-600 mb-6 leading-relaxed"
              >
                {celebration.message}
              </motion.p>

              {celebration.type === "milestone" && celebration.milestone && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-block bg-lavender-200 text-lavender-700 px-4 py-2 rounded-full font-bold mb-4"
                >
                  {celebration.milestone} {celebration.unit}
                </motion.div>
              )}

              {celebration.type === "goal_reached" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="inline-block bg-yellow-200 text-yellow-700 px-4 py-2 rounded-full font-bold mb-4"
                >
                  Goal Achieved!
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-3"
              >
                {celebration.currentWeight && (
                  <ShareButton
                    weight={celebration.currentWeight}
                    unit={celebration.unit}
                    imageDataUrl={imageDataUrl}
                    celebrationType={celebration.type}
                    milestone={celebration.milestone}
                    goalWeight={celebration.goalWeight}
                    className="w-full"
                  />
                )}
                <Button data-testid="celebration-close" onClick={onClose} className="w-full">
                  {celebration.type === "goal_reached" ? "Celebrate!" : "Keep Going!"}
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
