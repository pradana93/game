// Pure offline-doctrine + async PvP simulation. No I/O.
import { CLASSES, OFFLINE_MAX_ITERS, type ClassId } from "./constants";
import { makeCombatant, resolveTurn, type Combatant } from "./combat";
import { rollLoot } from "./loot";

export interface DoctrineCfg {
  zoneSlug: string;
  riskLevel: number; // 1..3
  retreatHpPct: number; // 0..100
  skillPriority: string[];
}

export interface OfflineSimResult {
  encounters: number; kills: number; deaths: number;
  gold: number; xp: number;
  items: { slug: string; rarity: string; qty: number }[];
  log: string[];
}

export function simulateOffline(
  classId: ClassId, level: number, cfg: DoctrineCfg, elapsedHours: number, seedBase = 42
): OfflineSimResult {
  const hours = Math.max(0, elapsedHours);
  const encounters = Math.min(OFFLINE_MAX_ITERS, Math.floor(hours * 6 * cfg.riskLevel));
  const me = makeCombatant("me", "you", classId, level);
  let gold = 0, xp = 0, kills = 0, deaths = 0;
  const items: OfflineSimResult["items"] = [];
  const log: string[] = [];
  let hp = me.hp;
  for (let i = 0; i < encounters; i++) {
    const seed = seedBase + i * 7919;
    const mobLvl = Math.max(1, level + (cfg.riskLevel - 2) + (i % 3 === 0 ? 1 : 0));
    const mob: Combatant = { ...makeCombatant(`mob${i}`, `Mob Lv${mobLvl}`, classId, mobLvl), hp: 40 + mobLvl * 12, maxHp: 40 + mobLvl * 12 };
    let mHp = mob.hp; let myHp = hp; let myMp = me.maxMp;
    const prio = cfg.skillPriority.length ? cfg.skillPriority : CLASSES[classId].skills.map((s) => s.id);
    let turns = 0;
    while (mHp > 0 && myHp > 0 && turns < 12) {
      if ((myHp / me.maxHp) * 100 < cfg.retreatHpPct) { log.push(`enc ${i + 1}: retreated at ${Math.round(myHp)}hp`); break; }
      const sk = prio[turns % prio.length];
      const caster: Combatant = { ...me, hp: myHp, mp: myMp };
      const tgt: Combatant = { ...mob, hp: mHp };
      const res = resolveTurn(caster, tgt, sk, seed + turns);
      mHp = res.targetHp; myHp = res.casterHp; myMp = res.casterMp;
      if (res.killed) break;
      // mob hits back (basic)
      myHp = Math.max(0, myHp - Math.max(1, Math.round(mob.atk * 0.7 - me.def * 0.3)));
      turns++;
    }
    if (mHp <= 0) {
      kills++;
      const loot = rollLoot(mobLvl, cfg.riskLevel, seed);
      gold += loot.gold; xp += loot.xp;
      const ex = items.find((x) => x.slug === loot.slug);
      if (ex) ex.qty++; else items.push({ slug: loot.slug, rarity: loot.rarity, qty: 1 });
      log.push(`enc ${i + 1}: killed Mob Lv${mobLvl} +${loot.gold}g +${loot.xp}xp`);
      hp = Math.min(me.maxHp, myHp + Math.round(me.maxHp * 0.15));
    } else if (myHp <= 0) {
      deaths++;
      log.push(`enc ${i + 1}: died vs Mob Lv${mobLvl}`);
      hp = me.maxHp; // respawn
    } else { hp = myHp; }
  }
  return { encounters, kills, deaths, gold, xp, items, log };
}

export function simulatePvp(
  atk: { id: string; name: string; class: ClassId; level: number },
  def: { id: string; name: string; class: ClassId; level: number },
  atkPrio: string[], defPrio: string[], seedBase = 7
) {
  const a = makeCombatant(atk.id, atk.name, atk.class, atk.level);
  const d = makeCombatant(def.id, def.name, def.class, def.level);
  let aHp = a.hp, dHp = d.hp, aMp = a.mp, dMp = d.mp;
  const log: string[] = [];
  const ap = atkPrio.length ? atkPrio : CLASSES[atk.class].skills.map((s) => s.id);
  const dp = defPrio.length ? defPrio : CLASSES[def.class].skills.map((s) => s.id);
  for (let t = 0; t < 30; t++) {
    const ra = resolveTurn({ ...a, hp: aHp, mp: aMp }, { ...d, hp: dHp }, ap[t % ap.length], seedBase + t * 2);
    dHp = ra.targetHp; aHp = ra.casterHp; aMp = ra.casterMp;
    log.push(`t${t + 1}a: ${ra.log}`);
    if (ra.killed) return { winnerId: a.id, log };
    const rd = resolveTurn({ ...d, hp: dHp, mp: dMp }, { ...a, hp: aHp }, dp[t % dp.length], seedBase + t * 2 + 1);
    aHp = rd.targetHp; dHp = rd.casterHp; dMp = rd.casterMp;
    log.push(`t${t + 1}b: ${rd.log}`);
    if (rd.killed) return { winnerId: d.id, log };
  }
  return { winnerId: aHp >= dHp ? a.id : d.id, log };
}
