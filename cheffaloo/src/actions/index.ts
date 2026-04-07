"use server";

import { createClient } from "@/lib/supabase/server";
import { generateRecipeWithAI } from "@/lib/openai";
import { generateGroceryList } from "@/lib/grocery";
import { searchFoodImage } from "@/lib/unsplash";
import type {
  Recipe,
  RecipeIngredient,
  MealPlan,
  MealPlanItem,
  RecipeReview,
  GeneratedRecipe,
  GroceryList,
  DietaryPreference,
} from "@/lib/types";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Not authenticated");
  }
  return { supabase, userId: user.id };
}

// ---------------------------------------------------------------------------
// Recipe Actions
// ---------------------------------------------------------------------------

export async function createRecipe(
  recipe: GeneratedRecipe
): Promise<Recipe | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data: inserted, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: recipe.title,
      description: recipe.description,
      image_url: recipe.image_url ?? null,
      servings: recipe.servings,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      instructions_json: recipe.instructions,
      tags: recipe.tags,
    })
    .select()
    .single();

  if (recipeError || !inserted) {
    return { error: recipeError?.message ?? "Failed to create recipe" };
  }

  const ingredients = recipe.ingredients.map((ing) => ({
    recipe_id: inserted.id,
    ingredient_name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    grocery_category: ing.grocery_category,
  }));

  const { data: insertedIngredients, error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .insert(ingredients)
    .select();

  if (ingredientsError) {
    return { error: ingredientsError.message };
  }

  return {
    ...inserted,
    ingredients: insertedIngredients as RecipeIngredient[],
  } as Recipe;
}

export async function generateRecipe(
  prompt: string
): Promise<GeneratedRecipe | { error: string }> {
  try {
    const prefsResult = await getDietaryPreferences();
    const restrictions: string[] = Array.isArray(prefsResult)
      ? prefsResult.map((p) => p.preference)
      : [];

    const recipe = await generateRecipeWithAI(prompt, restrictions);
    const image_url = await searchFoodImage(recipe.title);
    return { ...recipe, image_url: image_url ?? undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate recipe";
    return { error: message };
  }
}

export async function getRecipes(): Promise<Recipe[] | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_reviews(rating)
    `
    )
    .eq("user_id", userId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return (data ?? []).map((row: any) => {
    const reviews: { rating: number }[] = row.recipe_reviews ?? [];
    const average_rating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
          reviews.length
        : null;

    const { recipe_reviews: _reviews, ...rest } = row;
    return { ...rest, average_rating } as Recipe;
  });
}

export async function getRecipe(
  id: string
): Promise<Recipe | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_ingredients(*),
      recipe_reviews(*)
    `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Recipe not found" };
  }

  const userReview =
    (data.recipe_reviews as RecipeReview[])?.find(
      (r) => r.user_id === userId
    ) ?? null;

  return {
    ...data,
    ingredients: data.recipe_ingredients as RecipeIngredient[],
    review: userReview,
  } as Recipe;
}

export async function deleteRecipe(
  id: string
): Promise<{ success: true } | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function archiveRecipe(
  id: string,
  archived: boolean
): Promise<{ success: true } | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("recipes")
    .update({ archived })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function getArchivedRecipes(): Promise<Recipe[] | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_reviews(rating)
    `
    )
    .eq("user_id", userId)
    .eq("archived", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return (data ?? []).map((row: any) => {
    const reviews: { rating: number }[] = row.recipe_reviews ?? [];
    const average_rating =
      reviews.length > 0
        ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) /
          reviews.length
        : null;

    const { recipe_reviews: _reviews, ...rest } = row;
    return { ...rest, average_rating } as Recipe;
  });
}

// ---------------------------------------------------------------------------
// Meal Plan Actions
// ---------------------------------------------------------------------------

export async function getOrCreateMealPlan(
  weekStartDate: string
): Promise<MealPlan | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  // Try to find an existing plan for this week
  const { data: existing, error: fetchError } = await supabase
    .from("meal_plans")
    .select(
      `
      *,
      meal_plan_items(
        *,
        recipes(
          *,
          recipe_ingredients(*)
        )
      )
    `
    )
    .eq("user_id", userId)
    .eq("week_start_date", weekStartDate)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (existing) {
    return normalizeMealPlan(existing);
  }

  // Create a new plan (upsert to avoid race-condition duplicate key errors)
  const { data: created, error: createError } = await supabase
    .from("meal_plans")
    .upsert(
      { user_id: userId, week_start_date: weekStartDate },
      { onConflict: "user_id,week_start_date" }
    )
    .select()
    .single();

  if (createError || !created) {
    return { error: createError?.message ?? "Failed to create meal plan" };
  }

  return { ...created, items: [] } as MealPlan;
}

export async function addMealToPlan(
  mealPlanId: string,
  recipeId: string,
  day: string,
  mealType: string = "dinner"
): Promise<MealPlanItem | { error: string }> {
  const { supabase } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("meal_plan_items")
    .insert({
      meal_plan_id: mealPlanId,
      recipe_id: recipeId,
      planned_day: day,
      meal_type: mealType,
      servings: 1,
    })
    .select(
      `
      *,
      recipes(
        *,
        recipe_ingredients(*)
      )
    `
    )
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to add meal to plan" };
  }

  return normalizeMealPlanItem(data);
}

export async function removeMealFromPlan(
  itemId: string
): Promise<{ success: true } | { error: string }> {
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("meal_plan_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Grocery List
// ---------------------------------------------------------------------------

export async function getMealPlanGroceryList(
  mealPlanId: string
): Promise<GroceryList | { error: string }> {
  const { supabase } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("meal_plan_items")
    .select(
      `
      *,
      recipes(
        *,
        recipe_ingredients(*)
      )
    `
    )
    .eq("meal_plan_id", mealPlanId);

  if (error) {
    return { error: error.message };
  }

  const items = (data ?? []).map(normalizeMealPlanItem);
  return generateGroceryList(items);
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function submitReview(
  recipeId: string,
  rating: number,
  notes: string | null,
  wouldMakeAgain: boolean
): Promise<RecipeReview | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("recipe_reviews")
    .upsert(
      {
        recipe_id: recipeId,
        user_id: userId,
        rating,
        notes,
        would_make_again: wouldMakeAgain,
      },
      { onConflict: "recipe_id,user_id" }
    )
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to submit review" };
  }

  return data as RecipeReview;
}

export async function getRecipeReview(
  recipeId: string
): Promise<RecipeReview | null | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("recipe_reviews")
    .select("*")
    .eq("recipe_id", recipeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  return data as RecipeReview | null;
}

// ---------------------------------------------------------------------------
// Dietary Preferences
// ---------------------------------------------------------------------------

export async function getDietaryPreferences(): Promise<DietaryPreference[] | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("dietary_preferences")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message };
  }

  return (data ?? []) as DietaryPreference[];
}

export async function addDietaryPreference(
  preference: string,
  type: 'allergy' | 'preference' = 'allergy'
): Promise<DietaryPreference | { error: string }> {
  const { supabase, userId } = await getAuthenticatedClient();
  const { data, error } = await supabase
    .from("dietary_preferences")
    .insert({ user_id: userId, preference, type })
    .select()
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to add preference" };
  }

  return data as DietaryPreference;
}

export async function removeDietaryPreference(
  id: string
): Promise<{ success: true } | { error: string }> {
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase
    .from("dietary_preferences")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Internal normalizers
// ---------------------------------------------------------------------------

function normalizeMealPlan(raw: any): MealPlan {
  const items: MealPlanItem[] = (raw.meal_plan_items ?? []).map(
    normalizeMealPlanItem
  );
  const { meal_plan_items: _, ...rest } = raw;
  return { ...rest, items } as MealPlan;
}

function normalizeMealPlanItem(raw: any): MealPlanItem {
  const recipe: Recipe | undefined = raw.recipes
    ? {
        ...raw.recipes,
        ingredients: raw.recipes.recipe_ingredients as RecipeIngredient[],
      }
    : undefined;

  const { recipes: _, ...rest } = raw;
  return { ...rest, recipe } as MealPlanItem;
}
