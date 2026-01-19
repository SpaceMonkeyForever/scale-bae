import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/services/auth";
import { getWeightsByUserId, createWeight } from "@/db/queries";
import { weightEntrySchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weights = await getWeightsByUserId(session.userId);
    return NextResponse.json({ weights });
  } catch (error) {
    console.error("Get weights error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Parse the date string back to Date object
    const dataToValidate = {
      ...body,
      recordedAt: new Date(body.recordedAt),
    };

    const result = weightEntrySchema.safeParse(dataToValidate);
    if (!result.success) {
      const issues = result.error.issues;
      return NextResponse.json(
        { error: issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { weight, unit, recordedAt, note } = result.data;

    const newWeight = await createWeight({
      id: uuidv4(),
      userId: session.userId,
      weight,
      unit,
      recordedAt,
      note,
    });

    return NextResponse.json({ weight: newWeight[0] });
  } catch (error) {
    console.error("Create weight error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
