/**
 * Seed script to test the weekly summary feature.
 * Creates entries starting 8 days ago so when you log one today,
 * the first week is complete and triggers the weekly summary modal!
 *
 * Usage: npx tsx scripts/seed-weekly-test.ts <username>
 */

import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

const username = process.argv[2];

if (!username) {
  console.error("Usage: npx tsx scripts/seed-weekly-test.ts <username>");
  process.exit(1);
}

const db = new Database("scale-bae.db");

// Find user
const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as { id: string } | undefined;

if (!user) {
  console.error(`User "${username}" not found. Please register first.`);
  process.exit(1);
}

console.log(`Found user: ${username} (${user.id})`);

// Delete existing weights for clean test
const deleted = db.prepare("DELETE FROM weights WHERE user_id = ?").run(user.id);
console.log(`Deleted ${deleted.changes} existing weight entries`);

// Create entries over the past 8 days
// First entry is 8 days ago (starting week 1), latest entries are in week 1
// When user logs today, 7+ days have passed since first entry = Week 1 complete!
const weights = [
  { daysAgo: 8, weight: 165.0 },  // Week 1 start (first entry)
  { daysAgo: 6, weight: 164.8 },  // Week 1
  { daysAgo: 4, weight: 164.5 },  // Week 1
  { daysAgo: 2, weight: 164.0 },  // Week 1
];

const insert = db.prepare(`
  INSERT INTO weights (id, user_id, weight, unit, recorded_at, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const entry of weights) {
  const date = new Date();
  date.setDate(date.getDate() - entry.daysAgo);
  date.setHours(9, 0, 0, 0); // 9 AM each day

  const unixTimestamp = Math.floor(date.getTime() / 1000);

  insert.run(
    uuidv4(),
    user.id,
    entry.weight,
    "lb",
    unixTimestamp,
    unixTimestamp
  );

  console.log(`Created entry: ${entry.weight} lb on ${date.toLocaleDateString()}`);
}

console.log("\n✅ Done! You now have entries spanning 8 days.");
console.log("📝 Log one more weight TODAY to trigger the weekly summary modal!");
console.log("   (Because 7+ days have passed since your first entry)");
console.log("\nGo to http://localhost:3000/upload and save a new weight.");

db.close();
