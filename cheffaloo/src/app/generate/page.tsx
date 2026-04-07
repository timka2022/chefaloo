import { Suspense } from "react";
import { RecipeGenerator } from "@/components/recipe-generator";

export default function GeneratePage() {
  return (
    <Suspense>
      <RecipeGenerator />
    </Suspense>
  );
}
