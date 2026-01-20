import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { isAdmin } from "@/lib/admin";
import { getAllActivityLogs, getActivityLogsByUserId } from "@/db/queries";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !isAdmin(session.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const logs = userId
      ? await getActivityLogsByUserId(userId)
      : await getAllActivityLogs();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Admin activity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
