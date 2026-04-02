import { getOrCreateMealPlan, getRecipes } from "@/actions";
import { WeeklyPlanner } from "@/components/weekly-planner";

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default async function Home() {
  const weekStart = getMonday(new Date());
  const [mealPlan, recipes] = await Promise.all([
    getOrCreateMealPlan(weekStart),
    getRecipes(),
  ]);

  if ("error" in mealPlan) {
    return (
      <div className="flex h-screen items-center justify-center text-[#2D2D2D]">
        Error loading meal plan: {mealPlan.error}
      </div>
    );
  }
  if ("error" in recipes) {
    return (
      <div className="flex h-screen items-center justify-center text-[#2D2D2D]">
        Error loading recipes: {recipes.error}
      </div>
    );
  }

  return (
    <WeeklyPlanner
      initialMealPlan={mealPlan}
      recipes={recipes}
      initialWeekStart={weekStart}
    />
  );
}
