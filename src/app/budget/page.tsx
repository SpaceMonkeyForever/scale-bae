import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { BudgetBook } from "@/components/features/budget/budget-book";
import { getSession } from "@/services/auth";
import { readBudget } from "@/services/budget";

export const metadata = { title: "My budget book · scale-bae" };

export default async function BudgetPage() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId || !session.username) redirect("/login?next=/budget");
  const book = readBudget(session.userId,session);
  const template = await readFile(join(process.cwd(), "examples/budget/book.html"), "utf8");
  const markup = '<link rel="stylesheet" href="/budget/style.css">' + template.replace(/<!-- demo -->[\s\S]*?<!-- \/demo -->/g, "");
  return (
    <div className="min-h-screen">
      <Header username={session.username} displayName={session.displayName} />
      <BudgetBook markup={markup} account={{...book, username:session.username, name:session.displayName || session.username}} />
    </div>
  );
}
