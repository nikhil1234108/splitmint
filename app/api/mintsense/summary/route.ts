import { NextRequest } from "next/server";
import { buildSummaryInput, generateGroupSummary, GroupSummaryInput } from "@/lib/langchain/group-summary";

export async function POST(req: NextRequest) {
  try {
    const body: GroupSummaryInput = await req.json();
    const input = buildSummaryInput(body);
    const summary = await generateGroupSummary(input);

    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(summary));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[MintSense/summary]", err);
    return new Response("Failed to generate summary", { status: 500 });
  }
}
