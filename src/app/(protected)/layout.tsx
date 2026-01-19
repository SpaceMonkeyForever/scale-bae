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
    <div className="min-h-screen bg-bae-50">
      <Header username={session.username} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
