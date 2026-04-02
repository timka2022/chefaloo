"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Clock, Users, Star, Utensils, BookOpen, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { archiveRecipe, getArchivedRecipes } from "@/actions";
import type { Recipe } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "all" | "most-cooked" | "top-rated" | "quick-meals" | "archived";

interface SavedRecipesProps {
  recipes: Recipe[];
  defaultTab?: Tab;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GRADIENT_PAIRS = [
  "from-amber-50 to-orange-50",
  "from-green-50 to-emerald-50",
  "from-blue-50 to-indigo-50",
  "from-rose-50 to-pink-50",
  "from-purple-50 to-violet-50",
  "from-yellow-50 to-amber-50",
];

function getGradient(id: string): string {
  // Stable pseudo-random based on id chars
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];
}

function StarRating({ rating }: { rating: number | null | undefined }) {
  const value = rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < Math.round(value)
              ? "fill-[#F59E0B] text-[#F59E0B]"
              : "fill-transparent text-[#D1CCC5]"
          }`}
        />
      ))}
      {value > 0 && (
        <span className="text-xs text-[#8A8A8A] ml-1">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recipe card
// ---------------------------------------------------------------------------

function RecipeCard({
  recipe,
  onArchive,
}: {
  recipe: Recipe;
  onArchive?: (id: string) => void;
}) {
  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const gradient = getGradient(recipe.id);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/recipes/${recipe.id}`}
        className="bg-white rounded-2xl border border-[#E8E4DF] overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow"
      >
        {/* Image area */}
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-40 object-cover shrink-0" />
        ) : (
          <div
            className={`h-40 bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
          >
            <Utensils className="w-10 h-10 text-[#C4B9A8]" />
          </div>
        )}

        <div className="p-4 flex flex-col gap-2 flex-1">
          {/* Title */}
          <h3 className="font-medium text-[#2D2D2D] text-sm leading-snug line-clamp-2">
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

          {/* Star rating */}
          <StarRating rating={recipe.average_rating} />

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-[#F0EDE8] text-[#5A5A5A] rounded-full px-2.5 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Archive button — shown on hover */}
      {onArchive && hovered && (
        <button
          type="button"
          title="Archive recipe"
          onClick={(e) => {
            e.preventDefault();
            onArchive(recipe.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-[#E8E4DF] shadow-sm flex items-center justify-center hover:bg-[#F0EDE8] transition-colors"
        >
          <Archive className="w-3.5 h-3.5 text-[#5A5A5A]" />
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Archived recipe card (with Unarchive button)
// ---------------------------------------------------------------------------

function ArchivedRecipeCard({
  recipe,
  onUnarchive,
}: {
  recipe: Recipe;
  onUnarchive: (id: string) => void;
}) {
  const totalTime =
    (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  const gradient = getGradient(recipe.id);

  return (
    <div className="relative">
      <Link
        href={`/recipes/${recipe.id}`}
        className="bg-white rounded-2xl border border-[#E8E4DF] overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow opacity-75 hover:opacity-100"
      >
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recipe.image_url} alt={recipe.title} className="w-full h-40 object-cover shrink-0" />
        ) : (
          <div
            className={`h-40 bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
          >
            <Utensils className="w-10 h-10 text-[#C4B9A8]" />
          </div>
        )}

        <div className="p-4 flex flex-col gap-2 flex-1">
          <h3 className="font-medium text-[#2D2D2D] text-sm leading-snug line-clamp-2">
            {recipe.title}
          </h3>
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
          <StarRating rating={recipe.average_rating} />
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-[#F0EDE8] text-[#5A5A5A] rounded-full px-2.5 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Unarchive button */}
      <button
        type="button"
        title="Unarchive recipe"
        onClick={(e) => {
          e.preventDefault();
          onUnarchive(recipe.id);
        }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 border border-[#E8E4DF] shadow-sm flex items-center justify-center hover:bg-[#F0EDE8] transition-colors"
      >
        <ArchiveRestore className="w-3.5 h-3.5 text-[#5A5A5A]" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "most-cooked", label: "Most Cooked" },
  { id: "top-rated", label: "Top Rated" },
  { id: "quick-meals", label: "Quick Meals" },
  { id: "archived", label: "Archived" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SavedRecipes({ recipes: initialRecipes, defaultTab = "all" }: SavedRecipesProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [archivedRecipes, setArchivedRecipes] = useState<Recipe[]>([]);
  const [archivedLoaded, setArchivedLoaded] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);

  async function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "archived" && !archivedLoaded) {
      setArchivedLoading(true);
      const result = await getArchivedRecipes();
      setArchivedLoading(false);
      if ("error" in result) {
        toast.error("Failed to load archived recipes");
      } else {
        setArchivedRecipes(result);
        setArchivedLoaded(true);
      }
    }
  }

  async function handleArchive(id: string) {
    // Optimistically remove from list
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    const result = await archiveRecipe(id, true);
    if ("error" in result) {
      toast.error(result.error);
      // Restore on failure
      setRecipes(initialRecipes);
    } else {
      toast.success("Recipe archived");
      // Invalidate archived cache so it reloads next time
      setArchivedLoaded(false);
      setArchivedRecipes([]);
    }
  }

  async function handleUnarchive(id: string) {
    // Optimistically remove from archived list
    setArchivedRecipes((prev) => prev.filter((r) => r.id !== id));
    const result = await archiveRecipe(id, false);
    if ("error" in result) {
      toast.error(result.error);
      // Reload archived on failure
      setArchivedLoaded(false);
    } else {
      toast.success("Recipe unarchived");
    }
  }

  const filtered = useMemo(() => {
    let result = recipes;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Tab filter
    if (activeTab === "top-rated") {
      result = [...result].sort(
        (a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0)
      );
    } else if (activeTab === "quick-meals") {
      result = result.filter(
        (r) =>
          (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0) < 30
      );
    }
    // "most-cooked" — no data yet, falls through to default order

    return result;
  }, [recipes, search, activeTab]);

  const isArchivedTab = activeTab === "archived";

  return (
    <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2D2D]">Saved Recipes</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">
            {isArchivedTab
              ? `${archivedRecipes.length} archived ${archivedRecipes.length === 1 ? "recipe" : "recipes"}`
              : `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"} in your collection`}
          </p>
        </div>

        {/* Search — hidden on archived tab */}
        {!isArchivedTab && (
          <div className="relative shrink-0 w-56">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full h-9 bg-white border border-[#E8E4DF] rounded-full pl-9 pr-4 text-sm text-[#2D2D2D] placeholder:text-[#B0AAA0] focus:outline-none focus:ring-2 focus:ring-[#7C9082]/30 focus:border-[#7C9082] transition-colors"
            />
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#7C9082] text-white"
                : "bg-[#F0EDE8] text-[#5A5A5A] hover:bg-[#E8E4DF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recipe grid */}
      {isArchivedTab ? (
        archivedLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <p className="text-[#8A8A8A] text-sm">Loading archived recipes…</p>
          </div>
        ) : archivedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F0EDE8] flex items-center justify-center">
              <Archive className="w-7 h-7 text-[#B0AAA0]" />
            </div>
            <p className="text-[#5A5A5A] text-sm text-center max-w-xs">
              No archived recipes. Archive a recipe to hide it from your main list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedRecipes.map((recipe) => (
              <ArchivedRecipeCard
                key={recipe.id}
                recipe={recipe}
                onUnarchive={handleUnarchive}
              />
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0EDE8] flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-[#B0AAA0]" />
          </div>
          <p className="text-[#5A5A5A] text-sm text-center max-w-xs">
            {search.trim()
              ? `No recipes match "${search}"`
              : activeTab === "quick-meals"
              ? "No recipes under 30 minutes found."
              : "No recipes yet. Generate one with AI!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onArchive={handleArchive} />
          ))}
        </div>
      )}
    </div>
  );
}
