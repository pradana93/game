import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { zoneId } = await req.json();
  const db = adminClient();
  await db.from("room_members").delete().lt("last_heartbeat_at", new Date(Date.now() - 90e3).toISOString());
  const { data: zone } = await db.from("zones").select("id,slug,max_instances").eq("id", zoneId).single();
  if (!zone) return NextResponse.json({ error: "zone" }, { status: 404 });
  const { data: open } = await db.from("rooms").select("id,current_players,capacity").eq("zone_id", zoneId).eq("status", "open").lt("current_players", 8).order("instance_number").limit(1);
  let room = open?.[0] ?? null;
  if (!room) {
    const { data: count } = await db.from("rooms").select("id").eq("zone_id", zoneId);
    if ((count?.length ?? 0) >= zone.max_instances) return NextResponse.json({ error: "full" }, { status: 429 });
    const inst = (count?.length ?? 0) + 1;
    const { data: nr } = await db.from("rooms").insert({ zone_id: zoneId, instance_number: inst }).select("id,current_players,capacity").single();
    room = nr;
  }
  if (!room) return NextResponse.json({ error: "noroom" }, { status: 500 });
  for (let attempt = 0; attempt < 3; attempt++) {
    const target = room;
    const upd = await db.from("rooms").update({ current_players: target.current_players + 1 }).eq("id", target.id).eq("status", "open").lt("current_players", target.capacity).select("id").single();
    if (!upd.error) break;
    const { data: retry } = await db.from("rooms").select("id,current_players,capacity").eq("zone_id", zoneId).eq("status", "open").lt("current_players", 8).order("instance_number").limit(1);
    if (!retry?.[0]) return NextResponse.json({ error: "full" }, { status: 429 });
    room = retry[0];
    if (attempt === 2) return NextResponse.json({ error: "race" }, { status: 429 });
  }
  const finalRoom = room;
  await db.from("room_members").upsert({ room_id: finalRoom.id, player_id: user.id, x: 100 + Math.floor(Math.random() * 200), y: 500 });
  await db.from("players").update({ current_room_id: finalRoom.id, last_seen_at: new Date().toISOString() }).eq("id", user.id);
  const { data: p } = await db.from("players").select("username").eq("id", user.id).single();
  await (await import("@/lib/realtime/budget")).safeSend(db as never, `room:${finalRoom.id}`, "player_joined", { pid: user.id, username: p?.username ?? "hero" });
  return NextResponse.json({ roomId: finalRoom.id });
}
