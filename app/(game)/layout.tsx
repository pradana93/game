import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  const supa = await createClient();
  const { data } = await supa.auth.getUser();
  if (!data.user) redirect("/login");
  return <>{children}</>;
}
