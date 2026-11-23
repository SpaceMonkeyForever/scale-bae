ALTER TABLE `user_preferences` ADD `goal_unit` text;
--> statement-breakpoint
-- Older versions displayed a saved goal in the latest weigh-in's unit (lb before the first entry).
UPDATE user_preferences
SET goal_unit = COALESCE((
  SELECT unit FROM weights WHERE weights.user_id = user_preferences.user_id
  ORDER BY recorded_at DESC LIMIT 1
), 'lb')
WHERE goal_weight IS NOT NULL;
