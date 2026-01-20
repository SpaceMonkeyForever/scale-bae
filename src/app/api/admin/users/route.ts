import { NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { isAdmin } from "@/lib/admin";
import { getAllUsers } from "@/db/queries";

export async function GET() {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !isAdmin(session.username)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await getAllUsers();

    // Don't expose password hashes
    const safeUsers = users.map(({ passwordHash: _, ...user }) => user);

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
