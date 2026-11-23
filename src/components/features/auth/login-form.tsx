"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          action: isRegister ? "register" : "login",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      router.push("/upload");
      router.refresh();
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-panel" aria-labelledby="auth-heading">
      <div className="auth-inner">
        <span className="auth-emblem" aria-hidden="true">✦</span>
        <h2 id="auth-heading" className="journal-heading">{isRegister ? "Create an account" : "Welcome back."}</h2>
        <p className="auth-intro">{isRegister ? "Start your personal weight journal." : "Sign in to your weight journal."}</p>
        <form onSubmit={handleSubmit} className="journal-form">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              name="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Enter your username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            data-testid="auth-submit"
          >
            {isRegister ? "Create Account" : "Sign In"}
          </Button>

          <p className="text-center text-sm text-bae-600">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              className="text-bae-700 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bae-500 rounded"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              data-testid={isRegister ? "switch-to-login" : "switch-to-register"}
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </div>
    </section>
  );
}
