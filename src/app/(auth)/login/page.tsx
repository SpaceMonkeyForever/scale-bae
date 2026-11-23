import { LoginForm } from "@/components/features/auth/login-form";
import { JournalCover } from "@/components/layout/journal-cover";

export default function LoginPage() {
  return (
    <main className="journal-entry">
      <JournalCover page="login" />
      <LoginForm />
    </main>
  );
}
