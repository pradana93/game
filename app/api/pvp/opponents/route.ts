import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function GET() {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const db = adminClient();
  const { data: me } = await db.from("players").select("level").eq("id", user.id).single();
  const lvl = me?.level ?? 1;
  const { data } = await db.from("players").select("id,username,level,class").neq("id", user.id).gte("level", Math.max(1, lvl - 3)).lte("level", lvl + 3).limit(5);
  return NextResponse.json({ opponents: data ?? [] });
}
