"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { UnlockedAchievement } from "@/lib/achievement-types";

interface AchievementUnlockedModalProps {
  achievement: UnlockedAchievement | null;
  onClose: () => void;
}

export function AchievementUnlockedModal({
  achievement,
  onClose,
}: AchievementUnlockedModalProps) {
  if (!achievement) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative bg-gradient-to-br from-lavender-100 via-white to-bae-100 rounded-[var(--radius-bae)] p-8 shadow-bae-lg max-w-sm w-full text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", damping: 10 }}
            className="w-24 h-24 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-lavender-200 to-bae-200 rounded-full border-4 border-lavender-300 shadow-lg overflow-hidden"
          >
            <Image
              src={achievement.type.image}
              alt={achievement.type.name}
              width={96}
              height={96}
              className="object-cover"
            />
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-lavender-600 mb-1"
          >
            Achievement Unlocked!
          </motion.h2>

          {/* Badge name */}
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-bae-700 mb-2"
          >
            {achievement.type.name}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-bae-600 mb-6"
          >
            {achievement.type.description}
          </motion.p>

          {/* Close button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button onClick={onClose} className="w-full">
              Awesome!
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
