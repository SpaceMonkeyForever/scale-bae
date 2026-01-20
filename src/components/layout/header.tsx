"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DisplayNameEditor } from "@/components/features/user/display-name-editor";
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
    <header className="sticky top-0 z-50 w-full border-b border-bae-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-2">
        <Link href="/upload" className="flex items-center gap-2 shrink-0">
          <Image
            src="/unicorns/1.png"
            alt=""
            width={32}
            height={32}
            className="hover:animate-[wiggle_0.5s_ease-in-out] transition-transform"
          />
          <span className="text-xl font-semibold text-bae-700 hidden sm:inline">
            scale-bae
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
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
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  "text-sm text-bae-600 hidden md:inline truncate max-w-[150px]",
                  "hover:text-bae-700 hover:underline cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 rounded"
                )}
              >
                Hey, {greeting}!
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
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
