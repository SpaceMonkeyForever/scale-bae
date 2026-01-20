import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import path from "path";

const DB_PATH =
  process.env.TEST_DB_PATH ||
  path.join(process.cwd(), "scale-bae.db");

export function getTestDb(): Database.Database {
  return new Database(DB_PATH);
}

export async function createTestUser(
  username: string,
  password: string,
  options: { displayName?: string } = {}
): Promise<string> {
  const db = getTestDb();
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    db.prepare(
      `
      INSERT INTO users (id, username, display_name, password_hash, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `
    ).run(id, username, options.displayName || null, passwordHash);

    // Create default preferences
    db.prepare(
      `
      INSERT INTO user_preferences (user_id, preferred_unit)
      VALUES (?, 'lb')
    `
    ).run(id);
  } finally {
    db.close();
  }

  return id;
}

export async function seedWeightEntries(
  userId: string,
  entries: Array<{
    weight: number;
    unit: "lb" | "kg";
    daysAgo: number;
    note?: string;
  }>
): Promise<void> {
  const db = getTestDb();

  try {
    for (const entry of entries) {
      const id = randomUUID();
      // Calculate Unix timestamp for daysAgo
      const date = new Date();
      date.setDate(date.getDate() - entry.daysAgo);
      date.setHours(9, 0, 0, 0); // Set to 9 AM for consistency
      const unixTimestamp = Math.floor(date.getTime() / 1000);

      db.prepare(
        `
        INSERT INTO weights (id, user_id, weight, unit, note, recorded_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        id,
        userId,
        entry.weight,
        entry.unit,
        entry.note || null,
        unixTimestamp,
        unixTimestamp
      );
    }
  } finally {
    db.close();
  }
}

export function seedAchievements(userId: string, achievements: string[]): void {
  const db = getTestDb();

  try {
    for (const type of achievements) {
      db.prepare(
        `
        INSERT INTO achievements (id, user_id, type, unlocked_at)
        VALUES (?, ?, ?, datetime('now'))
      `
      ).run(randomUUID(), userId, type);
    }
  } finally {
    db.close();
  }
}

export function setGoalWeight(userId: string, goalWeight: number): void {
  const db = getTestDb();

  try {
    db.prepare(
      `
      UPDATE user_preferences SET goal_weight = ? WHERE user_id = ?
    `
    ).run(goalWeight, userId);
  } finally {
    db.close();
  }
}

export function setPreferredUnit(userId: string, unit: "lb" | "kg"): void {
  const db = getTestDb();

  try {
    db.prepare(
      `
      UPDATE user_preferences SET preferred_unit = ? WHERE user_id = ?
    `
    ).run(unit, userId);
  } finally {
    db.close();
  }
}

export function cleanupTestUser(username: string): void {
  const db = getTestDb();

  try {
    // Get user ID first
    const user = db
      .prepare(`SELECT id FROM users WHERE username = ?`)
      .get(username) as { id: string } | undefined;

    if (user) {
      // Delete in order respecting foreign keys
      db.prepare(`DELETE FROM activity_log WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM achievements WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM weights WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM user_preferences WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM users WHERE id = ?`).run(user.id);
    }
  } finally {
    db.close();
  }
}

export function cleanupAllTestUsers(prefix: string = "test_"): void {
  const db = getTestDb();

  try {
    const users = db
      .prepare(`SELECT id, username FROM users WHERE username LIKE ?`)
      .all(`${prefix}%`) as Array<{ id: string; username: string }>;

    for (const user of users) {
      db.prepare(`DELETE FROM activity_log WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM achievements WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM weights WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM user_preferences WHERE user_id = ?`).run(user.id);
      db.prepare(`DELETE FROM users WHERE id = ?`).run(user.id);
    }
  } finally {
    db.close();
  }
}

export function getUserWeightCount(userId: string): number {
  const db = getTestDb();

  try {
    const result = db
      .prepare(`SELECT COUNT(*) as count FROM weights WHERE user_id = ?`)
      .get(userId) as { count: number };
    return result.count;
  } finally {
    db.close();
  }
}

export function getUser(username: string): { id: string; username: string; display_name: string | null } | undefined {
  const db = getTestDb();

  try {
    return db
      .prepare(`SELECT id, username, display_name FROM users WHERE username = ?`)
      .get(username) as { id: string; username: string; display_name: string | null } | undefined;
  } finally {
    db.close();
  }
}
