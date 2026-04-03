"use client";

import { useState } from "react";
import { simplifyDebts } from "@/lib/balance-engine";
import type { MemberBalance } from "@/types";

interface Props {
  balances: MemberBalance[];
}

export default function BalanceTable({ balances }: Props) {
  const settlements = simplifyDebts(balances);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  async function fetchExplanation() {
    setLoadingExplanation(true);

    try {
      const response = await fetch("/api/mintsense/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberBalances: balances }),
      });

      const body = await response.json();
      setExplanation(body.explanation ?? "No explanation available.");
    } finally {
      setLoadingExplanation(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-title">Balances</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Net positions</h2>
          </div>
          <span className="badge bg-slate-100 text-slate-700">{balances.length} members</span>
        </div>

        <div className="mt-5 space-y-3">
          {balances.map((balance) => (
            <div
              key={balance.member_id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ background: balance.color }} />
                <span className="text-sm font-medium text-slate-900">{balance.display_name}</span>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  balance.net_balance > 0.01
                    ? "balance-positive"
                    : balance.net_balance < -0.01
                      ? "balance-negative"
                      : "balance-zero"
                }`}
              >
                {balance.net_balance > 0.01
                  ? `+ Rs ${balance.net_balance.toFixed(2)}`
                  : balance.net_balance < -0.01
                    ? `- Rs ${Math.abs(balance.net_balance).toFixed(2)}`
                    : "Settled"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-title">Settlement plan</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recommended transfers</h2>
          </div>
          {settlements.length > 0 ? (
            <button onClick={() => void fetchExplanation()} disabled={loadingExplanation} className="btn-ghost">
              {loadingExplanation ? "Loading..." : "Explain"}
            </button>
          ) : null}
        </div>

        {settlements.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm text-emerald-700">
            Everyone is settled up.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {settlements.map((settlement, index) => (
              <div
                key={`${settlement.from}-${settlement.to}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-900">{settlement.fromName}</span>
                  <span className="text-slate-400">to</span>
                  <span className="text-sm font-medium text-slate-900">{settlement.toName}</span>
                  <span className="ml-auto text-sm font-semibold text-teal-700">
                    Rs {settlement.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {explanation ? (
          <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4">
            <div className="text-sm font-semibold text-teal-700">MintSense explanation</div>
            <p className="mt-3 text-sm leading-7 text-slate-700">{explanation}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
