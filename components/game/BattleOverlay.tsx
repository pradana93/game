"use client";
import { useGame } from "@/store/gameStore";

export default function BattleOverlay({ onTurn }: { onTurn: (skillId: string) => void }) {
  const battle = useGame((s) => s.battle);
  if (!battle) return null;
  return (
    <div className="absolute left-2 top-2 max-h-48 w-64 overflow-y-auto rounded bg-black/70 p-2 text-xs">
      <p className="font-bold">Battle {battle.id.slice(0, 6)} · {battle.hpA} vs {battle.hpB}</p>
      {battle.log.slice(-6).map((l, i) => (
        <p key={i}>{l}</p>
      ))}
      <p className="mt-1 text-neutral-400">Use skill bar below to strike.</p>
    </div>
  );
}
