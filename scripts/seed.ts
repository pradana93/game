import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: zones } = await db.from("zones").select("id,slug");
  console.log("zones:", zones?.map((z) => z.slug).join(","));
  const { data: items } = await db.from("items").select("slug").limit(20);
  console.log("items:", items?.length ?? 0);
  console.log("seed ok (migrations carry canonical seed data)");
}
main().catch((e) => { console.error(e); process.exit(1); });
