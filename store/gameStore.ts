import { create } from "zustand";

export interface Member { player_id: string; username: string; x: number; y: number; class: string; level: number; hp: number; maxHp: number; mp: number; maxMp: number; }
export interface ChatMsg { from: string; text: string; t: number; }
export interface BattleView { id: string; hpA: number; hpB: number; log: string[]; }

interface GameState {
  playerId: string | null;
  username: string | null;
  roomId: string | null;
  members: Member[];
  chat: ChatMsg[];
  battle: BattleView | null;
  offlineReport: Record<string, unknown> | null;
  set: (p: Partial<GameState>) => void;
  upsertMember: (m: Member) => void;
  removeMember: (pid: string) => void;
  pushChat: (m: ChatMsg) => void;
}

export const useGame = create<GameState>((set) => ({
  playerId: null, username: null, roomId: null,
  members: [], chat: [], battle: null, offlineReport: null,
  set: (p) => set(p),
  upsertMember: (m) => set((s) => ({ members: [...s.members.filter((x) => x.player_id !== m.player_id), m] })),
  removeMember: (pid) => set((s) => ({ members: s.members.filter((x) => x.player_id !== pid) })),
  pushChat: (m) => set((s) => ({ chat: [...s.chat.slice(-49), m] })),
}));
