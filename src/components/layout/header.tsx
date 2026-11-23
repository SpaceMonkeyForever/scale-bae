"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DisplayNameEditor } from "@/components/features/user/display-name-editor";
import { Brand } from "@/components/layout/brand";
import { isAdmin } from "@/lib/admin";

interface HeaderProps {
  username?: string;
  displayName?: string;
}

export function Header({ username, displayName }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleSaveName = async (name: string) => {
    const res = await fetch("/api/user", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name || null }),
    });

    if (res.ok) {
      setCurrentDisplayName(name || undefined);
      setIsEditing(false);
      router.refresh();
    }
  };

  const navLinks = [
    { href: "/upload", label: "Upload" },
    { href: "/progress", label: "Progress" },
    ...(isAdmin(username) ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const greeting = currentDisplayName || username;

  return (
    <header className="journal-header sticky top-0 z-50">
      <div className="journal-nav">
        <Link href="/upload" aria-label="Scale Bae home" className="journal-brand">
          <Brand />
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-[var(--radius-bae)] text-sm font-medium transition-colors",
                "hover:bg-bae-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 focus-visible:ring-offset-2",
                pathname === link.href
                  ? "bg-bae-100 text-bae-700"
                  : "text-bae-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {greeting && (
            <div className="relative">
              <button
                data-testid="user-menu-button"
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  "text-sm text-bae-600 hidden md:inline truncate max-w-[150px]",
                  "hover:text-bae-700 hover:underline cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 rounded"
                )}
              >
                <span data-testid="display-name">Hey, {greeting}!</span>
              </button>
              {isEditing && (
                <DisplayNameEditor
                  currentName={currentDisplayName || ""}
                  onSave={handleSaveName}
                  onCancel={() => setIsEditing(false)}
                />
              )}
            </div>
          )}
          <Button data-testid="logout-button" variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
