/** Aggregates passive modifiers from researched techs and completed agenda nodes. */
import type { Mods, NationState } from '../engine/types';
import { TECHS } from '../data/techs';
import { AGENDAS } from '../data/agendas';
import type { Good } from '../data/goods';

const techById = new Map(TECHS.map((t) => [t.id, t]));
const nodeById = new Map(AGENDAS.map((a) => [a.id, a]));

export function nationMods(nation: NationState): Required<Omit<Mods, 'prodMult'>> & { prodMult: Partial<Record<Good, number>> } {
  const total = {
    prodMult: {} as Partial<Record<Good, number>>,
    armyPower: 0,
    navyPower: 0,
    airPower: 0,
    intelBonus: 0,
    capitalBonus: 0,
    researchBonus: 0,
    tradeBonus: 0,
    stabilityBonus: 0,
  };
  const add = (m?: Mods) => {
    if (!m) return;
    for (const [g, v] of Object.entries(m.prodMult ?? {})) {
      total.prodMult[g as Good] = (total.prodMult[g as Good] ?? 0) + (v ?? 0);
    }
    total.armyPower += m.armyPower ?? 0;
    total.navyPower += m.navyPower ?? 0;
    total.airPower += m.airPower ?? 0;
    total.intelBonus += m.intelBonus ?? 0;
    total.capitalBonus += m.capitalBonus ?? 0;
    total.researchBonus += m.researchBonus ?? 0;
    total.tradeBonus += m.tradeBonus ?? 0;
    total.stabilityBonus += m.stabilityBonus ?? 0;
  };
  for (const id of nation.techs) add(techById.get(id)?.mods);
  for (const id of nation.agenda.completed) add(nodeById.get(id)?.mods);
  return total;
}
