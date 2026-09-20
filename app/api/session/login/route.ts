import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { simulateOffline } from "@/lib/game/doctrine";
import { OFFLINE_CAP_HOURS } from "@/lib/game/constants";
import { xpForLevel } from "@/lib/game/loot";
export const runtime = "nodejs";
export async function POST() {
  const supa = await createClient();
  const user = (await supa.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const db = adminClient();
  let { data: p } = await db.from("players").select("*").eq("id", user.id).single();
  if (!p) {
    const uname = (user.email ?? "hero").split("@")[0] + Math.floor(Math.random() * 1000);
    const ins = await db.from("players").insert({ id: user.id, username: uname }).select("*").single();
    p = ins.data;
  }
  const { data: doc } = await db.from("doctrines").select("*").eq("player_id", user.id).single();
  const last = doc ? new Date(doc.last_resolved_at).getTime() : Date.now();
  const hours = Math.min(OFFLINE_CAP_HOURS, Math.max(0, (Date.now() - last) / 36e5));
  if (!doc || hours < 0.05) {
    await db.from("doctrines").upsert({ player_id: user.id, last_resolved_at: new Date().toISOString() });
    return NextResponse.json({ player: p, report: null });
  }
  const zone = doc.zone_id ? (await db.from("zones").select("slug").eq("id", doc.zone_id).single()).data : null;
  const sim = simulateOffline(p.class, p.level, { zoneSlug: zone?.slug ?? "forest", riskLevel: doc.risk_level, retreatHpPct: doc.retreat_hp_pct, skillPriority: doc.skill_priority ?? [] }, hours);
  let xp = p.xp + sim.xp; let lvl = p.level;
  while (xp >= xpForLevel(lvl)) { xp -= xpForLevel(lvl); lvl++; }
  await db.from("players").update({ xp, level: lvl, gold: p.gold + sim.gold }).eq("id", user.id);
  const { data: rep } = await db.from("offline_reports").insert({ player_id: user.id, from_ts: new Date(last).toISOString(), gold_gained: sim.gold, xp_gained: sim.xp, items_gained: sim.items, deaths: sim.deaths }).select("*").single();
  await db.from("doctrines").update({ last_resolved_at: new Date().toISOString() }).eq("player_id", user.id);
  return NextResponse.json({ player: { ...p, level: lvl, xp, gold: p.gold + sim.gold }, report: { ...rep, log: sim.log, kills: sim.kills, encounters: sim.encounters } });
}
