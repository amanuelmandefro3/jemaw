"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SplitSquareVertical } from "lucide-react";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
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

      <h1 className="text-xl font-bold text-slate-900 mb-1">Create account</h1>
      <p className="text-sm text-slate-500 mb-6">Start splitting expenses with friends</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-lg">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-slate-700 text-xs font-medium">Full name</Label>
          <Input id="name" type="text" placeholder="Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-700 text-xs font-medium">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-700 text-xs font-medium">Password</Label>
          <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="h-9" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-slate-700 text-xs font-medium">Confirm password</Label>
          <Input id="confirm-password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="h-9" />
        </div>
        <Button type="submit" className="w-full h-9" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-slate-500 text-center mt-6">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-indigo-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
