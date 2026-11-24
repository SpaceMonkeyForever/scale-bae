import { z } from "zod";
import { db } from "@/db";
import { budgetBooks } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { bookCurrency, currencies, emptyBudget, hasAmounts, maxMinor } from "../../public/budget/budget.mjs";

const date = z.iso.date();
const amount = z.number().int().min(0).max(maxMinor);
const item = z.object({id:z.uuid(), name:z.string().trim().min(1).max(100), amount});
const basic = item.extend({
  status:z.enum(["paid","reserved","planned"]), until:z.union([date,z.literal("")])
}).strict().refine(b => b.status === "planned" ? b.until === "" : b.until !== "");
const entries = <T extends z.ZodType<{id:string}>>(schema:T) => z.array(schema).max(500)
  .refine(items => new Set(items.map(i => i.id)).size === items.length);
export const bookSchema = z.object({
  currency:z.enum(currencies as [string,...string[]]).optional(),
  start:z.union([date,z.literal("")]), end:z.union([date,z.literal("")]), allocated:amount.nullable(),
  bank:z.object({amount:z.number().int().min(-maxMinor).max(maxMinor), asOf:date}).strict().optional(),
  basics:entries(basic), extras:entries(item.extend({amount:amount.positive(), reason:z.string().max(400)}).strict()),
  topups:entries(item.extend({amount:amount.positive()}).strict())
}).strict().refine(b => !b.start || !b.end || b.start <= b.end);
export const revisionSchema = z.number().int().nonnegative();

export function readBudget(userId:string, account:{username?:string; displayName?:string}) {
  const row = db.select().from(budgetBooks).where(eq(budgetBooks.userId,userId)).get();
  const book = row ? bookSchema.parse(JSON.parse(row.book)) : {...emptyBudget(), currency:undefined};
  const currency = bookCurrency(book, account.username, account.displayName);
  return {revision:row?.revision ?? 0, budget:{...book, currency},
    showCurrencyNotice:currency === "IDR" && !book.currency && hasAmounts(book)};
}

export function writeBudget(userId:string, revision:number, budget:z.infer<typeof bookSchema>) {
  const next = {revision:revision + 1, book:JSON.stringify(budget)};
  const result = revision === 0
    ? db.insert(budgetBooks).values({userId,...next}).onConflictDoNothing().run()
    : db.update(budgetBooks).set(next).where(and(eq(budgetBooks.userId,userId),eq(budgetBooks.revision,revision))).run();
  return result.changes === 1;
}

export function json(body:unknown, status=200) {
  return Response.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
}

// JSON writes are same-origin. Refuse oversized chunked requests before parsing them.
export async function input(request:Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json" ||
      request.headers.get("sec-fetch-site") === "cross-site") throw new Error("Invalid request");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const parts:Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const {done,value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 524288) { await reader.cancel(); throw new Error("Request too large"); }
    parts.push(value);
  }
  return JSON.parse(Buffer.concat(parts).toString("utf8"));
}
