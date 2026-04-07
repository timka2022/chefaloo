"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { verifySitePassword } from "@/actions";

export default function GatePage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await verifySitePassword(password);
      if (result.success) {
        document.cookie = "site_access=granted; path=/; max-age=31536000";
        router.push("/");
        router.refresh();
      } else {
        setError(true);
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#7C9082] flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-xl leading-none">C</span>
          </div>
          <span className="font-semibold text-[#2D2D2D] text-xl tracking-tight">
            Cheffaloo
          </span>
          <p className="text-sm text-[#5A5A5A]">Enter the password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#F0EDE8] shadow-sm p-6 flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            autoFocus
            className="h-10 w-full rounded-lg border border-[#F0EDE8] px-3 text-sm text-[#2D2D2D] placeholder:text-[#ADADAD] focus:outline-none focus:border-[#7C9082] focus:ring-2 focus:ring-[#7C9082]/20"
          />
          {error && (
            <p className="text-sm text-red-600">Wrong password</p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="h-10 w-full rounded-lg bg-[#7C9082] text-white text-sm font-medium hover:bg-[#6b7d70] transition-colors disabled:opacity-60"
          >
            {isPending ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
