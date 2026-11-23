import { redirect } from "next/navigation";
import { Header } from "@/components/layout/header";
import { getSession } from "@/services/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="journal-shell min-h-screen">
      <Header username={session.username} displayName={session.displayName} />
      <main className="journal-main">{children}</main>
    </div>
  );
}
