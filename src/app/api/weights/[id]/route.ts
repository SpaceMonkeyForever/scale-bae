import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/services/auth";
import { deleteWeight } from "@/db/queries";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteWeight(id, session.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete weight error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
