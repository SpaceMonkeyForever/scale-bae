import { getSession } from "@/services/auth";
import { bookSchema, input, json, readBudget, revisionSchema, writeBudget } from "@/services/budget";
import { z } from "zod";

const change = z.object({revision:revisionSchema, budget:bookSchema}).strict();
export async function PUT(request:Request) {
  const user = await getSession();
  if (!user.isLoggedIn || !user.userId) return json(null,401);
  const parsed = change.safeParse(await input(request).catch(() => null));
  if (!parsed.success) return json(null,400);
  const {revision,budget} = parsed.data;
  if (!writeBudget(user.userId,revision,budget)) return json(readBudget(user.userId),409);
  return json({revision:revision+1,budget});
}
