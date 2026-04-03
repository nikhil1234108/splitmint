import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { equalSplit, percentageSplit } from "@/lib/balance-engine";
import type { SplitMode } from "@/types";

// GET /api/expenses?group_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get("group_id");
  if (!groupId) return NextResponse.json({ error: "group_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      payer:group_members!expenses_payer_id_fkey(*),
      splits:expense_splits(*, member:group_members(*))
    `)
    .eq("group_id", groupId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/expenses — create expense + splits
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    group_id,
    description,
    amount,
    date,
    payer_id,
    split_mode,
    category,
    notes,
    // For custom splits: [{ member_id, amount }]
    // For percentage splits: [{ member_id, percentage }]
    participants, // array of member_ids
    custom_splits,
  } = body;

  // Insert expense
  const { data: expense, error: expErr } = await supabase
    .from("expenses")
    .insert({
      group_id,
      description,
      amount,
      date,
      payer_id,
      split_mode,
      category: category ?? "other",
      notes,
    })
    .select()
    .single();

  if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

  // Compute splits
  let splits: { expense_id: string; member_id: string; amount: number; percentage?: number }[] = [];

  if (split_mode === "equal") {
    const amountMap = equalSplit(amount, participants, payer_id);
    splits = Object.entries(amountMap).map(([member_id, amt]) => ({
      expense_id: expense.id,
      member_id,
      amount: amt,
    }));
  } else if (split_mode === "percentage") {
    const pctMap = percentageSplit(
      amount,
      custom_splits.map((s: { member_id: string; percentage: number }) => ({
        memberId: s.member_id,
        percentage: s.percentage,
      }))
    );
    splits = Object.entries(pctMap).map(([member_id, amt]) => {
      const pct = custom_splits.find((s: { member_id: string }) => s.member_id === member_id)?.percentage;
      return { expense_id: expense.id, member_id, amount: amt, percentage: pct };
    });
  } else {
    // custom — amounts provided directly
    splits = custom_splits.map((s: { member_id: string; amount: number }) => ({
      expense_id: expense.id,
      member_id: s.member_id,
      amount: s.amount,
    }));
  }

  const { error: splitErr } = await supabase.from("expense_splits").insert(splits);
  if (splitErr) return NextResponse.json({ error: splitErr.message }, { status: 500 });

  return NextResponse.json(expense, { status: 201 });
}

// PATCH /api/expenses — update expense (delete old splits, insert new)
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();

  // Delete existing splits
  await supabase.from("expense_splits").delete().eq("expense_id", id);

  // Update expense
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/expenses
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  // Splits are cascade-deleted
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
