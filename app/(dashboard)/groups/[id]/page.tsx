"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase/client";
import { groupStats } from "@/lib/balance-engine";
import AddExpenseForm from "@/components/expenses/AddExpenseForm";
import BalanceTable from "@/components/balance/BalanceTable";
import type { Expense, Group, GroupMember, MemberBalance } from "@/types";

const CATEGORY_META: Record<string, { label: string; tone: string }> = {
  food: { label: "Food", tone: "cat-food" },
  transport: { label: "Transport", tone: "cat-transport" },
  accommodation: { label: "Stay", tone: "cat-accommodation" },
  entertainment: { label: "Fun", tone: "cat-entertainment" },
  utilities: { label: "Utilities", tone: "cat-utilities" },
  shopping: { label: "Shopping", tone: "cat-shopping" },
  other: { label: "Other", tone: "cat-other" },
};

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [search, setSearch] = useState("");
  const [participantFilter, setParticipantFilter] = useState("all");
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [{ data: authData }, groupRes, expenseRes, balanceRes] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("groups").select("*, members:group_members(*)").eq("id", id).single(),
      fetch(`/api/expenses?group_id=${id}`).then((response) => response.json()),
      supabase.from("member_balances").select("*").eq("group_id", id),
    ]);

    const nextGroup = groupRes.data;
    const members = (nextGroup?.members ?? []) as GroupMember[];
    const currentMember = members.find((member) => member.user_id === authData.user?.id);

    setGroup(nextGroup);
    setExpenses(Array.isArray(expenseRes) ? expenseRes : []);
    setBalances(balanceRes.data ?? []);
    setCurrentMemberId(currentMember?.id ?? "");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function fetchSummary() {
    if (!group) return;

    setLoadingSummary(true);
    setSummary("");

    const members = (group.members ?? []) as GroupMember[];
    const me = members.find((member) => member.id === currentMemberId);
    const myBalance = balances.find((balance) => balance.member_id === currentMemberId);

    const topCategories = Object.entries(
      expenses.reduce<Record<string, number>>((accumulator, expense) => {
        accumulator[expense.category] = (accumulator[expense.category] ?? 0) + expense.amount;
        return accumulator;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);

    const response = await fetch("/api/mintsense/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_name: group.name,
        period: "this month",
        total_spent: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        current_user: me?.display_name ?? "You",
        net_balance: myBalance?.net_balance ?? 0,
        top_categories: topCategories,
        expense_count: expenses.length,
        recent_expenses: expenses.slice(0, 5).map((expense) => `${expense.description} Rs ${expense.amount}`),
      }),
    });

    const reader = response.body?.getReader();
    if (!reader) {
      setSummary("Unable to generate a summary right now.");
      setLoadingSummary(false);
      return;
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setSummary((previous) => (previous ?? "") + decoder.decode(value));
    }

    setLoadingSummary(false);
  }

  const stats = groupStats(expenses, currentMemberId, balances);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !query ||
        expense.description.toLowerCase().includes(query) ||
        expense.payer?.display_name.toLowerCase().includes(query);

      const matchesParticipant =
        participantFilter === "all" ||
        expense.payer_id === participantFilter ||
        expense.splits?.some((split) => split.member_id === participantFilter);

      return matchesSearch && matchesParticipant;
    });
  }, [expenses, participantFilter, search]);

  if (loading) {
    return <div className="card text-center text-slate-600">Loading group...</div>;
  }

  if (!group) {
    return <p className="text-slate-600">Group not found.</p>;
  }

  const members = (group.members ?? []) as GroupMember[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">Group</p>
            <h1 className="mt-2 text-3xl font-semibold">{group.name}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {members.length} members and {expenses.length} expenses in one clear view.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchSummary}
              disabled={loadingSummary || expenses.length === 0}
              className="btn-ghost disabled:opacity-60"
            >
              {loadingSummary ? "Loading..." : "AI summary"}
            </button>
            <button onClick={() => setShowAddExpense(true)} className="btn-primary">
              Add expense
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="metric-card">
          <p className="section-title">Total spent</p>
          <p className="mt-3 text-3xl font-semibold">Rs {stats.totalSpent.toFixed(2)}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Combined value of all recorded expenses.</p>
        </div>
        <div className="metric-card">
          <p className="section-title">You owe</p>
          <p className="mt-3 text-3xl font-semibold">{stats.iOwe.toFixed(2)}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Amount currently owed by you.</p>
        </div>
        <div className="metric-card">
          <p className="section-title">Owed to you</p>
          <p className="mt-3 text-3xl font-semibold">{stats.owedToMe.toFixed(2)}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Amount currently owed back to you.</p>
        </div>
      </section>

      {summary !== null ? (
        <section className="card">
          <div className="text-sm font-semibold text-teal-700">MintSense summary</div>
          <p className="mt-3 text-sm leading-8 text-slate-700">
            {summary}
            {loadingSummary ? <span className="cursor-blink ml-1 text-teal-700">|</span> : null}
          </p>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <section className="space-y-4">
          <div className="card">
            <div className="flex flex-col gap-4">
              <div>
                <p className="section-title">Expenses</p>
                <h2 className="mt-2 text-2xl font-semibold">Transaction history</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <input
                  className="input"
                  placeholder="Search by description or payer"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className="input"
                  value={participantFilter}
                  onChange={(e) => setParticipantFilter(e.target.value)}
                >
                  <option value="all">All participants</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {showAddExpense ? (
            <div className="card">
              <AddExpenseForm
                groupId={id}
                members={members}
                onSuccess={() => {
                  setShowAddExpense(false);
                  void fetchData();
                }}
                onCancel={() => setShowAddExpense(false)}
              />
            </div>
          ) : null}

          {filteredExpenses.length === 0 ? (
            <div className="card py-12 text-center text-sm leading-7 text-slate-600">
              {search || participantFilter !== "all"
                ? "No expenses match the current filters."
                : "No expenses yet. Add the first one to start the ledger."}
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const meta = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
              return (
                <article key={expense.id} className="card">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${meta.tone}`}>{meta.label}</span>
                        <span className="text-xs text-slate-500">{format(new Date(expense.date), "d MMM yyyy")}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold">{expense.description}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Paid by {expense.payer?.display_name ?? "Unknown"}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-lg font-semibold">Rs {expense.amount.toFixed(2)}</p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <section>
          <BalanceTable balances={balances} />
        </section>
      </div>
    </div>
  );
}
