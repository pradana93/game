import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function GET() {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const db = adminClient();
  const { data: zones } = await db.from("zones").select("id,slug,name");
  const { data: rooms } = await db.from("rooms").select("id,zone_id,instance_number,current_players,capacity,status").eq("status", "open").order("instance_number").limit(60);
  return NextResponse.json({ zones: zones ?? [], rooms: rooms ?? [] });
}
export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { text } = await req.json();
  if (!text || text.length > 200) return NextResponse.json({ error: "text" }, { status: 400 });
  const db = adminClient();
  const { data: p } = await db.from("players").select("current_room_id,username").eq("id", user.id).single();
  if (!p?.current_room_id) return NextResponse.json({ error: "room" }, { status: 400 });
  await (await import("@/lib/realtime/budget")).safeSend(db as never, `room:${p.current_room_id}`, "chat", { from: p.username, text: String(text).slice(0, 200), t: Date.now() });
  return NextResponse.json({ ok: true });
}
