export type SplitMode = "equal" | "custom" | "percentage";

export type Category =
  | "food"
  | "transport"
  | "accommodation"
  | "entertainment"
  | "utilities"
  | "shopping"
  | "other";

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string | null;
  display_name: string;
  color: string;
  avatar_url: string | null;
}

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  date: string;
  payer_id: string;
  split_mode: SplitMode;
  category: Category;
  notes?: string;
  created_at: string;
  payer?: GroupMember;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  amount: number;
  percentage?: number;
  member?: GroupMember;
}

export interface Settlement {
  from: string;       // member_id
  to: string;         // member_id
  amount: number;
  fromName?: string;
  toName?: string;
}

export interface MemberBalance {
  member_id: string;
  display_name: string;
  group_id: string;
  color: string;
  net_balance: number; // positive = is owed, negative = owes
}

// MintSense parsed output
export interface ParsedExpense {
  amount: number;
  description: string;
  date: string | null;
  payer: string | null;
  participants: string[];
  split_mode: SplitMode;
  splits: { name: string; value: number }[] | null;
  category: Category;
}
