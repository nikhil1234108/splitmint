import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function createBearerClient(accessToken: string) {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}

// GET /api/groups — list all groups for current user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      members:group_members(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/groups — create group + add members
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createBearerClient(accessToken);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, members } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Group name required" }, { status: 400 });
  }

  if (!members || members.length > 3) {
    return NextResponse.json(
      { error: "Max 3 additional participants allowed" },
      { status: 400 }
    );
  }

  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .insert({ name: name.trim(), created_by: user.id })
    .select()
    .single();

  if (groupErr || !group) {
    return NextResponse.json(
      { error: groupErr?.message ?? "Unable to create group" },
      { status: 500 }
    );
  }

  const allMembers = [
    {
      group_id: group.id,
      user_id: user.id,
      display_name: user.email?.split("@")[0] ?? "Me",
      color: "#0f766e",
    },
    ...members.map((member: { display_name: string; color?: string }) => ({
      group_id: group.id,
      user_id: null,
      display_name: member.display_name,
      color: member.color ?? "#5eead4",
    })),
  ];

  const { error: memberErr } = await supabase.from("group_members").insert(allMembers);

  if (memberErr) {
    await supabase.from("groups").delete().eq("id", group.id);
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  return NextResponse.json(group, { status: 201 });
}

// PATCH /api/groups — update group name
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name } = await req.json();
  const { data, error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", id)
    .eq("created_by", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/groups
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  const { error } = await supabase.from("groups").delete().eq("id", id).eq("created_by", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
