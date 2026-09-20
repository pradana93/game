// Pure loot rolls. No I/O.
import type { Rarity } from "./constants";

export interface LootDrop { slug: string; rarity: Rarity; gold: number; xp: number; }

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollLoot(monsterLevel: number, risk: number, seed: number): LootDrop {
  const rng = mulberry(seed);
  const r = rng();
  const rarity: Rarity = r > 0.97 ? "legendary" : r > 0.88 ? "epic" : r > 0.68 ? "rare" : "common";
  const mult = { common: 1, rare: 1.6, epic: 2.5, legendary: 4 }[rarity];
  return {
    slug: `mob-drop-lv${monsterLevel}-${rarity}`,
    rarity,
    gold: Math.floor((8 + monsterLevel * 4 * risk) * mult * (0.8 + rng() * 0.4)),
    xp: Math.floor((20 + monsterLevel * 10 * risk) * mult),
  };
}

export function xpForLevel(level: number) {
  return Math.floor(80 * Math.pow(level, 1.6));
}
