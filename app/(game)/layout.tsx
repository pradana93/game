import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  let uid: string | null = null;
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supa = await createClient();
      uid = (await supa.auth.getUser()).data.user?.id ?? null;
    }
  } catch {
    uid = null;
  }
  if (!uid) redirect("/login");
  return <>{children}</>;
}
