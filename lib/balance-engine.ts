import type { MemberBalance, Settlement } from "@/types";

/**
 * Compute net balance per member from raw expense + split data.
 * net > 0 → member is owed money
 * net < 0 → member owes money
 */
export function computeNetBalances(
  expenses: { amount: number; payer_id: string }[],
  splits: { member_id: string; amount: number }[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Credit payers
  for (const expense of expenses) {
    balances[expense.payer_id] =
      (balances[expense.payer_id] ?? 0) + expense.amount;
  }

  // Debit share holders
  for (const split of splits) {
    balances[split.member_id] =
      (balances[split.member_id] ?? 0) - split.amount;
  }

  return balances;
}

/**
 * Debt simplification via greedy creditor/debtor matching.
 * Minimizes number of transactions in a group.
 *
 * Example: A owes B ₹100, B owes C ₹100 → A pays C ₹100 directly (1 tx vs 2)
 */
export function simplifyDebts(
  memberBalances: MemberBalance[]
): Settlement[] {
  // Work with mutable copies, rounded to 2dp to avoid float drift
  const creditors = memberBalances
    .filter((m) => m.net_balance > 0.01)
    .map(
      (m): [string, number, string] => [m.member_id, +m.net_balance.toFixed(2), m.display_name]
    )
    .sort((a, b) => b[1] - a[1]); // largest creditor first

  const debtors = memberBalances
    .filter((m) => m.net_balance < -0.01)
    .map(
      (m): [string, number, string] => [m.member_id, +m.net_balance.toFixed(2), m.display_name]
    )
    .sort((a, b) => a[1] - b[1]); // largest debtor first

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const [creditorId, credit, creditorName] = creditors[i];
    const [debtorId, debt, debtorName] = debtors[j]; // debt is negative

    const amount = +(Math.min(credit, -debt)).toFixed(2);

    settlements.push({
      from: debtorId,
      to: creditorId,
      amount,
      fromName: debtorName,
      toName: creditorName,
    });

    creditors[i][1] = +(credit - amount).toFixed(2);
    debtors[j][1] = +(debt + amount).toFixed(2);

    if (creditors[i][1] < 0.01) i++;
    if (Math.abs(debtors[j][1]) < 0.01) j++;
  }

  return settlements;
}

/**
 * Equal split with remainder distributed to payer.
 */
export function equalSplit(
  total: number,
  memberIds: string[],
  payerId: string
): Record<string, number> {
  const n = memberIds.length;
  const base = Math.floor((total * 100) / n) / 100;
  const remainder = +(total - base * n).toFixed(2);

  const splits: Record<string, number> = {};
  for (const id of memberIds) {
    splits[id] = base;
  }
  // Remainder goes to payer
  splits[payerId] = +(splits[payerId] + remainder).toFixed(2);

  return splits;
}

/**
 * Percentage split — validates that percentages sum to 100.
 */
export function percentageSplit(
  total: number,
  memberPercentages: { memberId: string; percentage: number }[]
): Record<string, number> {
  const sum = memberPercentages.reduce((acc, m) => acc + m.percentage, 0);
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`Percentages must sum to 100, got ${sum}`);
  }

  const splits: Record<string, number> = {};
  for (const { memberId, percentage } of memberPercentages) {
    splits[memberId] = +((total * percentage) / 100).toFixed(2);
  }

  return splits;
}

/**
 * Group summary stats for the dashboard cards.
 */
export function groupStats(
  expenses: { amount: number; payer_id: string }[],
  currentMemberId: string,
  memberBalances: MemberBalance[]
) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const myBalance = memberBalances.find(
    (m) => m.member_id === currentMemberId
  );

  return {
    totalSpent: +totalSpent.toFixed(2),
    iOwe: myBalance && myBalance.net_balance < 0
      ? +Math.abs(myBalance.net_balance).toFixed(2)
      : 0,
    owedToMe: myBalance && myBalance.net_balance > 0
      ? +myBalance.net_balance.toFixed(2)
      : 0,
  };
}
