import { NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { getUserAchievements, checkForNewAchievements } from "@/lib/achievements";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const achievements = await getUserAchievements(session.userId);

  return NextResponse.json({
    achievements: achievements.map((a) => ({
      type: a.type,
      unlockedAt: a.unlockedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { weight, unit, goalWeight } = body;

  if (typeof weight !== "number" || !["lb", "kg"].includes(unit)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const newAchievements = await checkForNewAchievements(
    session.userId,
    weight,
    unit,
    goalWeight ?? null
  );

  return NextResponse.json({
    newAchievements: newAchievements.map((a) => ({
      type: a.type,
      unlockedAt: a.unlockedAt.toISOString(),
    })),
  });
}
