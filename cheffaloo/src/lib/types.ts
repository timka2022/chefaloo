export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  servings: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  instructions_json: string[];
  tags: string[];
  created_at: string;
  ingredients?: RecipeIngredient[];
  review?: RecipeReview | null;
  average_rating?: number | null;
  archived?: boolean;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_name: string;
  quantity: number | null;
  unit: string | null;
  grocery_category: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  created_at: string;
  items?: MealPlanItem[];
}

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  recipe_id: string;
  planned_day: string;
  meal_type: string;
  servings: number;
  recipe?: Recipe;
}

export interface RecipeReview {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number;
  notes: string | null;
  would_make_again: boolean;
  created_at: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  item_name: string;
  always_available: boolean;
}

// AI generation types
export interface GeneratedRecipe {
  title: string;
  description: string;
  servings: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
    grocery_category: string;
  }[];
  instructions: string[];
  tags: string[];
  image_url?: string;
}

export interface GroceryItem {
  ingredient_name: string;
  quantity: number;
  unit: string;
  grocery_category: string;
  checked: boolean;
}

export interface GroceryList {
  [category: string]: GroceryItem[];
}

export interface DietaryPreference {
  id: string;
  user_id: string;
  preference: string;
  type: 'allergy' | 'preference';
  created_at: string;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
