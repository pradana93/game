import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function PATCH(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { zoneId, riskLevel, retreatHpPct, skillPriority } = await req.json();
  const db = adminClient();
  await db.from("doctrines").upsert({ player_id: user.id, zone_id: zoneId ?? null, risk_level: Math.min(3, Math.max(1, riskLevel ?? 1)), retreat_hp_pct: Math.min(90, Math.max(5, retreatHpPct ?? 30)), skill_priority: skillPriority ?? [] });
  return NextResponse.json({ ok: true });
}
export async function GET() {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { data } = await adminClient().from("doctrines").select("*").eq("player_id", user.id).single();
  return NextResponse.json(data ?? {});
}
