"use client";

import { useState } from "react";
import { Clock, Search, Star, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Recipe, DayOfWeek } from "@/lib/types";

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  targetDay: DayOfWeek | null;
  onAdd: (recipe: Recipe, day: DayOfWeek) => void;
  isPending: boolean;
}

export function AddMealDialog({
  open,
  onOpenChange,
  recipes,
  targetDay,
  onAdd,
  isPending,
}: AddMealDialogProps) {
  const [search, setSearch] = useState("");

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(recipe: Recipe) {
    if (!targetDay) return;
    onAdd(recipe, targetDay);
  }

  const dayLabel = targetDay
    ? targetDay.charAt(0).toUpperCase() + targetDay.slice(1)
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md w-full p-0 overflow-hidden rounded-2xl border border-[#E8E4DF] bg-[#FAF8F5]"
        showCloseButton
      >
        <div className="p-5 pb-0">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-[#2D2D2D]">
              Add meal to {dayLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#ADADAD]" />
            <Input
              placeholder="Search recipes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-[#E8E4DF] bg-white text-sm placeholder:text-[#ADADAD] focus-visible:ring-[#7C9082]/30 focus-visible:border-[#7C9082]"
            />
          </div>
        </div>

        <div className="mt-3 max-h-[380px] overflow-y-auto px-5 pb-5">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#ADADAD]">
              No recipes found.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((recipe) => {
                const totalMins =
                  (recipe.prep_time_minutes ?? 0) +
                  (recipe.cook_time_minutes ?? 0);
                return (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSelect(recipe)}
                      className="w-full rounded-xl border border-[#E8E4DF] bg-white p-3 text-left transition-all hover:border-[#7C9082] hover:shadow-sm active:scale-[0.99] disabled:opacity-60"
                    >
                      <p className="text-sm font-medium text-[#2D2D2D] leading-snug">
                        {recipe.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-[#ADADAD]">
                        {totalMins > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {totalMins} min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {recipe.servings} servings
                        </span>
                        {recipe.average_rating != null && (
                          <span className="flex items-center gap-1 text-amber-500">
                            <Star className="size-3 fill-amber-400 stroke-amber-400" />
                            {recipe.average_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
