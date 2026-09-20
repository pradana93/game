"use client";
import { useGame } from "@/store/gameStore";

export default function OfflineReportModal() {
  const report = useGame((s) => s.offlineReport);
  const set = useGame((s) => s.set);
  if (!report) return null;
  const r = report as { gold_gained?: number; xp_gained?: number; deaths?: number; kills?: number; encounters?: number; log?: string[] };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded bg-neutral-900 p-4">
        <h2 className="text-lg font-bold">Offline Doctrine Report</h2>
        <p className="text-sm">Encounters: {r.encounters} · Kills: {r.kills} · Deaths: {r.deaths}</p>
        <p className="text-sm">+{r.gold_gained} gold · +{r.xp_gained} xp</p>
        <div className="mt-2 max-h-64 overflow-y-auto text-xs">
          {(r.log ?? []).map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        <button className="mt-3 w-full rounded bg-emerald-600 p-2" onClick={() => set({ offlineReport: null })}>Claim & continue</button>
      </div>
    </div>
  );
}
