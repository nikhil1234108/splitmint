"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Users } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isRegister = mode === "register";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setMessage("Account created. Please confirm your email before signing in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_420px]">
        <section className="card flex flex-col justify-between p-8 md:p-10">
          <div>
            <div className="eyebrow">SplitMint</div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              Clean expense sharing for small groups.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Create groups, add participants, record expenses, and understand balances without
              confusion. The layout is now focused on clarity first.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="panel-soft">
              <p className="section-title">Groups</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Simple group setup for up to three additional participants.
              </p>
            </div>
            <div className="panel-soft">
              <p className="section-title">Expenses</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Track amount, payer, date, participants, and split mode clearly.
              </p>
            </div>
            <div className="panel-soft">
              <p className="section-title">Balances</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                See who owes whom with easier-to-read summaries and settlement guidance.
              </p>
            </div>
          </div>
        </section>

        <section className="card p-8 md:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <Users size={22} />
            </div>
            <div>
              <p className="section-title">Account access</p>
              <h2 className="mt-1 text-2xl font-semibold">
                {isRegister ? "Create account" : "Sign in"}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Mail size={15} />
                Email
              </span>
              <input
                type="email"
                className="input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <LockKeyhole size={15} />
                Password
              </span>
              <input
                type="password"
                className="input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? "login" : "register");
                setError("");
                setMessage("");
              }}
              className="btn-ghost w-full"
            >
              {isRegister ? "Switch to sign in" : "Switch to register"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
