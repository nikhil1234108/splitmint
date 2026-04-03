import type { ParsedExpense } from "@/types";
import { categorizeExpense } from "./categorize";
import { parseExpense } from "./parse-expense";

export async function runMintSense(input: string, members: string[]): Promise<ParsedExpense> {
  const parsed = await parseExpense(input, members);
  const verifiedCategory = await categorizeExpense(parsed.description);

  return {
    ...parsed,
    category: verifiedCategory,
  };
}
