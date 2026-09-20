// Supabase Edge Function: daily-cleanup (invoked by pg_cron or scheduler).
// Deno runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, key, { auth: { persistSession: false } });
  const r1 = await db.from("offline_reports").delete().lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  const r2 = await db.from("battles").delete().lt("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  await db.from("rooms").delete().eq("status", "closed").lt("created_at", new Date(Date.now() - 36e5).toISOString());
  return new Response(JSON.stringify({ ok: true, r1: r1.error ?? null, r2: r2.error ?? null }), {
    headers: { "content-type": "application/json" },
  });
});
