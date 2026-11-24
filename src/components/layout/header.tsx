"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DisplayNameEditor } from "@/components/features/user/display-name-editor";
import { Brand } from "@/components/layout/brand";
import { isAdmin } from "@/lib/admin";

import { preferredLocale, storedLocale, saveLocale } from "../../../public/budget/preference.mjs";

function subscribeToLanguage(refresh: () => void) {
  window.addEventListener("scale-bae-language", refresh);
  window.addEventListener("storage", refresh);
  return () => {
    window.removeEventListener("scale-bae-language", refresh);
    window.removeEventListener("storage", refresh);
  };
}

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

  const account = username || "";
  const locale = useSyncExternalStore(
    subscribeToLanguage,
    () => storedLocale(account, currentDisplayName),
    () => preferredLocale(currentDisplayName?.trim().toLowerCase() === "squishy" ? currentDisplayName : account, null)
  );
  const indonesian = locale === "id-ID";
  const navLinks = [
    { href: "/upload", label: indonesian ? "Unggah" : "Upload" },
    { href: "/progress", label: indonesian ? "Progres" : "Progress" },
    { href: "/budget", label: indonesian ? "Anggaran" : "Budget" },
    ...(isAdmin(username) ? [{ href: "/admin", label: "Admin" }] : []),
  ];
  const activeSection = pathname === "/confirm" ? "/upload" : pathname;

  // Opening or leaving the book across a document boundary keeps Back in sync with saved edits.
  const HomeLink = pathname === "/budget" ? "a" : Link;
  const greeting = currentDisplayName || username;

  return (
    <header lang={locale} className="journal-header sticky top-0 z-50">
      <div className="journal-nav">
        <HomeLink href="/upload" aria-label={indonesian ? "Beranda Scale Bae" : "Scale Bae home"} className="journal-brand">
          <Brand />
        </HomeLink>

        <nav aria-label={indonesian ? "Navigasi utama" : "Main navigation"} className="flex items-center gap-1">
          {navLinks.map((link) => {
            const NavLink = link.href === "/budget" ? "a" : HomeLink;
            return <NavLink
              key={link.href}
              href={link.href}
              aria-current={activeSection === link.href ? "page" : undefined}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-[var(--radius-bae)] text-sm font-medium transition-colors",
                "hover:bg-bae-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 focus-visible:ring-offset-2",
                activeSection === link.href
                  ? "bg-bae-100 text-bae-700"
                  : "text-bae-600"
              )}
            >
              {link.label}
            </NavLink>;
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            className="journal-language"
            aria-label={indonesian ? "Bahasa navigasi dan anggaran" : "Navigation and budget language"}
            value={locale}
            onChange={event => saveLocale(account, event.target.value)}
          >
            <option value="id-ID" lang="id">Bahasa Indonesia</option>
            <option value="en-GB" lang="en">English</option>
          </select>
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
                <span data-testid="display-name">{indonesian ? "Hai" : "Hey"}, {greeting}!</span>
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
            {indonesian ? "Keluar" : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
