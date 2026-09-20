import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { makeCombatant } from "@/lib/game/combat";
import type { ClassId } from "@/lib/game/constants";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { targetId, kind } = await req.json();
  const db = adminClient();
  const { data: me } = await db.from("players").select("*").eq("id", user.id).single();
  if (!me?.current_room_id) return NextResponse.json({ error: "room" }, { status: 400 });
  const a = makeCombatant(me.id, me.username, me.class as ClassId, me.level);
  const isMob = typeof targetId === "string" && targetId.startsWith("mob-");
  const d = isMob
    ? { ...makeCombatant(targetId, "Monster", me.class as ClassId, me.level), hp: 40 + me.level * 12, maxHp: 40 + me.level * 12 }
    : await db.from("players").select("*").eq("id", targetId).single().then((r) => r.data ? makeCombatant(r.data.id, r.data.username, r.data.class as ClassId, r.data.level) : null);
  if (!d) return NextResponse.json({ error: "target" }, { status: 404 });
  const { data: b } = await db.from("battles").insert({ room_id: me.current_room_id, kind: kind ?? (isMob ? "pve" : "pvp"), participants: [a, d], log: [`${a.name} engaged ${d.name}`] }).select("id").single();
  await (await import("@/lib/realtime/budget")).safeSend(db as never, `room:${me.current_room_id}`, "battle_started", { battleId: b!.id, a: a.id, b: d.id });
  return NextResponse.json({ battleId: b!.id });
}
