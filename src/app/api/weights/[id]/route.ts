import { NextRequest, NextResponse } from "next/server";
import { sealData, unsealData } from "iron-session";
import { getSession, sessionOptions } from "@/services/auth";
import { deleteWeight, getOwnedWeight, restoreWeight } from "@/db/queries";
import type { Weight } from "@/db/schema";

type UndoReceipt = {
  expiresAt: number;
  deletedWeight: Omit<Weight, "recordedAt" | "createdAt"> & { recordedAt: string; createdAt: string };
};

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
    const entry = await getOwnedWeight(id, session.userId);
    if (!entry) return NextResponse.json({ error: "Weigh-in not found" }, { status: 404 });
    const undoToken = await sealData({ deletedWeight: entry, expiresAt: Date.now() + 60_000 }, {
      password: sessionOptions.password, ttl: 60,
    });
    const removed = await deleteWeight(id, session.userId);
    if (!removed.length) return NextResponse.json({ error: "Weigh-in not found" }, { status: 404 });
    return NextResponse.json({ success: true, undoToken });
  } catch (error) {
    console.error("Delete weight error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let receipt: UndoReceipt;
  try {
    const { undoToken } = await request.json();
    receipt = await unsealData<UndoReceipt>(undoToken, { password: sessionOptions.password, ttl: 60 });
  } catch {
    return NextResponse.json({ error: "Invalid undo request" }, { status: 400 });
  }
  const entry = receipt.deletedWeight;
  if (!entry || entry.userId !== session.userId || entry.id !== id || !(receipt.expiresAt > Date.now())) {
    return NextResponse.json({ error: "Undo is no longer available" }, { status: 410 });
  }
  await restoreWeight({ ...entry, recordedAt: new Date(entry.recordedAt), createdAt: new Date(entry.createdAt) });
  return NextResponse.json({ success: true });
}
