"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGame } from "@/store/gameStore";
import { useRoomChannel, useBattleChannel } from "@/lib/realtime/roomChannel";
import { HEARTBEAT_MS, POLL_FALLBACK_MS, type ClassId } from "@/lib/game/constants";
import PhaserCanvas from "@/components/game/PhaserCanvas";
import RoomRoster from "@/components/game/RoomRoster";
import ChatPanel from "@/components/game/ChatPanel";
import BattleOverlay from "@/components/game/BattleOverlay";
import SkillBar from "@/components/game/SkillBar";
import OfflineReportModal from "@/components/game/OfflineReportModal";

export default function PlayPage() {
  const router = useRouter();
  const [supa] = useState(() => createClient());
  const [me, setMe] = useState<{ id: string; username: string; level: number; gold: number; hp: number; max_hp: number; class: ClassId } | null>(null);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [pvpLog, setPvpLog] = useState<string[]>([]);
  const g = useGame();

  useEffect(() => {
    (async () => {
      const login = await fetch("/api/session/login", { method: "POST" }).then((r) => r.json());
      if (login?.player) setMe({ ...login.player, max_hp: login.player.max_hp, class: login.player.class as ClassId });
      if (login?.report) g.set({ offlineReport: login.report });
      const u = (await supa.auth.getUser()).data.user;
      if (u) g.set({ playerId: u.id });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshState = useCallback(async () => {
    if (!g.roomId) return;
    const s = await fetch(`/api/rooms/${g.roomId}/state`).then((r) => (r.ok ? r.json() : null));
    if (!s) return;
    for (const m of s.members) {
      g.upsertMember({ player_id: m.player_id, username: m.username ?? "?", x: m.x, y: m.y, class: m.class ?? "vanguard", level: m.level ?? 1, hp: m.hp ?? 100, maxHp: m.max_hp ?? 100, mp: m.mp ?? 50, maxMp: m.max_mp ?? 50 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.roomId]);

  // Heartbeat (HTTP every 30s) + polling fallback (10s) keeps game playable if Realtime drops.
  useEffect(() => {
    if (!g.roomId) return;
    const hb = setInterval(() => { fetch("/api/rooms/heartbeat", { method: "POST" }); }, HEARTBEAT_MS);
    const poll = setInterval(refreshState, POLL_FALLBACK_MS);
    refreshState();
    return () => { clearInterval(hb); clearInterval(poll); };
  }, [g.roomId, refreshState]);

  useRoomChannel(supa, g.roomId, {
    move_intent: (p) => {
      const pid = String(p.pid);
      const cur = useGame.getState().members.find((m) => m.player_id === pid);
      if (cur) useGame.getState().upsertMember({ ...cur, x: Number(p.x), y: Number(p.y) });
    },
    chat: (p) => useGame.getState().pushChat({ from: String(p.from), text: String(p.text), t: Number(p.t) }),
    player_joined: (p) => refreshState(),
    player_left: (p) => useGame.getState().removeMember(String(p.pid)),
    battle_started: (p) => setBattleId(String(p.battleId)),
    battle_tick: (p) => {
      const b = useGame.getState().battle;
      if (b) useGame.getState().set({ battle: { ...b, hpA: Number(p.hpA), hpB: Number(p.hpB) } });
    },
    battle_ended: () => { setBattleId(null); refreshState(); },
  });

  useBattleChannel(supa, battleId, (p) => {
    useGame.getState().set({
      battle: {
        id: battleId!,
        hpA: Number(p.hpA),
        hpB: Number(p.hpB),
        log: [...(useGame.getState().battle?.log ?? []), ...((p.log as string[]) ?? [])],
      },
    });
  });

  async function joinZone(zoneId: string) {
    const r = await fetch("/api/rooms/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ zoneId }) }).then((r) => r.json());
    if (r.roomId) g.set({ roomId: r.roomId });
  }

  async function move(x: number, y: number) {
    await fetch("/api/rooms/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ x, y }) });
    if (g.playerId) {
      const cur = useGame.getState().members.find((m) => m.player_id === g.playerId);
      if (cur) g.upsertMember({ ...cur, x, y });
    }
  }

  async function startBattle() {
    const target = useGame.getState().members.find((m) => m.player_id !== g.playerId);
    const mobId = `mob-${Math.floor(Math.random() * 1e6)}`;
    const r = await fetch("/api/battles/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ targetId: target?.player_id ?? mobId, kind: target ? "pvp" : "pve" }) }).then((r) => r.json());
    if (r.battleId) {
      setBattleId(r.battleId);
      g.set({ battle: { id: r.battleId, hpA: 100, hpB: 100, log: ["battle started"] } });
    }
  }

  async function turn(skillId: string) {
    if (!battleId) return;
    const r = await fetch(`/api/battles/${battleId}/turn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skillId }) }).then((r) => r.json());
    if (r.winner) setBattleId(null);
  }

  async function challenge(pid: string) {
    const r = await fetch("/api/pvp/challenge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: pid }) }).then((r) => r.json());
    setPvpLog([]);
    const log = (r.log as string[]) ?? [];
    log.forEach((line, i) => setTimeout(() => setPvpLog((l) => [...l, line]), i * 300)); // 300ms/turn replay, zero Realtime
  }

  async function logout() {
    await fetch("/api/session/logout", { method: "POST" });
    await supa.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between bg-neutral-900 p-2 text-sm">
        <span>HP {me?.hp}/{me?.max_hp} · Lv{me?.level} · 💰{me?.gold} · Room: {g.roomId?.slice(0, 8) ?? "—"} {useGame((s) => s.members.length)}/8</span>
        <span className="flex gap-2">
          <button className="rounded bg-neutral-700 px-2" onClick={() => router.push("/rooms")}>Rooms</button>
          <button className="rounded bg-neutral-700 px-2" onClick={logout}>Logout</button>
        </span>
      </header>
      {!g.roomId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
          <p>Pick a zone to enter (8 players per instance; 9th opens a new one).</p>
          <ZonePicker onPick={joinZone} />
          {pvpLog.length > 0 && (
            <div className="max-h-48 w-full max-w-md overflow-y-auto rounded bg-black/60 p-2 text-xs">
              {pvpLog.map((l, i) => <p key={i}>{l}</p>)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col md:flex-row">
          <div className="relative h-[60vh] flex-1 md:h-auto">
            <PhaserCanvas onGroundClick={move} />
            <BattleOverlay onTurn={turn} />
          </div>
          <aside className="flex w-full flex-col gap-2 border-t border-neutral-800 md:w-80 md:border-l md:border-t-0">
            <RoomRoster onChallenge={challenge} />
            <div className="h-48"><ChatPanel /></div>
            <div className="flex gap-2 p-2">
              <button className="flex-1 rounded bg-red-700 p-2" onClick={startBattle}>⚔️ Fight</button>
            </div>
            <div className="p-2"><SkillBar cls={me?.class ?? "vanguard"} onSkill={turn} onAuto={() => turn("auto")} /></div>
            {pvpLog.length > 0 && (
              <div className="max-h-32 overflow-y-auto p-2 text-xs">{pvpLog.map((l, i) => <p key={i}>{l}</p>)}</div>
            )}
          </aside>
        </div>
      )}
      <OfflineReportModal />
    </main>
  );
}

function ZonePicker({ onPick }: { onPick: (id: string) => void }) {
  const [zones, setZones] = useState<{ id: string; slug: string; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/rooms").then((r) => r.json()).then((d) => setZones(d.zones ?? []));
  }, []);
  if (!zones.length) return <p className="text-sm text-neutral-400">loading zones…</p>;
  return (
    <div className="flex gap-2">
      {zones.map((z) => (
        <button key={z.id} onClick={() => onPick(z.id)} className="rounded bg-emerald-700 px-4 py-2">{z.name}</button>
      ))}
    </div>
  );
}
