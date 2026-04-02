"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Search,
  Clock,
  Users,
  Sparkles,
  Loader2,
  Utensils,
} from "lucide-react";
import { generateRecipe, createRecipe, getDietaryPreferences } from "@/actions";
import type { GeneratedRecipe, DietaryPreference } from "@/lib/types";

const QUICK_SUGGESTIONS = [
  "Quick weeknights",
  "High protein",
  "Budget friendly",
  "Vegetarian",
  "Under 30 min",
];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] overflow-hidden shadow-sm animate-pulse">
      <div className="h-40 bg-gradient-to-br from-[#F5F3EF] to-[#E8E4DF]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[#E8E4DF] rounded-full w-3/4" />
        <div className="h-3 bg-[#E8E4DF] rounded-full w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-[#E8E4DF] rounded-full w-16" />
          <div className="h-5 bg-[#E8E4DF] rounded-full w-20" />
        </div>
        <div className="h-9 bg-[#E8E4DF] rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

interface RecipeCardProps {
  recipe: GeneratedRecipe;
}

function RecipeCard({ recipe }: RecipeCardProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  function handleUseRecipe() {
    startSaving(async () => {
      const result = await createRecipe(recipe);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Recipe saved!");
      router.push(`/recipes/${result.id}`);
    });
  }

  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DF] overflow-hidden shadow-sm flex flex-col">
      {/* Image area */}
      {recipe.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.image_url} alt={recipe.title} className="w-full h-40 object-cover flex-shrink-0" />
      ) : (
        <div className="h-40 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center flex-shrink-0">
          <Utensils className="w-10 h-10 text-[#C4B9A8]" />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1 gap-3">
        <h3 className="font-medium text-[#2D2D2D] leading-snug line-clamp-2">
          {recipe.title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[#8A8A8A]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {totalTime > 0 ? `${totalTime} min` : "—"}
          </span>
          <span className="text-[#D1CCC5]">·</span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {recipe.servings} {recipe.servings === 1 ? "serving" : "servings"}
          </span>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="bg-[#F0EDE8] text-[#5A5A5A] rounded-full px-2.5 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Use This Recipe button */}
        <button
          onClick={handleUseRecipe}
          disabled={isSaving}
          className="mt-auto bg-[#7C9082] text-white rounded-full text-sm w-full py-2 font-medium hover:bg-[#6a7d70] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Use This Recipe"
          )}
        </button>
      </div>
    </div>
  );
}

export function RecipeGenerator() {
  const [prompt, setPrompt] = useState("");
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [isGenerating, startGenerating] = useTransition();
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPreference[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getDietaryPreferences().then((result) => {
      if (!("error" in result)) {
        setDietaryPrefs(result);
      }
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    startGenerating(async () => {
      const result = await generateRecipe(trimmed);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setRecipes((prev) => [result, ...prev]);
    });
  }

  function handleSuggestion(suggestion: string) {
    setPrompt(suggestion);
    inputRef.current?.focus();
  }

  const showSkeletons = isGenerating;
  const showResults = recipes.length > 0 || showSkeletons;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#2D2D2D]">
          AI Recipe Generator
        </h1>
        <p className="text-sm text-[#8A8A8A] mt-1">
          Let AI help you discover your next favorite meal
        </p>
      </div>

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative mb-3">
        <div className="relative flex items-center">
          <Search className="absolute left-5 w-4 h-4 text-[#8A8A8A] pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to cook? Try: Pad thai for 4, cheap meals for a week..."
            className="w-full h-12 bg-white border border-[#E8E4DF] shadow-sm rounded-[28px] pl-11 pr-24 text-sm text-[#2D2D2D] placeholder:text-[#B0AAA0] focus:outline-none focus:ring-2 focus:ring-[#7C9082]/30 focus:border-[#7C9082] transition-colors"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="absolute right-2 flex items-center gap-1.5 bg-[#7C9082] text-white text-sm font-medium rounded-full px-4 h-8 hover:bg-[#6a7d70] transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate
          </button>
        </div>
      </form>

      {/* Dietary preferences notice */}
      {dietaryPrefs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs text-[#8A8A8A]">Respecting:</span>
          {dietaryPrefs.map((p) => (
            <span
              key={p.id}
              className="rounded-full bg-[#F0EDE8] text-[#5A5A5A] px-2.5 py-0.5 text-xs"
            >
              {p.preference}
            </span>
          ))}
          <Link
            href="/preferences"
            className="text-xs text-[#7C9082] hover:underline ml-1"
          >
            Edit
          </Link>
        </div>
      ) : (
        <div className="mb-8">
          <Link
            href="/preferences"
            className="text-xs text-[#8A8A8A] hover:text-[#7C9082] transition-colors"
          >
            + Set dietary preferences
          </Link>
        </div>
      )}

      {/* Results grid */}
      {showResults && (
        <section className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {showSkeletons && (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}
            {recipes.map((recipe, idx) => (
              <RecipeCard key={`${recipe.title}-${idx}`} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Suggestions */}
      <section>
        <h2 className="text-sm font-medium text-[#2D2D2D] mb-3">
          Quick Suggestions
        </h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestion(suggestion)}
              className="border border-[#E8E4DF] rounded-full px-4 py-2 text-sm text-[#5A5A5A] hover:bg-[#F5F3EF] cursor-pointer transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
