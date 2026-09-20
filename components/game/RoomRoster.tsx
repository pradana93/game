"use client";
import { useGame } from "@/store/gameStore";

export default function RoomRoster({ onChallenge }: { onChallenge: (pid: string) => void }) {
  const members = useGame((s) => s.members);
  const me = useGame((s) => s.playerId);
  return (
    <div className="flex flex-col gap-1 p-2 text-sm">
      <p className="font-semibold">Room ({members.length}/8)</p>
      {members.map((m) => (
        <div key={m.player_id} className="flex items-center justify-between rounded bg-neutral-800 px-2 py-1">
          <span>{m.username} · Lv{m.level}</span>
          {m.player_id !== me && (
            <button className="rounded bg-red-700 px-2 py-0.5 text-xs" onClick={() => onChallenge(m.player_id)}>Duel</button>
          )}
        </div>
      ))}
    </div>
  );
}
