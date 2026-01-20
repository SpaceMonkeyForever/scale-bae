import { redirect } from "next/navigation";
import { getSession } from "@/services/auth";
import { isAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isLoggedIn || !isAdmin(session.username)) {
    redirect("/progress");
  }

  return <>{children}</>;
}
