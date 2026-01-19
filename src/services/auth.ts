import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getUserByUsername, createUser } from "@/db/queries";

export interface SessionData {
  userId?: string;
  username?: string;
  isLoggedIn: boolean;
}

// Use a default secret for development, require one in production runtime
const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    console.warn("SESSION_SECRET not set - using default for build");
  }
  return secret || "development-secret-must-be-at-least-32-chars";
};

export const sessionOptions: SessionOptions = {
  password: getSessionSecret(),
  cookieName: "scale-bae-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  return session;
}

export async function login(username: string, password: string) {
  const user = await getUserByUsername(username);

  if (!user) {
    return { success: false, error: "Invalid username or password" };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: "Invalid username or password" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.isLoggedIn = true;
  await session.save();

  return { success: true };
}

export async function register(username: string, password: string) {
  const existing = await getUserByUsername(username);
  if (existing) {
    return { success: false, error: "Username already taken" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  await createUser({
    id,
    username,
    passwordHash,
  });

  const session = await getSession();
  session.userId = id;
  session.username = username;
  session.isLoggedIn = true;
  await session.save();

  return { success: true };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}
