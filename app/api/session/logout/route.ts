import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function POST() {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const db = adminClient();
  const { data: p } = await db.from("players").select("current_room_id").eq("id", user.id).single();
  if (p?.current_room_id) {
    await db.from("room_members").delete().eq("room_id", p.current_room_id).eq("player_id", user.id);
    const { count } = await db.from("room_members").select("id", { count: "exact", head: true }).eq("room_id", p.current_room_id);
    await db.from("rooms").update({ current_players: count ?? 0 }).eq("id", p.current_room_id);
  }
  await db.from("players").update({ current_room_id: null, last_seen_at: new Date().toISOString() }).eq("id", user.id);
  await db.from("doctrines").upsert({ player_id: user.id, last_resolved_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
