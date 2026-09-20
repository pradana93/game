import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { simulatePvp } from "@/lib/game/doctrine";
import type { ClassId } from "@/lib/game/constants";
export const runtime = "nodejs";
// Headless sim vs defender doctrine. Zero Realtime messages — client replays at 300ms/turn.
export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await req.json();
  const db = adminClient();
  const { data: a } = await db.from("players").select("id,username,class,level").eq("id", user.id).single();
  const { data: d } = await db.from("players").select("id,username,class,level").eq("id", id).single();
  if (!a || !d) return NextResponse.json({ error: "nf" }, { status: 404 });
  const { data: ad } = await db.from("doctrines").select("skill_priority").eq("player_id", a.id).single();
  const { data: dd } = await db.from("doctrines").select("skill_priority").eq("player_id", d.id).single();
  const sim = simulatePvp(
    { id: a.id, name: a.username, class: a.class as ClassId, level: a.level },
    { id: d.id, name: d.username, class: d.class as ClassId, level: d.level },
    (ad?.skill_priority as string[]) ?? [], (dd?.skill_priority as string[]) ?? []
  );
  const { data: pv } = await db.from("pvp_matches").insert({ attacker_id: a.id, defender_id: d.id, winner_id: sim.winnerId }).select("id").single();
  return NextResponse.json({ matchId: pv?.id, winnerId: sim.winnerId, log: sim.log });
}
