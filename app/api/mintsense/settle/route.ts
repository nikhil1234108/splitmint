import { NextRequest, NextResponse } from "next/server";
import { explainSettlement } from "@/lib/langchain/settlement-explain";
import { simplifyDebts } from "@/lib/balance-engine";
import type { MemberBalance } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { memberBalances }: { memberBalances: MemberBalance[] } =
      await req.json();

    if (!memberBalances?.length) {
      return NextResponse.json(
        { error: "memberBalances array is required" },
        { status: 400 }
      );
    }

    const settlements = simplifyDebts(memberBalances);
    const explanation = await explainSettlement(memberBalances, settlements);

    return NextResponse.json({ settlements, explanation });
  } catch (err) {
    console.error("[MintSense/settle]", err);
    return NextResponse.json(
      { error: "Failed to compute settlements" },
      { status: 500 }
    );
  }
}
