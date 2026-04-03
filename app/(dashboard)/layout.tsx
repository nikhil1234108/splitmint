"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/groups", label: "Groups" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen px-4 py-4 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 md:flex-row">
        <aside className="card w-full md:w-72">
          <div className="mb-6">
            <p className="section-title">SplitMint</p>
            <h1 className="mt-2 text-2xl font-semibold">Expense Dashboard</h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Cleaner navigation and simpler views for groups, expenses, and balances.
            </p>
          </div>

          <nav className="space-y-2">
            {nav.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <button onClick={signOut} className="btn-ghost mt-6 w-full">
            Sign out
          </button>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
