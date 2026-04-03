"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const MEMBER_COLORS = ["#5eead4", "#fbbf24", "#fb7185"];

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [members, setMembers] = useState([
    { display_name: "", color: MEMBER_COLORS[0] },
    { display_name: "", color: MEMBER_COLORS[1] },
    { display_name: "", color: MEMBER_COLORS[2] },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    setLoading(true);

    const trimmedName = name.trim();
    const cleanedMembers = members
      .map((member) => ({ ...member, display_name: member.display_name.trim() }))
      .filter((member) => member.display_name);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          members: cleanedMembers,
        }),
      });

      const body = await response.json().catch(() => ({ error: "Unable to create the group." }));

      if (!response.ok) {
        setError(body.error ?? "Unable to create the group.");
        return;
      }

      router.push(`/groups/${body.id}`);
      router.refresh();
    } catch {
      setError("Unable to create the group right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button type="button" onClick={() => router.push("/dashboard")} className="btn-ghost">
        Back to dashboard
      </button>

      <section className="card p-8 md:p-10">
        <div className="eyebrow">Create group</div>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Set up a new expense group</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Enter a group name and optionally add up to three more participants. Your own account
          will be added automatically.
        </p>

        <form onSubmit={(e) => void handleCreate(e)} className="mt-8 grid gap-6">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Group name</span>
            <input
              className="input"
              placeholder="Example: Goa trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="space-y-4">
            <div>
              <p className="section-title">Participants</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Optional members</h2>
            </div>

            {members.map((member, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-4 md:flex md:items-center md:gap-4"
              >
                <div className="mb-4 flex items-center gap-3 md:mb-0 md:w-56">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-slate-900"
                    style={{ background: member.color }}
                  >
                    {member.display_name.slice(0, 1).toUpperCase() || index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Participant {index + 1}</p>
                    <p className="text-xs text-slate-500">Optional additional member</p>
                  </div>
                </div>

                <input
                  className="input"
                  placeholder="Enter member name"
                  value={member.display_name}
                  onChange={(e) =>
                    setMembers((current) =>
                      current.map((item, memberIndex) =>
                        memberIndex === index ? { ...item, display_name: e.target.value } : item
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create group"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
