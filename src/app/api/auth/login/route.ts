import { NextRequest, NextResponse } from "next/server";
import { login, register } from "@/services/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      const issues = result.error.issues;
      return NextResponse.json(
        { error: issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    if (action === "register") {
      const registerResult = await register(username, password);
      if (!registerResult.success) {
        return NextResponse.json(
          { error: registerResult.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    const loginResult = await login(username, password);
    if (!loginResult.success) {
      return NextResponse.json({ error: loginResult.error }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
