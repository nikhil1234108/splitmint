import { generateGeminiText } from "./model";

export interface GroupSummaryInput {
  group_name: string;
  period: string;
  total_spent: number;
  current_user: string;
  net_balance: number;
  top_categories: string[];
  expense_count: number;
  recent_expenses: string[];
}

export function buildSummaryInput(data: GroupSummaryInput) {
  const balanceSummary =
    data.net_balance > 0
      ? `${data.current_user} is owed Rs ${data.net_balance.toFixed(2)}`
      : data.net_balance < 0
        ? `${data.current_user} owes Rs ${Math.abs(data.net_balance).toFixed(2)}`
        : `${data.current_user} is settled up`;

  return {
    group_name: data.group_name,
    period: data.period,
    total_spent: data.total_spent.toFixed(2),
    current_user: data.current_user,
    balance_summary: balanceSummary,
    top_categories: data.top_categories.join(", ") || "none",
    expense_count: data.expense_count,
    recent_expenses: data.recent_expenses.slice(0, 5).join("; ") || "none",
  };
}

export async function generateGroupSummary(data: ReturnType<typeof buildSummaryInput>) {
  const prompt = `
You are MintSense, a helpful financial summary assistant.

Write a concise 2 to 3 sentence summary.
- Be specific with numbers.
- Use "Rs" for money.
- No bullet points.
- No markdown.
- Keep the tone clear and helpful.

Group name: ${data.group_name}
Period: ${data.period}
Total spent: Rs ${data.total_spent}
Current user: ${data.current_user}
Balance summary: ${data.balance_summary}
Top categories: ${data.top_categories}
Expense count: ${data.expense_count}
Recent expenses: ${data.recent_expenses}
`.trim();

  return generateGeminiText(prompt, { temperature: 0.4 });
}
