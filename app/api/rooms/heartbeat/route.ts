import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function POST() {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const db = adminClient();
  const { data: p } = await db.from("players").select("current_room_id").eq("id", user.id).single();
  if (!p?.current_room_id) return NextResponse.json({ ok: true, idle: true });
  await db.from("room_members").update({ last_heartbeat_at: new Date().toISOString() }).eq("room_id", p.current_room_id).eq("player_id", user.id);
  await db.from("players").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
  return NextResponse.json({ ok: true });
}
