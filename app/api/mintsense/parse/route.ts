import { NextRequest, NextResponse } from "next/server";
import { runMintSense } from "@/lib/langchain/review-chain";

export async function POST(req: NextRequest) {
  try {
    const { input, members } = await req.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        { error: "input string is required" },
        { status: 400 }
      );
    }

    const parsed = await runMintSense(input, members ?? []);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[MintSense/parse]", err);
    return NextResponse.json(
      { error: "Failed to parse expense" },
      { status: 500 }
    );
  }
}
