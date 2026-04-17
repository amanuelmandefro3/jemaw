"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SplitSquareVertical } from "lucide-react";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <SplitSquareVertical className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-lg">Jemaw</span>
      </div>

      <h1 className="text-xl font-bold text-slate-900 mb-1">Sign in</h1>
      <p className="text-sm text-slate-500 mb-6">Enter your credentials to continue</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-lg">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-700 text-xs font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-700 text-xs font-medium">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="h-9"
          />
        </div>
        <Button type="submit" className="w-full h-9" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-slate-500 text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-indigo-600 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
