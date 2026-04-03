import type { Category } from "@/types";
import { generateGeminiText } from "./model";

const CATEGORIES = [
  "food",
  "transport",
  "accommodation",
  "entertainment",
  "utilities",
  "shopping",
  "other",
] as const;

export async function categorizeExpense(description: string): Promise<Category> {
  const prompt = `
Classify the following expense into exactly one category.

Allowed categories:
food, transport, accommodation, entertainment, utilities, shopping, other

Return only the category word.

Expense:
${description}
`.trim();

  const result = (await generateGeminiText(prompt, { temperature: 0 })).trim().toLowerCase();
  return CATEGORIES.includes(result as Category) ? (result as Category) : "other";
}

export const categorizeChain = {
  async invoke({ description }: { description: string }) {
    return categorizeExpense(description);
  },
};
