"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RoomsPage() {
  const [data, setData] = useState<{ zones: { id: string; slug: string; name: string }[]; rooms: { id: string; zone_id: string; instance_number: number; current_players: number; capacity: number }[] }>({ zones: [], rooms: [] });
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => fetch("/api/rooms").then((r) => r.json()).then(setData), 10_000);
    fetch("/api/rooms").then((r) => r.json()).then(setData);
    return () => clearInterval(t);
  }, []);
  async function join(zoneId: string) {
    const r = await fetch("/api/rooms/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ zoneId }) }).then((r) => r.json());
    if (r.roomId) router.push("/play");
  }
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-bold">Room browser (live counts)</h1>
      {data.zones.map((z) => (
        <div key={z.id} className="mt-4 rounded border border-neutral-700 p-3">
          <div className="flex items-center justify-between">
            <b>{z.name}</b>
            <button className="rounded bg-emerald-700 px-3 py-1" onClick={() => join(z.id)}>Join</button>
          </div>
          {data.rooms.filter((r) => r.zone_id === z.id).map((r) => (
            <p key={r.id} className="text-sm text-neutral-300">{z.slug}-{String(r.instance_number).padStart(3, "0")} · {r.current_players}/{r.capacity}</p>
          ))}
        </div>
      ))}
    </main>
  );
}
