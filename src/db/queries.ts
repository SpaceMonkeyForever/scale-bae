import { eq, desc } from "drizzle-orm";
import { db } from "./index";
import { users, weights, userPreferences, achievements, NewUser, NewWeight, NewAchievement } from "./schema";

// User queries
export async function getUserByUsername(username: string) {
  return db.query.users.findFirst({
    where: eq(users.username, username),
  });
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
  });
}

export async function createUser(user: NewUser) {
  return db.insert(users).values(user).returning();
}

export async function updateUserDisplayName(userId: string, displayName: string | null) {
  return db
    .update(users)
    .set({ displayName })
    .where(eq(users.id, userId))
    .returning();
}

// Weight queries
export async function getWeightsByUserId(userId: string) {
  return db.query.weights.findMany({
    where: eq(weights.userId, userId),
    orderBy: [desc(weights.recordedAt)],
  });
}

export async function createWeight(weight: NewWeight) {
  return db.insert(weights).values(weight).returning();
}

export async function deleteWeight(id: string, userId: string) {
  return db
    .delete(weights)
    .where(eq(weights.id, id))
    .returning();
}

// User preferences queries
export async function getUserPreferences(userId: string) {
  return db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });
}

export async function upsertUserPreferences(
  userId: string,
  prefs: { preferredUnit?: "lb" | "kg"; goalWeight?: number | null }
) {
  const existing = await getUserPreferences(userId);
  if (existing) {
    return db
      .update(userPreferences)
      .set(prefs)
      .where(eq(userPreferences.userId, userId))
      .returning();
  }
  return db
    .insert(userPreferences)
    .values({ userId, ...prefs })
    .returning();
}

// Achievement queries
export async function getAchievementsByUserId(userId: string) {
  return db.query.achievements.findMany({
    where: eq(achievements.userId, userId),
  });
}

export async function createAchievement(achievement: NewAchievement) {
  return db.insert(achievements).values(achievement).returning();
}
