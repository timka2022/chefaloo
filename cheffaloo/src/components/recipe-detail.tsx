"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Users,
  ArrowLeft,
  Heart,
  BookmarkPlus,
  Star,
  Utensils,
  CalendarDays,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { RateRecipeDialog } from "@/components/rate-recipe-dialog";
import { addMealToPlan, getOrCreateMealPlan, archiveRecipe } from "@/actions";
import type { Recipe, RecipeIngredient } from "@/lib/types";
import { DAYS_OF_WEEK, type DayOfWeek } from "@/lib/types";

interface RecipeDetailProps {
  recipe: Recipe;
}

function groupIngredientsByCategory(
  ingredients: RecipeIngredient[]
): Record<string, RecipeIngredient[]> {
  return ingredients.reduce<Record<string, RecipeIngredient[]>>((acc, ing) => {
    const cat = ing.grocery_category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ing);
    return acc;
  }, {});
}

function formatIngredient(ing: RecipeIngredient): string {
  const parts: string[] = [];
  if (ing.quantity !== null) parts.push(String(ing.quantity));
  if (ing.unit) parts.push(ing.unit);
  parts.push(ing.ingredient_name);
  return parts.join(" ");
}

// Monday of current week as YYYY-MM-DD
function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split("T")[0];
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const router = useRouter();
  const [rateOpen, setRateOpen] = useState(false);
  const [mealPlanOpen, setMealPlanOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [addingToMealPlan, setAddingToMealPlan] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleArchive() {
    setArchiving(true);
    const result = await archiveRecipe(recipe.id, true);
    setArchiving(false);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Recipe archived");
      router.push("/recipes");
    }
  }

  const ingredients = recipe.ingredients ?? [];
  const grouped = groupIngredientsByCategory(ingredients);
  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const displayTime = totalTime > 0 ? `${totalTime} min` : null;

  const existingRating = recipe.review?.rating ?? null;

  async function handleAddToMealPlan() {
    setAddingToMealPlan(true);
    const weekStart = currentWeekStart();
    const planResult = await getOrCreateMealPlan(weekStart);

    if ("error" in planResult) {
      toast.error(planResult.error);
      setAddingToMealPlan(false);
      return;
    }

    const itemResult = await addMealToPlan(planResult.id, recipe.id, selectedDay);
    setAddingToMealPlan(false);

    if ("error" in itemResult) {
      toast.error(itemResult.error);
    } else {
      toast.success(`Added to ${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s meal plan!`);
      setMealPlanOpen(false);
    }
  }

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {/* Back link */}
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 text-sm text-[#8A8A8A] hover:text-[#5A5A5A] transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back to Recipes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl">
        {/* ── Left: Image ── */}
        <div className="aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-[#D4C9B8] to-[#B8A898] flex items-center justify-center shrink-0">
          {recipe.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Utensils size={64} className="text-white/60" strokeWidth={1.25} />
          )}
        </div>

        {/* ── Right: Info ── */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <h1 className="text-2xl font-semibold text-[#2D2D2D] leading-snug">
            {recipe.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#8A8A8A]">
            {displayTime && (
              <span className="flex items-center gap-1">
                <Clock size={14} strokeWidth={1.75} />
                {displayTime}
              </span>
            )}
            {displayTime && <span className="text-[#E8E4DF]">·</span>}
            <span className="flex items-center gap-1">
              <Users size={14} strokeWidth={1.75} />
              {recipe.servings} servings
            </span>
            <span className="text-[#E8E4DF]">·</span>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-[#5A5A5A] transition-colors"
            >
              <Heart size={14} strokeWidth={1.75} />
              Save
            </button>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-[#F0EDE8] rounded-full px-3 py-1 text-xs text-[#5A5A5A]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMealPlanOpen(true)}
              className="flex items-center gap-2 bg-[#7C9082] hover:bg-[#6B7F72] text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              <CalendarDays size={15} strokeWidth={1.75} />
              Add to Meal Plan
            </button>
            <button
              type="button"
              className="flex items-center gap-2 border border-[#E8E4DF] hover:bg-[#F5F3EF] text-[#5A5A5A] rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              <BookmarkPlus size={15} strokeWidth={1.75} />
              Save to Favorites
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className="flex items-center gap-2 border border-[#E8E4DF] hover:bg-[#F5F3EF] disabled:opacity-60 text-[#5A5A5A] rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              <Archive size={15} strokeWidth={1.75} />
              {archiving ? "Archiving…" : "Archive"}
            </button>
          </div>

          {/* Description */}
          {recipe.description && (
            <p className="text-sm text-[#5A5A5A] leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-[#2D2D2D] mb-3">
                Ingredients
              </h2>
              <div className="flex flex-col gap-4">
                {Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-medium text-[#2D2D2D] capitalize text-sm mb-1.5">
                      {category}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {items.map((ing) => (
                        <li key={ing.id} className="text-sm text-[#5A5A5A]">
                          &bull; {formatIngredient(ing)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions_json.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-[#2D2D2D] mb-3">
                Instructions
              </h2>
              <ol className="flex flex-col gap-3">
                {recipe.instructions_json.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#5A5A5A]">
                    <span className="font-medium text-[#2D2D2D] shrink-0 w-5 text-right">
                      {i + 1}.
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Rate section */}
          <div className="pt-2 border-t border-[#E8E4DF]">
            <button
              type="button"
              onClick={() => setRateOpen(true)}
              className="flex items-center gap-2 text-sm text-[#8A8A8A] hover:text-[#5A5A5A] transition-colors"
            >
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      existingRating !== null && star <= existingRating
                        ? "fill-[#F59E0B] text-[#F59E0B]"
                        : "fill-[#E8E4DF] text-[#E8E4DF]"
                    }
                  />
                ))}
              </div>
              {existingRating !== null
                ? `You rated this ${existingRating}/5 — update rating`
                : "Rate this recipe"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Rate Dialog ── */}
      <RateRecipeDialog
        open={rateOpen}
        onOpenChange={setRateOpen}
        recipe={recipe}
      />

      {/* ── Add to Meal Plan Dialog ── */}
      <Dialog open={mealPlanOpen} onOpenChange={setMealPlanOpen}>
        <DialogContent className="bg-white rounded-2xl shadow-lg p-6 max-w-xs w-full border-0">
          <DialogTitle className="text-base font-semibold text-[#2D2D2D]">
            Add to Meal Plan
          </DialogTitle>
          <p className="text-sm text-[#8A8A8A] -mt-2">
            Choose the day for{" "}
            <span className="text-[#5A5A5A] font-medium">{recipe.title}</span>
          </p>

          <div className="flex flex-col gap-2 mt-1">
            <label className="text-sm font-medium text-[#2D2D2D]">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
              className="w-full rounded-xl border border-[#E8E4DF] bg-white text-sm text-[#2D2D2D] px-3 py-2 focus:outline-none focus:border-[#7C9082] focus:ring-2 focus:ring-[#7C9082]/20"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <button
              type="button"
              onClick={handleAddToMealPlan}
              disabled={addingToMealPlan}
              className="w-full bg-[#7C9082] hover:bg-[#6B7F72] disabled:opacity-60 text-white rounded-full px-6 py-2.5 text-sm font-medium transition-colors"
            >
              {addingToMealPlan ? "Adding…" : "Add to Plan"}
            </button>
            <button
              type="button"
              onClick={() => setMealPlanOpen(false)}
              className="text-sm text-[#8A8A8A] hover:text-[#5A5A5A] transition-colors py-1 text-center"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
