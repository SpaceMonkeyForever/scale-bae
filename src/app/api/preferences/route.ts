import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { getUserPreferences, upsertUserPreferences } from "@/db/queries";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prefs = await getUserPreferences(session.userId);
    return NextResponse.json({
      preferences: prefs || { preferredUnit: "lb", goalWeight: null },
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { preferredUnit, goalWeight } = body;

    // Validate goalWeight if provided
    if (goalWeight !== undefined && goalWeight !== null) {
      const weight = Number(goalWeight);
      if (isNaN(weight) || weight <= 0 || weight > 1000) {
        return NextResponse.json(
          { error: "Goal weight must be between 0 and 1000" },
          { status: 400 }
        );
      }
    }

    // Validate preferredUnit if provided
    if (preferredUnit && !["lb", "kg"].includes(preferredUnit)) {
      return NextResponse.json(
        { error: "Unit must be 'lb' or 'kg'" },
        { status: 400 }
      );
    }

    const updateData: { preferredUnit?: "lb" | "kg"; goalWeight?: number | null } = {};
    if (preferredUnit) updateData.preferredUnit = preferredUnit;
    if (goalWeight !== undefined) updateData.goalWeight = goalWeight === null ? null : Number(goalWeight);

    const updated = await upsertUserPreferences(session.userId, updateData);
    return NextResponse.json({ preferences: updated[0] });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
