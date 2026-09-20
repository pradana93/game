import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { resolveTurn, type Combatant } from "@/lib/game/combat";
import { rollLoot, xpForLevel } from "@/lib/game/loot";
export const runtime = "nodejs";
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await ctx.params;
  const { skillId } = await req.json();
  const db = adminClient();
  const { data: b } = await db.from("battles").select("*").eq("id", id).single();
  if (!b || b.state !== "active") return NextResponse.json({ error: "battle" }, { status: 404 });
  const parts = b.participants as Combatant[];
  const ai = parts.findIndex((p) => p.id === user.id);
  if (ai < 0) return NextResponse.json({ error: "not-in" }, { status: 403 });
  const bi = ai === 0 ? 1 : 0;
  const res = resolveTurn({ ...parts[ai] }, { ...parts[bi] }, skillId, Date.now() % 100000);
  parts[bi] = { ...parts[bi], hp: res.targetHp };
  parts[ai] = { ...parts[ai], hp: res.casterHp, mp: res.casterMp };
  const log = [...(b.log as string[]), res.log];
  let winner: string | null = res.killed ? parts[ai].id : null;
  if (winner) {
    const loot = rollLoot(parts[bi].level, 1, Date.now() % 100000);
    const { data: me } = await db.from("players").select("xp,level,gold").eq("id", user.id).single();
    if (me) {
      let xp = me.xp + loot.xp; let lvl = me.level;
      while (xp >= xpForLevel(lvl)) { xp -= xpForLevel(lvl); lvl++; }
      await db.from("players").update({ xp, level: lvl, gold: me.gold + loot.gold }).eq("id", user.id);
    }
    log.push(`${parts[ai].name} wins (+${loot.gold}g +${loot.xp}xp)`);
    await db.from("battles").update({ participants: parts, log, state: "done", winner_id: winner }).eq("id", id);
    if (b.room_id) await (await import("@/lib/realtime/budget")).safeSend(db as never, `room:${b.room_id}`, "battle_ended", { battleId: id, winner });
  } else {
    await db.from("battles").update({ participants: parts, log }).eq("id", id);
  }
  await (await import("@/lib/realtime/budget")).safeSend(db as never, `battle:${id}`, "turn_resolved", { hpA: parts[0].hp, hpB: parts[1].hp, log: log.slice(-5) });
  if (b.room_id) await (await import("@/lib/realtime/budget")).safeSend(db as never, `room:${b.room_id}`, "battle_tick", { battleId: id, hpA: parts[0].hp, hpB: parts[1].hp });
  return NextResponse.json({ hpA: parts[0].hp, hpB: parts[1].hp, log: log.slice(-5), winner });
}
