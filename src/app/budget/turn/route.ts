import { getSession } from "@/services/auth";
import { input, json, readBudget, revisionSchema } from "@/services/budget";
import { anthropicMessage, budgetTurn } from "../../../../scripts/budget-agent.mjs";

// The single app process shares these limits across signed-in tabs.
const inFlight = new Set<string>();
const recent = new Map<string, number[]>();
function admit(userId:string) {
  const now = Date.now();
  for (const [key,times] of recent) {
    if (times[times.length-1] <= now-60000) recent.delete(key);
  }
  const times = (recent.get(userId) || []).filter(t => t > now-60000);
  if (inFlight.has(userId) || inFlight.size >= 8 || times.length >= 12) return false;
  recent.set(userId,[...times,now]);
  inFlight.add(userId);
  return true;
}

export async function POST(request:Request) {
  const user = await getSession();
  if (!user.isLoggedIn || !user.userId) return json(null,401);
  const body = await input(request).catch(() => null);
  if (!revisionSchema.safeParse(body?.revision).success) return json(null,400);
  const current = readBudget(user.userId);
  if (current.revision !== body.revision) return json(current,409);
  if (!admit(user.userId)) return json(null,429);
  try {
    const result = await budgetTurn({...body,budget:current.budget},anthropicMessage,
      AbortSignal.any([request.signal,AbortSignal.timeout(45000)]));
    return json(result);
  } catch (error) {
    return json(null,error instanceof TypeError && error.message === "Invalid turn" ? 400 : 502);
  } finally {
    inFlight.delete(user.userId);
  }
}
