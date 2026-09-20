// Pure combat engine — server + client replay share this. No I/O.
import { CLASSES, ClassId } from "./constants";

export interface Combatant {
  id: string;
  name: string;
  class: ClassId;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
}

export interface TurnResult {
  damage: number;
  heal: number;
  targetHp: number;
  casterHp: number;
  casterMp: number;
  killed: boolean;
  log: string;
}

export function statsFor(classId: ClassId, level: number) {
  const c = CLASSES[classId];
  return {
    maxHp: c.baseHp + level * 14,
    maxMp: c.baseMp + level * 6,
    atk: c.baseAtk + level * 2,
    def: c.baseDef + level,
  };
}

export function makeCombatant(id: string, name: string, classId: ClassId, level: number): Combatant {
  const s = statsFor(classId, level);
  return { id, name, class: classId, level, hp: s.maxHp, maxHp: s.maxHp, mp: s.maxMp, maxMp: s.maxMp, atk: s.atk, def: s.def };
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function resolveTurn(caster: Combatant, target: Combatant, skillId: string, seed = 1): TurnResult {
  const cls = CLASSES[caster.class];
  const skill = cls.skills.find((s) => s.id === skillId) ?? cls.skills[0];
  const rng = mulberry(seed + caster.hp * 31 + target.hp * 17 + skillId.length * 101);
  const variance = 0.85 + rng() * 0.3;
  const raw = Math.max(1, Math.round((caster.atk * skill.power - target.def * 0.6) * variance));
  const damage = skill.power === 0 ? 0 : raw;
  const heal = skill.heal ?? 0;
  const targetHp = Math.max(0, target.hp - damage);
  const casterHp = Math.min(caster.maxHp, caster.hp + heal);
  const casterMp = Math.max(0, caster.mp - skill.mpCost);
  return {
    damage, heal, targetHp, casterHp, casterMp,
    killed: targetHp <= 0,
    log: heal && !damage
      ? `${caster.name} casts ${skill.name} (+${heal} HP)`
      : `${caster.name} uses ${skill.name} → ${damage} dmg to ${target.name}${heal ? ` (+${heal} self)` : ""}`,
  };
}

export function autoAttack(caster: Combatant, target: Combatant, seed = 1): TurnResult {
  return resolveTurn(caster, target, CLASSES[caster.class].skills[0].id, seed);
}
