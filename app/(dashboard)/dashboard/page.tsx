import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("groups")
    .select("*, members:group_members(*)")
    .order("created_at", { ascending: false });

  const totalGroups = groups?.length ?? 0;
  const totalMembers = groups?.reduce((sum, group) => sum + (group.members?.length ?? 0), 0) ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="card">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="section-title">Overview</p>
            <h1 className="mt-2 text-3xl font-semibold">Your groups</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Create a group, open it, and manage expenses with a simpler and more understandable layout.
            </p>
          </div>
          <Link href="/groups/new" className="btn-primary">
            <Plus size={16} />
            New group
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="metric-card">
          <p className="section-title">Groups</p>
          <p className="mt-3 text-3xl font-semibold">{totalGroups}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Active shared workspaces.</p>
        </div>
        <div className="metric-card">
          <p className="section-title">Participants</p>
          <p className="mt-3 text-3xl font-semibold">{totalMembers}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Members across all groups.</p>
        </div>
        <div className="metric-card">
          <p className="section-title">Focus</p>
          <p className="mt-3 text-3xl font-semibold">Clear</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Simpler cards, cleaner spacing, and easier scanning.
          </p>
        </div>
      </section>

      {!groups?.length ? (
        <section className="card py-14 text-center">
          <Users size={34} className="mx-auto text-teal-700" />
          <h2 className="mt-4 text-2xl font-semibold">No groups yet</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-600">
            Create your first group to start recording participants, expenses, and balances.
          </p>
          <Link href="/groups/new" className="btn-primary mt-6">
            <Plus size={16} />
            Create group
          </Link>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="card transition hover:border-teal-200"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">{group.name}</h2>
                <span className="badge bg-slate-100 text-slate-700">
                  {group.members?.length ?? 0} members
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Open this group to review expenses, balances, and settlement suggestions.
              </p>

              <div className="mt-5 flex -space-x-2">
                {group.members?.slice(0, 5).map((member: { id: string; color: string; display_name: string }) => (
                  <span
                    key={member.id}
                    title={member.display_name}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-sm font-semibold"
                    style={{ background: member.color, color: "#122033" }}
                  >
                    {member.display_name.slice(0, 1).toUpperCase()}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
