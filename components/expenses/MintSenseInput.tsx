"use client";

import { useState } from "react";
import type { ParsedExpense } from "@/types";

interface Props {
  members: string[];
  onParsed: (expense: ParsedExpense) => void;
}

const EXAMPLES = [
  "Paid Rs 1200 for dinner with Arjun and Priya, split equally",
  "I paid Rs 800 for cab with Rahul",
  "Hotel cost Rs 3000 and Arjun pays 50 percent",
];

export default function MintSenseInput({ members, onParsed }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/mintsense/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, members }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse");
      }

      const parsedExpense: ParsedExpense = await response.json();
      onParsed(parsedExpense);
      setInput("");
    } catch {
      setError("Could not understand that expense. Try a simpler sentence.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel-soft">
      <div className="text-sm font-semibold text-slate-800">Quick add with MintSense</div>

      <p className="mt-2 text-sm leading-7 text-slate-600">
        Type the expense in plain language and the form below will fill automatically.
      </p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row">
        <input
          className="input flex-1"
          placeholder="Example: Paid Rs 800 for dinner with Arjun, split equally"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void handleParse();
            }
          }}
          disabled={loading}
        />
        <button
          onClick={() => void handleParse()}
          disabled={loading || !input.trim()}
          className="btn-primary min-w-32 disabled:opacity-60"
        >
          {loading ? "Parsing..." : "Use AI"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            onClick={() => setInput(example)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-teal-200 hover:text-slate-900"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
