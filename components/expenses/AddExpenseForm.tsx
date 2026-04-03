"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import type { Category, GroupMember, ParsedExpense, SplitMode } from "@/types";
import MintSenseInput from "./MintSenseInput";

interface Props {
  groupId: string;
  members: GroupMember[];
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORY_LABELS: Record<Category, string> = {
  food: "Food",
  transport: "Transport",
  accommodation: "Accommodation",
  entertainment: "Entertainment",
  utilities: "Utilities",
  shopping: "Shopping",
  other: "Other",
};

const SPLIT_HELPERS: Record<SplitMode, string> = {
  equal: "Everyone selected below will share the expense equally.",
  custom: "Enter the exact amount for each selected person.",
  percentage: "Enter percentages for each selected person. Total must be 100%.",
};

export default function AddExpenseForm({ groupId, members, onSuccess, onCancel }: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [payerId, setPayerId] = useState(members[0]?.id ?? "");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [category, setCategory] = useState<Category>("other");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map((member) => member.id));
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyParsed(parsed: ParsedExpense) {
    if (parsed.description) setDescription(parsed.description);
    if (parsed.amount) setAmount(String(parsed.amount));
    if (parsed.date) setDate(parsed.date);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.split_mode) setSplitMode(parsed.split_mode);

    if (parsed.participants?.length) {
      const matched = members
        .filter((member) =>
          parsed.participants.some(
            (participant) => participant.toLowerCase() === member.display_name.toLowerCase()
          )
        )
        .map((member) => member.id);

      if (matched.length > 0) {
        setSelectedMembers(matched);
      }
    }

    if (parsed.payer) {
      const payer = members.find(
        (member) => member.display_name.toLowerCase() === parsed.payer?.toLowerCase()
      );
      if (payer) {
        setPayerId(payer.id);
      }
    }
  }

  const numericAmount = parseFloat(amount || "0");
  const totalCustom = useMemo(
    () => Object.values(customSplits).reduce((sum, value) => sum + (parseFloat(value) || 0), 0),
    [customSplits]
  );

  const customValid =
    splitMode === "equal" ||
    (splitMode === "percentage"
      ? Math.abs(totalCustom - 100) < 0.01
      : Math.abs(totalCustom - numericAmount) < 0.01);

  async function handleSubmit() {
    if (!description || !amount || selectedMembers.length === 0 || !customValid) {
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      group_id: groupId,
      description,
      amount: parseFloat(amount),
      date,
      payer_id: payerId,
      split_mode: splitMode,
      category,
      participants: selectedMembers,
      custom_splits:
        splitMode !== "equal"
          ? selectedMembers.map((memberId) => ({
              member_id: memberId,
              [splitMode === "percentage" ? "percentage" : "amount"]: parseFloat(
                customSplits[memberId] ?? "0"
              ),
            }))
          : undefined,
    };

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Unable to save expense." }));
        setError(body.error ?? "Unable to save expense.");
        return;
      }

      onSuccess();
    } catch {
      setError("Unable to save expense right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="section-title">Add expense</p>
        <h3 className="mt-2 text-2xl font-semibold">Enter expense details</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Fill the form manually, or use MintSense to prepare it for you.
        </p>
      </div>

      <MintSenseInput members={members.map((member) => member.display_name)} onParsed={applyParsed} />

      <div className="grid gap-6">
        <section className="panel-soft">
          <h4 className="text-base font-semibold text-slate-800">1. Basic details</h4>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
              <input
                className="input"
                placeholder="Example: Dinner at restaurant"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Amount</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Date</span>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Paid by</span>
              <select className="input" value={payerId} onChange={(e) => setPayerId(e.target.value)}>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Category</span>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="panel-soft">
          <h4 className="text-base font-semibold text-slate-800">2. Choose split mode</h4>
          <p className="mt-2 text-sm leading-7 text-slate-600">{SPLIT_HELPERS[splitMode]}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(["equal", "custom", "percentage"] as SplitMode[]).map((mode) => {
              const active = splitMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setSplitMode(mode)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition ${
                    active
                      ? "border-teal-200 bg-teal-50 text-teal-700"
                      : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel-soft">
          <h4 className="text-base font-semibold text-slate-800">3. Select participants</h4>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Choose the people included in this expense.
          </p>

          <div className="mt-4 space-y-3">
            {members.map((member) => {
              const selected = selectedMembers.includes(member.id);

              return (
                <div
                  key={member.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3 md:flex md:items-center md:gap-4"
                >
                  <button
                    onClick={() =>
                      setSelectedMembers((previous) =>
                        selected
                          ? previous.filter((id) => id !== member.id)
                          : [...previous, member.id]
                      )
                    }
                    className="flex w-full flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-slate-900"
                      style={{ background: member.color }}
                    >
                      {member.display_name.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <span className="block text-sm font-medium text-slate-800">{member.display_name}</span>
                      <span className="block text-xs text-slate-500">
                        {selected ? "Included" : "Not included"}
                      </span>
                    </div>
                  </button>

                  {selected && splitMode !== "equal" ? (
                    <input
                      className="input mt-3 w-full md:mt-0 md:w-40"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={splitMode === "percentage" ? "Percent" : "Amount"}
                      value={customSplits[member.id] ?? ""}
                      onChange={(e) =>
                        setCustomSplits((previous) => ({ ...previous, [member.id]: e.target.value }))
                      }
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          {splitMode !== "equal" ? (
            <div
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                customValid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {splitMode === "percentage"
                ? `Current total: ${totalCustom.toFixed(1)}%`
                : `Current total: Rs ${totalCustom.toFixed(2)}`}
            </div>
          ) : null}
        </section>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={onCancel} className="btn-ghost flex-1">
          Cancel
        </button>
        <button
          onClick={() => void handleSubmit()}
          disabled={loading || !description || !amount || !customValid || selectedMembers.length === 0}
          className="btn-primary flex-1 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save expense"}
        </button>
      </div>
    </div>
  );
}
