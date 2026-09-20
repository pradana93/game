"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [err, setErr] = useState("");
  const router = useRouter();
  async function go(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const supa = createClient();
    const res = mode === "in"
      ? await supa.auth.signInWithPassword({ email, password })
      : await supa.auth.signUp({ email, password });
    if (res.error) { setErr(res.error.message); return; }
    await fetch("/api/session/login", { method: "POST" });
    router.push("/play");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Project Doctrine</h1>
      <p className="text-sm text-neutral-400">AQW-style rooms · realtime combat · offline doctrine</p>
      <form onSubmit={go} className="flex flex-col gap-2">
        <input className="rounded border border-neutral-700 bg-neutral-900 p-2" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="rounded border border-neutral-700 bg-neutral-900 p-2" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button className="rounded bg-emerald-600 p-2 font-semibold" type="submit">{mode === "in" ? "Log in" : "Sign up"}</button>
      </form>
      <button className="text-sm underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>
    </main>
  );
}
