import { getRecipes } from "@/actions";
import { SavedRecipes } from "@/components/saved-recipes";

export default async function RecipesPage() {
  const result = await getRecipes();

  if ("error" in result) {
    return (
      <div className="flex h-screen items-center justify-center text-[#2D2D2D]">
        Error loading recipes: {result.error}
      </div>
    );
  }

  return <SavedRecipes recipes={result} />;
}
