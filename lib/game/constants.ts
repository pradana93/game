// Pure game constants — no I/O, no Supabase, no Phaser. Safe for client + server.
export type ClassId = "vanguard" | "shade" | "arcanist" | "lifebinder";
export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface SkillDef {
  id: string;
  name: string;
  mpCost: number;
  cooldownSec: number;
  power: number; // multiplier on attack
  heal?: number; // flat heal when set
  description: string;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  baseHp: number;
  baseMp: number;
  baseAtk: number;
  baseDef: number;
  skills: SkillDef[];
}

export const CLASSES: Record<ClassId, ClassDef> = {
  vanguard: {
    id: "vanguard",
    name: "Vanguard",
    baseHp: 140, baseMp: 50, baseAtk: 16, baseDef: 10,
    skills: [
      { id: "van-slash", name: "Heavy Slash", mpCost: 0, cooldownSec: 3, power: 1.1, description: "Reliable heavy swing." },
      { id: "van-shield", name: "Bulwark", mpCost: 8, cooldownSec: 12, power: 0.4, description: "Defensive bash. Small hit." },
      { id: "van-rush", name: "Shield Rush", mpCost: 10, cooldownSec: 10, power: 1.6, description: "Charging rush." },
      { id: "van-oath", name: "Oathbound Heal", mpCost: 14, cooldownSec: 18, power: 0, heal: 45, description: "Restore HP." },
    ],
  },
  shade: {
    id: "shade",
    name: "Shade",
    baseHp: 105, baseMp: 70, baseAtk: 20, baseDef: 6,
    skills: [
      { id: "shd-stab", name: "Quick Stab", mpCost: 0, cooldownSec: 2, power: 0.9, description: "Fast stab." },
      { id: "shd-back", name: "Backstab", mpCost: 8, cooldownSec: 9, power: 1.9, description: "Big crit from behind." },
      { id: "shd-smoke", name: "Smoke Veil", mpCost: 10, cooldownSec: 14, power: 0.5, description: "Evasive strike." },
      { id: "shd-drain", name: "Leech Cut", mpCost: 12, cooldownSec: 15, power: 1.2, heal: 20, description: "Damage + self heal." },
    ],
  },
  arcanist: {
    id: "arcanist",
    name: "Arcanist",
    baseHp: 95, baseMp: 110, baseAtk: 22, baseDef: 5,
    skills: [
      { id: "arc-bolt", name: "Arc Bolt", mpCost: 4, cooldownSec: 3, power: 1.1, description: "Basic bolt." },
      { id: "arc-fire", name: "Fireburst", mpCost: 12, cooldownSec: 10, power: 2.0, description: "Heavy nuke." },
      { id: "arc-frost", name: "Frost Shard", mpCost: 8, cooldownSec: 8, power: 1.4, description: "Chilling shard." },
      { id: "arc-surge", name: "Mana Surge", mpCost: 0, cooldownSec: 20, power: 0, heal: 35, description: "Restore HP via mana." },
    ],
  },
  lifebinder: {
    id: "lifebinder",
    name: "Life-Binder",
    baseHp: 120, baseMp: 95, baseAtk: 14, baseDef: 8,
    skills: [
      { id: "lif-smite", name: "Radiant Smite", mpCost: 4, cooldownSec: 3, power: 1.0, description: "Holy strike." },
      { id: "lif-bind", name: "Binding Roots", mpCost: 10, cooldownSec: 11, power: 1.5, description: "Root + damage." },
      { id: "lif-mend", name: "Mend Wounds", mpCost: 14, cooldownSec: 16, power: 0, heal: 55, description: "Big heal." },
      { id: "lif-wrath", name: "Nature's Wrath", mpCost: 12, cooldownSec: 13, power: 1.8, description: "Thorns eruption." },
    ],
  },
};

export const XP_CURVE = (level: number) => Math.floor(80 * Math.pow(level, 1.6));
export const ROOM_CAPACITY = 8;
export const MOVE_COOLDOWN_MS = 200;
export const MAX_MOVE_DIST = 1200;
export const GROUND_Y_MIN = 400;
export const GROUND_Y_MAX = 700;
export const WORLD_W = 2560;
export const OFFLINE_CAP_HOURS = 12;
export const OFFLINE_MAX_ITERS = 200;
export const HEARTBEAT_TIMEOUT_SEC = 90;
export const POLL_FALLBACK_MS = 10_000;
export const HEARTBEAT_MS = 30_000;
