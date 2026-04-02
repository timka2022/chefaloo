"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { addMealToPlan, getOrCreateMealPlan, removeMealFromPlan } from "@/actions";
import { AddMealDialog } from "@/components/add-meal-dialog";
import type { DayOfWeek, MealPlan, MealPlanItem, Recipe } from "@/lib/types";
import { DAYS_OF_WEEK } from "@/lib/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MEAL_COLORS = ["#7C9082", "#F59E0B", "#EF8C4B", "#6B8AFE"] as const;

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDateRange(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(weekStart + "T00:00:00");
  end.setDate(end.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const fmtShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-US", { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${fmt(start)} – ${fmtShort(end)}`;
}

function getMealColor(index: number): string {
  return MEAL_COLORS[index % MEAL_COLORS.length];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MealCard({
  item,
  colorIndex,
  onRemove,
  isPending,
}: {
  item: MealPlanItem;
  colorIndex: number;
  onRemove: (id: string) => void;
  isPending: boolean;
}) {
  const recipe = item.recipe;
  if (!recipe) return null;

  const totalMins =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const color = getMealColor(colorIndex);

  return (
    <div className="group relative">
      <Link
        href={`/recipes/${recipe.id}`}
        className="block overflow-hidden rounded-xl bg-white border border-[#E8E4DF] transition-shadow hover:shadow-sm"
        style={{ borderLeftWidth: "3px", borderLeftColor: color }}
      >
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-28 object-cover"
          />
        ) : (
          <div className="w-full h-28 bg-gradient-to-br from-amber-50 to-orange-100" />
        )}
        <div className="px-2.5 py-2">
          <p className="text-sm font-medium text-[#2D2D2D] leading-snug line-clamp-2">
            {recipe.title}
          </p>
          <p className="mt-0.5 text-xs text-[#ADADAD]">
            {totalMins > 0 ? `${totalMins} min` : null}
            {totalMins > 0 && " · "}
            {recipe.servings} servings
          </p>
        </div>
      </Link>

      <button
        type="button"
        disabled={isPending}
        onClick={() => onRemove(item.id)}
        aria-label="Remove meal"
        className="absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full bg-[#E8E4DF] text-[#8A8A8A] transition-colors hover:bg-red-100 hover:text-red-500 group-hover:flex disabled:opacity-50"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function EmptySlot({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#D4CFC9] py-4 text-[#C4BFB9] transition-colors hover:border-[#7C9082] hover:text-[#7C9082]"
    >
      <Plus className="size-4" />
    </button>
  );
}

function DayColumn({
  day,
  items,
  onAddClick,
  onRemove,
  isPending,
}: {
  day: DayOfWeek;
  items: MealPlanItem[];
  onAddClick: (day: DayOfWeek) => void;
  onRemove: (id: string) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[#E8E4DF] bg-white p-3 min-h-[180px]">
      <p className="text-xs font-medium uppercase tracking-wide text-[#8A8A8A]">
        {DAY_LABELS[day]}
      </p>

      {items.map((item, i) => (
        <MealCard
          key={item.id}
          item={item}
          colorIndex={i}
          onRemove={onRemove}
          isPending={isPending}
        />
      ))}

      <EmptySlot onClick={() => onAddClick(day)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface WeeklyPlannerProps {
  initialMealPlan: MealPlan;
  recipes: Recipe[];
  initialWeekStart: string;
}

export function WeeklyPlanner({
  initialMealPlan,
  recipes,
  initialWeekStart,
}: WeeklyPlannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [mealPlan, setMealPlan] = useState<MealPlan>(initialMealPlan);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetDay, setTargetDay] = useState<DayOfWeek | null>(null);

  // ---------------------------------------------------------------------------
  // Week navigation
  // ---------------------------------------------------------------------------

  function navigateWeek(direction: -1 | 1) {
    const newWeekStart = addDays(weekStart, direction * 7);
    startTransition(async () => {
      const result = await getOrCreateMealPlan(newWeekStart);
      if ("error" in result) return;
      setWeekStart(newWeekStart);
      setMealPlan(result);
    });
  }

  // ---------------------------------------------------------------------------
  // Add meal
  // ---------------------------------------------------------------------------

  function openAddDialog(day: DayOfWeek) {
    setTargetDay(day);
    setDialogOpen(true);
  }

  function handleAddMeal(recipe: Recipe, day: DayOfWeek) {
    startTransition(async () => {
      const result = await addMealToPlan(mealPlan.id, recipe.id, day);
      if ("error" in result) return;

      // Optimistically append to local state
      setMealPlan((prev) => ({
        ...prev,
        items: [...(prev.items ?? []), result],
      }));
      setDialogOpen(false);
      router.refresh();
    });
  }

  // ---------------------------------------------------------------------------
  // Remove meal
  // ---------------------------------------------------------------------------

  function handleRemoveMeal(itemId: string) {
    startTransition(async () => {
      const result = await removeMealFromPlan(itemId);
      if ("error" in result) return;

      setMealPlan((prev) => ({
        ...prev,
        items: (prev.items ?? []).filter((i) => i.id !== itemId),
      }));
      router.refresh();
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const itemsByDay: Record<DayOfWeek, MealPlanItem[]> = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };

  for (const item of mealPlan.items ?? []) {
    const day = item.planned_day as DayOfWeek;
    if (itemsByDay[day]) {
      itemsByDay[day].push(item);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: title + week nav */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[#2D2D2D]">
            Weekly Meal Planner
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateWeek(-1)}
              disabled={isPending}
              className="flex size-7 items-center justify-center rounded-full border border-[#E8E4DF] bg-white text-[#8A8A8A] transition-colors hover:border-[#7C9082] hover:text-[#7C9082] disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
            </button>

            <span className="text-sm text-[#8A8A8A]">
              {formatDateRange(weekStart)}
            </span>

            <button
              type="button"
              onClick={() => navigateWeek(1)}
              disabled={isPending}
              className="flex size-7 items-center justify-center rounded-full border border-[#E8E4DF] bg-white text-[#8A8A8A] transition-colors hover:border-[#7C9082] hover:text-[#7C9082] disabled:opacity-50"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddDialog("monday")}
            className="flex items-center gap-1.5 rounded-full border border-[#2D2D2D] bg-transparent px-4 py-2 text-sm font-medium text-[#2D2D2D] transition-colors hover:bg-[#2D2D2D] hover:text-white"
          >
            <Plus className="size-4" />
            Add Meal
          </button>

          <Link
            href="/generate"
            className="flex items-center gap-1.5 rounded-full bg-[#7C9082] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Sparkles className="size-4" />
            Generate with AI
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {DAYS_OF_WEEK.map((day) => (
          <DayColumn
            key={day}
            day={day}
            items={itemsByDay[day]}
            onAddClick={openAddDialog}
            onRemove={handleRemoveMeal}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Add Meal Dialog */}
      <AddMealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recipes={recipes}
        targetDay={targetDay}
        onAdd={handleAddMeal}
        isPending={isPending}
      />
    </div>
  );
}
