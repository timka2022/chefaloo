import OpenAI from 'openai';
import { GeneratedRecipe } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generatedRecipeSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    servings: { type: 'number' },
    prep_time_minutes: { type: 'number' },
    cook_time_minutes: { type: 'number' },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          grocery_category: { type: 'string' },
        },
        required: ['name', 'quantity', 'unit', 'grocery_category'],
        additionalProperties: false,
      },
    },
    instructions: {
      type: 'array',
      items: { type: 'string' },
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'title',
    'description',
    'servings',
    'prep_time_minutes',
    'cook_time_minutes',
    'ingredients',
    'instructions',
    'tags',
  ],
  additionalProperties: false,
};

function validateGeneratedRecipe(data: unknown): data is GeneratedRecipe {
  if (!data || typeof data !== 'object') return false;
  const recipe = data as Record<string, unknown>;

  return (
    typeof recipe.title === 'string' &&
    typeof recipe.description === 'string' &&
    typeof recipe.servings === 'number' &&
    typeof recipe.prep_time_minutes === 'number' &&
    typeof recipe.cook_time_minutes === 'number' &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.length > 0 &&
    Array.isArray(recipe.instructions) &&
    recipe.instructions.length > 0 &&
    Array.isArray(recipe.tags)
  );
}

export async function generateRecipeWithAI(
  prompt: string,
  dietaryRestrictions: string[] = []
): Promise<GeneratedRecipe> {
  const baseInstructions =
    'You are a professional chef and recipe creator. When given a recipe request, generate a complete, detailed, and delicious recipe. Always respond with valid JSON matching the requested schema exactly. Include realistic quantities and clear step-by-step instructions. For grocery_category, use ONLY one of: "proteins", "veggies_and_fruit", "condiments", "other". Never include water as an ingredient. Use pounds (lb) for proteins like chicken, steak, and meat. Use cups for vegetables and fruit.';

  const instructions =
    dietaryRestrictions.length > 0
      ? `${baseInstructions}\n\nIMPORTANT DIETARY RESTRICTIONS: The user has the following allergies and dietary preferences that MUST be respected. Do NOT include any ingredients that conflict with these restrictions: ${dietaryRestrictions.join(', ')}.`
      : baseInstructions;

  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    instructions,
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'generated_recipe',
        schema: generatedRecipeSchema,
        strict: true,
      },
    },
  });

  const content = response.output_text;

  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  const parsed: unknown = JSON.parse(content);

  if (!validateGeneratedRecipe(parsed)) {
    throw new Error('OpenAI response did not match the expected recipe schema');
  }

  return parsed;
}

export async function parseRecipeText(rawText: string): Promise<GeneratedRecipe> {
  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    instructions:
      'You are a professional chef and recipe parser. When given raw recipe text, extract and structure the information into a clean, complete recipe. Infer missing details where necessary. For grocery_category, use ONLY one of: "proteins", "veggies and fruit", "condiments", "other". Never include water as an ingredient. Use pounds (lb) for proteins like chicken, steak, and meat. Use cups for vegetables and fruit. Always respond with valid JSON matching the requested schema exactly.',
    input: rawText,
    text: {
      format: {
        type: 'json_schema',
        name: 'generated_recipe',
        schema: generatedRecipeSchema,
        strict: true,
      },
    },
  });

  const content = response.output_text;

  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  const parsed: unknown = JSON.parse(content);

  if (!validateGeneratedRecipe(parsed)) {
    throw new Error('OpenAI response did not match the expected recipe schema');
  }

  return parsed;
}
