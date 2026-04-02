"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#7C9082] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl leading-none">C</span>
          </div>
          <span className="font-semibold text-[#2D2D2D] text-xl tracking-tight">
            Cheffaloo
          </span>
          <p className="text-sm text-[#5A5A5A] text-center">
            {isSignUp
              ? "Create an account to get started"
              : "Sign in to your account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#F0EDE8] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#2D2D2D]"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10 border-[#F0EDE8] focus-visible:border-[#7C9082] focus-visible:ring-[#7C9082]/20"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#2D2D2D]"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder={isSignUp ? "At least 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="h-10 border-[#F0EDE8] focus-visible:border-[#7C9082] focus-visible:ring-[#7C9082]/20"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="h-10 mt-1 bg-[#7C9082] hover:bg-[#6b7d70] text-white border-transparent font-medium rounded-lg transition-colors"
            >
              {loading
                ? isSignUp
                  ? "Creating account…"
                  : "Signing in…"
                : isSignUp
                ? "Create account"
                : "Sign in"}
            </Button>
          </form>
        </div>

        {/* Toggle */}
        <p className="text-center text-sm text-[#5A5A5A] mt-5">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v);
              setError(null);
            }}
            className="text-[#7C9082] font-medium hover:underline underline-offset-2 transition-colors"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
