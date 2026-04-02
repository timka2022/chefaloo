import { getOrCreateMealPlan, getMealPlanGroceryList } from "@/actions";
import { GroceryListView } from "@/components/grocery-list-view";
import type { GroceryList } from "@/lib/types";
import { ShoppingCart } from "lucide-react";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" });
  const fmtSun = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" });

  const mStr = fmt.format(monday);
  const sStr = fmtSun.format(sunday);

  // "March 30 – April 5" or "March 30 – April 5"
  return `${mStr} – ${sStr}`;
}

export default async function GroceryListPage() {
  const weekStart = getMonday(new Date());

  const mealPlan = await getOrCreateMealPlan(weekStart);

  if ("error" in mealPlan) {
    return (
      <div className="flex h-screen items-center justify-center text-[#2D2D2D]">
        Error loading meal plan: {mealPlan.error}
      </div>
    );
  }

  const recipeCount = mealPlan.items?.length ?? 0;

  // Empty state: no meals planned
  if (recipeCount === 0) {
    return (
      <div className="px-6 lg:px-10 py-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#2D2D2D]">Grocery List</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">
            Week of {formatWeekRange(weekStart)}
          </p>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F0EDE8] flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 text-[#B0AAA0]" />
          </div>
          <p className="text-[#5A5A5A] text-sm text-center max-w-xs">
            No meals planned this week. Add some recipes to your meal plan!
          </p>
        </div>
      </div>
    );
  }

  const groceryListResult = await getMealPlanGroceryList(mealPlan.id);

  if (groceryListResult && typeof (groceryListResult as { error?: string }).error === "string") {
    return (
      <div className="flex h-screen items-center justify-center text-[#2D2D2D]">
        Error loading grocery list: {(groceryListResult as { error: string }).error}
      </div>
    );
  }

  const groceryList: GroceryList = groceryListResult as GroceryList;

  return (
    <GroceryListView
      groceryList={groceryList}
      recipeCount={recipeCount}
      weekLabel={`Week of ${formatWeekRange(weekStart)}`}
    />
  );
}
