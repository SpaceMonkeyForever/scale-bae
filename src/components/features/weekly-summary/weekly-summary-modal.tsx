"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Confetti } from "../celebration/confetti";
import { WeeklySummaryData } from "@/lib/weekly-summary";

interface WeeklySummaryModalProps {
  summary: WeeklySummaryData | null;
  onClose: () => void;
}

export function WeeklySummaryModal({ summary, onClose }: WeeklySummaryModalProps) {
  if (!summary) return null;

  const hasChange = summary.weeklyChange !== null && summary.startWeight !== null;
  const weeklyChangeDisplay = hasChange
    ? summary.weeklyChange! > 0
      ? `+${summary.weeklyChange!.toFixed(1)}`
      : summary.weeklyChange!.toFixed(1)
    : null;

  const isGoodWeek = hasChange && summary.weeklyChange! < -0.1;
  const isChallengingWeek = hasChange && summary.weeklyChange! > 0.5;

  return (
    <AnimatePresence>
      {summary && (
        <>
          <Confetti isActive={true} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
            onClick={onClose}
          >
            <motion.div
              data-testid="weekly-summary-modal"
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full rounded-2xl p-6 text-center bg-gradient-to-br from-lavender-100 via-white to-bae-100"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 10 }}
                className="text-6xl mb-4"
              >
                {summary.weekNumber === 1 ? "🎯" : "📅"}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-bae-800 mb-2"
              >
                Week {summary.weekNumber} Complete!
              </motion.h2>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="inline-block bg-lavender-200 text-lavender-700 px-4 py-2 rounded-full font-bold mb-4"
              >
                {summary.entriesThisWeek} {summary.entriesThisWeek === 1 ? "Entry" : "Entries"} This Week
              </motion.div>

              {/* Stats Grid - only show if we have start/end comparison */}
              {hasChange && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-2 gap-3 mb-4"
                >
                  <div className="bg-white/60 rounded-xl p-3">
                    <div className="text-xs text-bae-500 uppercase tracking-wide">Start</div>
                    <div className="text-lg font-bold text-bae-700">
                      {summary.startWeight!.toFixed(1)} {summary.unit}
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3">
                    <div className="text-xs text-bae-500 uppercase tracking-wide">End</div>
                    <div className="text-lg font-bold text-bae-700">
                      {summary.endWeight.toFixed(1)} {summary.unit}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Single entry - just show current weight */}
              {!hasChange && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-4"
                >
                  <div className="bg-white/60 rounded-xl p-3 inline-block">
                    <div className="text-xs text-bae-500 uppercase tracking-wide">Current</div>
                    <div className="text-lg font-bold text-bae-700">
                      {summary.endWeight.toFixed(1)} {summary.unit}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Weekly change badge - only if we have comparison */}
              {hasChange && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.55, type: "spring" }}
                  className={`inline-block px-4 py-2 rounded-full font-bold mb-4 ${
                    isGoodWeek
                      ? "bg-mint-100 text-mint-500"
                      : isChallengingWeek
                      ? "bg-bae-100 text-bae-600"
                      : "bg-lavender-100 text-lavender-600"
                  }`}
                >
                  {weeklyChangeDisplay} {summary.unit} this week
                </motion.div>
              )}

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-bae-600 mb-6 leading-relaxed italic"
              >
                &ldquo;{summary.quote}&rdquo;
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Button data-testid="weekly-summary-close" onClick={onClose} className="w-full">
                  Keep It Up!
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
