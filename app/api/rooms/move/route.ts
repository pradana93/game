import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { GROUND_Y_MIN, GROUND_Y_MAX, WORLD_W, MAX_MOVE_DIST, MOVE_COOLDOWN_MS } from "@/lib/game/constants";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { x, y } = await req.json();
  if (!Number.isFinite(x) || !Number.isFinite(y)) return NextResponse.json({ error: "coords" }, { status: 400 });
  if (x < 0 || x > WORLD_W || y < GROUND_Y_MIN || y > GROUND_Y_MAX) return NextResponse.json({ error: "walk" }, { status: 400 });
  const db = adminClient();
  const { data: p } = await db.from("players").select("current_room_id").eq("id", user.id).single();
  if (!p?.current_room_id) return NextResponse.json({ error: "room" }, { status: 400 });
  const { data: m } = await db.from("room_members").select("x,y,last_move_at").eq("room_id", p.current_room_id).eq("player_id", user.id).single();
  if (!m) return NextResponse.json({ error: "member" }, { status: 400 });
  if (Date.now() - new Date(m.last_move_at).getTime() < MOVE_COOLDOWN_MS) return NextResponse.json({ error: "cooldown" }, { status: 429 });
  if (Math.hypot(x - m.x, y - m.y) > MAX_MOVE_DIST) return NextResponse.json({ error: "dist" }, { status: 400 });
  await db.from("room_members").update({ x: Math.round(x), y: Math.round(y), last_move_at: new Date().toISOString() }).eq("room_id", p.current_room_id).eq("player_id", user.id);
  await (await import("@/lib/realtime/budget")).safeSend(db as never, `room:${p.current_room_id}`, "move_intent", { pid: user.id, x: Math.round(x), y: Math.round(y), t: Date.now() });
  return NextResponse.json({ ok: true });
}
