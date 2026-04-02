import { MealPlanItem, GroceryList, GroceryItem } from './types';

export function generateGroceryList(items: MealPlanItem[]): GroceryList {
  // Collect all ingredients from all recipes in the meal plan
  const merged = new Map<string, GroceryItem>();

  for (const planItem of items) {
    const ingredients = planItem.recipe?.ingredients ?? [];

    for (const ingredient of ingredients) {
      const normalizedName = normalizeIngredientName(ingredient.ingredient_name);
      const unit = ingredient.unit ?? '';
      // Key includes unit so "1 cup flour" and "2 tbsp flour" remain separate entries
      const key = `${normalizedName}__${unit}__${ingredient.grocery_category}`;

      if (merged.has(key)) {
        const existing = merged.get(key)!;
        if (ingredient.quantity !== null) {
          existing.quantity += ingredient.quantity;
        }
      } else {
        merged.set(key, {
          ingredient_name: normalizedName,
          quantity: ingredient.quantity ?? 0,
          unit,
          grocery_category: ingredient.grocery_category,
          checked: false,
        });
      }
    }
  }

  // Group by grocery_category
  const grouped: GroceryList = {};

  for (const item of merged.values()) {
    const category = item.grocery_category || 'Uncategorized';

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(item);
  }

  // Sort each category's items alphabetically by ingredient name
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) =>
      a.ingredient_name.localeCompare(b.ingredient_name)
    );
  }

  return grouped;
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim().replace(/s$/, ''); // basic singularization
}
