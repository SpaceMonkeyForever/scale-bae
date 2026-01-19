import { NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { getUserById, updateUserDisplayName } from "@/db/queries";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      username: user.username,
      displayName: user.displayName,
    },
  });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { displayName } = body;

  if (displayName !== null && typeof displayName !== "string") {
    return NextResponse.json({ error: "Invalid display name" }, { status: 400 });
  }

  if (displayName && displayName.length > 50) {
    return NextResponse.json({ error: "Display name too long" }, { status: 400 });
  }

  const trimmedName = displayName?.trim() || null;

  await updateUserDisplayName(session.userId, trimmedName);

  // Update session with new display name
  session.displayName = trimmedName || undefined;
  await session.save();

  return NextResponse.json({
    user: {
      displayName: trimmedName,
    },
  });
}
