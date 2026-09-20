import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { id } = await ctx.params;
  const db = adminClient();
  const { data: b } = await db.from("battles").select("*").eq("id", id).single();
  if (!b) return NextResponse.json({ error: "nf" }, { status: 404 });
  return NextResponse.json(b);
}
