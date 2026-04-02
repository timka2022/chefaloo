import { notFound } from "next/navigation";
import { getRecipe } from "@/actions";
import { RecipeDetail } from "@/components/recipe-detail";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getRecipe(id);

  if ("error" in result) {
    notFound();
  }

  return <RecipeDetail recipe={result} />;
}
