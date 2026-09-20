import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await ctx.params;
  const db = adminClient();
  const { data: members } = await db.from("room_members").select("room_id,player_id,x,y").eq("room_id", id);
  const pids = (members ?? []).map((m) => m.player_id);
  const { data: players } = pids.length ? await db.from("players").select("id,username,class,level,hp,max_hp,mp,max_mp").in("id", pids) : { data: [] };
  const pmap = new Map((players ?? []).map((p) => [p.id, p]));
  return NextResponse.json({ members: (members ?? []).map((m) => ({ ...m, ...(pmap.get(m.player_id) ?? {}) })) });
}
