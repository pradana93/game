"use client";
import { CLASSES, type ClassId } from "@/lib/game/constants";

export default function SkillBar({ cls, onSkill, onAuto }: { cls: ClassId; onSkill: (id: string) => void; onAuto: () => void }) {
  const skills = CLASSES[cls]?.skills ?? [];
  return (
    <div className="flex gap-2">
      {skills.map((s, i) => (
        <button key={s.id} onClick={() => onSkill(s.id)} title={`${s.name} — ${s.description} (${s.mpCost}mp)`} className="h-12 w-12 rounded bg-indigo-700 font-bold">
          {i + 1}
        </button>
      ))}
      <button onClick={onAuto} className="h-12 rounded bg-neutral-700 px-3 text-sm">Auto</button>
    </div>
  );
}
