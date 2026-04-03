import { z } from "zod";
import type { ParsedExpense } from "@/types";
import { generateGeminiJson } from "./model";

const categories = [
  "food",
  "transport",
  "accommodation",
  "entertainment",
  "utilities",
  "shopping",
  "other",
] as const;

const ExpenseSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().min(1),
  date: z.string().nullable(),
  payer: z.string().nullable(),
  participants: z.array(z.string()),
  split_mode: z.enum(["equal", "custom", "percentage"]),
  splits: z
    .array(
      z.object({
        name: z.string(),
        value: z.coerce.number(),
      })
    )
    .nullable(),
  category: z.enum(categories),
});

const expenseResponseSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: [
    "amount",
    "description",
    "date",
    "payer",
    "participants",
    "split_mode",
    "splits",
    "category",
  ],
  properties: {
    amount: { type: "number" },
    description: { type: "string" },
    date: { type: ["string", "null"] },
    payer: { type: ["string", "null"] },
    participants: {
      type: "array",
      items: { type: "string" },
    },
    split_mode: {
      type: "string",
      enum: ["equal", "custom", "percentage"],
    },
    splits: {
      type: ["array", "null"],
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "value"],
        properties: {
          name: { type: "string" },
          value: { type: "number" },
        },
      },
    },
    category: {
      type: "string",
      enum: [...categories],
    },
  },
};

export async function parseExpense(input: string, members: string[]): Promise<ParsedExpense> {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `
You are MintSense, an expense parser for a shared expense application.

Today's date: ${today}
Known group members: ${members.length > 0 ? members.join(", ") : "not specified"}

Return a JSON object that matches the schema exactly.

Rules:
- Interpret all amounts in INR.
- If no split details are given, use "equal".
- Include the payer in participants when reasonable.
- Match names to the closest known member name where possible.
- Use date in YYYY-MM-DD format.
- Use null for date or payer if unclear.
- For equal split, set splits to null.
- For custom split, set splits to [{ "name": "...", "value": amount_in_inr }].
- For percentage split, set splits to [{ "name": "...", "value": percentage_number }].
- Keep description short and clear.

User input:
${input}
`.trim();

  const parsed = await generateGeminiJson<ParsedExpense>(prompt, expenseResponseSchema);
  return ExpenseSchema.parse(parsed) as ParsedExpense;
}
