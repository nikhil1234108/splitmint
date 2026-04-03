import type { MemberBalance, Settlement } from "@/types";
import { generateGeminiText } from "./model";

export async function explainSettlement(
  memberBalances: MemberBalance[],
  settlements: Settlement[]
): Promise<string> {
  const balancesText = memberBalances
    .map((member) => {
      const status =
        member.net_balance > 0
          ? `is owed Rs ${member.net_balance.toFixed(2)}`
          : member.net_balance < 0
            ? `owes Rs ${Math.abs(member.net_balance).toFixed(2)}`
            : "is settled";
      return `${member.display_name} ${status}`;
    })
    .join("\n");

  const settlementsText = settlements
    .map((settlement) => `${settlement.fromName} pays ${settlement.toName} Rs ${settlement.amount.toFixed(2)}`)
    .join("\n");

  const prompt = `
Explain this settlement plan clearly in 2 to 3 sentences.
- Mention that it minimizes the number of transactions.
- Keep it simple and readable.
- Use "Rs" for money.

Balances:
${balancesText}

Settlement plan:
${settlementsText || "No transfers needed."}
`.trim();

  return generateGeminiText(prompt, { temperature: 0.4 });
}
