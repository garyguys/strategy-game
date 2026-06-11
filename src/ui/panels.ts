/** All game panels. Each function renders one panel from current state. */
import type { App, PanelId } from './app';
import { h, stat, meter, colorHex, signed } from './dom';
import { dateLabel, fmt } from '../engine/util';
import { GOODS, GOOD_LABEL } from '../data/goods';
import { TECHS } from '../data/techs';
import { AGENDAS } from '../data/agendas';
import { BAL } from '../engine/balance';
import type { Character, Crisis, MinisterPost } from '../engine/types';
import { monthlyDemand, monthlyProduction, marketOrder, controlledRegions, isBlockaded } from '../systems/economy';
import { appointMinister, amendConstitution, AMENDMENTS } from '../systems/internal';
import { recruitArmy, startFabrication, declareWar, DOCTRINES } from '../systems/war';
import { armyPower, atWarWith, memoryScore } from '../systems/diplomacy';
import { describeClause, breakTreaty } from '../systems/treaty';
import { setOperation, OP_LABEL } from '../systems/espionage';
import { crisisMove, congressProposals, STAGE_LABEL, type CrisisMove } from '../systems/crisis';
import { createBloc, inviteToBloc, leaveBloc } from '../systems/blocs';
import { effectsOf } from '../engine/chronicle';
import { exportSave, importSave, clearAutosave } from '../engine/serialize';
import { computeLegacy } from '../systems/legacy';
import { openTreatyBuilder } from './treatyBuilder';
import type { SpyOpKind } from '../engine/types';
import { Rng } from '../engine/rng';

export function renderPanel(app: App, panel: PanelId): HTMLElement {
  switch (panel) {
    case 'government': return government(app);
    case 'economy': return economy(app);
    case 'military': return military(app);
    case 'agenda': return agenda(app);
    case 'chronicle': return chroniclePanel(app);
    case 'dossiers': return dossiers(app, app.selectedNation ?? app.state.playerId);
    case 'crises': return crises(app);
    case 'menu': return menu(app);
    case 'nation': return nationPanel(app);
  }
}

function head(title: string, sub?: string): HTMLElement {
  return h('div', { class: 'panel-title' }, h('h2', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null);
}

// ---------------- Government (I1-I3, I10, I11, N3) ----------------

function government(app: App): HTMLElement {
  const s = app.state;
  const n = s.nations[s.playerId];
  const leader = s.characters[n.leaderId];
  const root = h('div', {});

  root.append(
    head(n.name, `${n.government} — ${leader?.name ?? ''}, ${leader?.title ?? ''}`),
    h('div', { class: 'stat-row' },
      stat('Capital', Math.floor(n.politicalCapital)),
      stat('Stability', `${Math.round(n.stability)}%`),
      stat('Standing', Math.round(n.standing)),
      stat('War Support', `${Math.round(n.warSupport)}%`),
    ),
    h('h3', { text: 'Ideology' }),
    meter('Authoritarian', 50 + n.ideology.auth / 2),
    meter('Planned Economy', 50 + n.ideology.planned / 2),
    meter('Nationalist', 50 + n.ideology.natl / 2),
  );

  // Cabinet (I1)
  const cab = h('div', {});
  root.append(h('h3', { text: 'The Cabinet' }), cab);
  const posts: MinisterPost[] = ['foreign', 'economy', 'defense', 'interior'];
  for (const post of posts) {
    const mid = n.ministers[post];
    const m = mid ? s.characters[mid] : null;
    cab.append(
      h('div', { class: 'row' },
        h('div', { class: 'grow' },
          h('b', { text: `${post[0].toUpperCase() + post.slice(1)}: ` }),
          m ? `${m.name} (cmp ${m.competence}, loy ${Math.round(m.loyalty)})` : 'vacant',
        ),
        h('button', { class: 'btn small', text: 'Appoint…', onclick: () => pickMinister(app, post) }),
      ),
    );
  }

  // Legislature (I2)
  if (n.factions.length) {
    root.append(h('h3', { text: `Legislature — election in ${n.electionDue ?? '—'} months` }));
    for (const f of n.factions) {
      root.append(meter(f.name, f.seats));
    }
  } else {
    root.append(h('p', { class: 'sub', text: 'No parliament constrains the executive. Other things do.' }));
  }

  // Press (I11)
  root.append(h('h3', { text: 'The Press' }));
  const pressRow = h('div', { class: 'row' });
  for (const p of ['free', 'pressured', 'state'] as const) {
    pressRow.append(
      h('button', {
        class: `btn small ${n.press === p ? 'active' : ''}`,
        text: p === 'free' ? 'Free' : p === 'pressured' ? 'Pressured' : 'State-run',
        onclick: () => {
          if (n.press === p) return;
          if (n.politicalCapital < 6) return app.toast('Needs 6 political capital.');
          n.politicalCapital -= 6;
          n.press = p;
          if (p === 'state') n.ideology.auth = Math.min(100, n.ideology.auth + 12);
          if (p === 'free') n.ideology.auth = Math.max(-100, n.ideology.auth - 8);
          app.refresh();
        },
      }),
    );
  }
  root.append(pressRow);

  // Amendments (I3)
  root.append(h('h3', { text: 'Constitutional Acts' }));
  for (const a of AMENDMENTS) {
    root.append(
      h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('b', { text: a.label }), h('p', { class: 'sub', text: a.blurb })),
        h('button', {
          class: 'btn small',
          text: `${a.cost}⚖`,
          onclick: () => {
            const err = amendConstitution(s, n, a.id);
            if (err) app.toast(err);
            app.refresh();
          },
        }),
      ),
    );
  }
  return root;
}

function pickMinister(app: App, post: MinisterPost): void {
  const s = app.state;
  const n = s.nations[s.playerId];
  const candidates = Object.values(s.characters).filter(
    (c) => c.nationId === n.id && c.alive && c.role !== 'leader' && c.role !== 'family' && n.ministers[post] !== c.id,
  );
  const list = h('div', {});
  list.append(head(`Appoint ${post} minister`, 'Costs 5 political capital. The outgoing minister will remember.'));
  for (const c of candidates) {
    list.append(
      h('div', { class: 'row' },
        h('div', { class: 'grow' },
          h('b', { text: `${c.name}` }),
          h('p', { class: 'sub', text: `${c.title} — competence ${c.competence}, loyalty ${Math.round(c.loyalty)} — ${c.traits.join(', ')}` }),
        ),
        h('button', {
          class: 'btn small', text: 'Appoint',
          onclick: () => {
            const err = appointMinister(s, n, post, c.id);
            if (err) app.toast(err);
            app.closeModal();
            app.refresh();
          },
        }),
      ),
    );
  }
  app.openModal(list);
}

// ---------------- Economy (R1-R7, I5, I8) ----------------

function economy(app: App): HTMLElement {
  const s = app.state;
  const n = s.nations[s.playerId];
  const production = monthlyProduction(s, n);
  const demand = monthlyDemand(s, n);
  const root = h('div', {});

  const debt = n.debts.reduce((acc, d) => acc + d.principal, 0);
  root.append(
    head('Economy & Trade', isBlockaded(s, n) ? 'UNDER BLOCKADE — imports cut' : `Market access normal.`),
    h('div', { class: 'stat-row' },
      stat('Treasury', fmt(n.treasury)),
      stat('Debt', fmt(debt)),
      stat('Tax', `${Math.round(n.taxRate * 100)}%`),
    ),
  );
  const taxRow = h('div', { class: 'row' },
    h('span', { text: 'Tax rate ' }),
    h('input', {
      type: 'range', min: '20', max: '90', value: String(Math.round(n.taxRate * 100)),
      oninput: (e: Event) => {
        n.taxRate = Number((e.target as HTMLInputElement).value) / 100;
        app.refresh();
      },
    }),
  );
  root.append(taxRow);

  // Market table (R4)
  root.append(h('h3', { text: 'Stockpiles & World Market' }));
  const table = h('table', { class: 'goods' });
  table.append(h('tr', {}, h('th', { text: 'Good' }), h('th', { text: 'Stock' }), h('th', { text: 'Net/mo' }), h('th', { text: 'Price' }), h('th', { text: '' })));
  for (const g of GOODS) {
    const net = (production[g] ?? 0) - (demand[g] ?? 0);
    const trade = h('td', {},
      h('button', { class: 'btn tiny', text: '−10', onclick: () => { const err = marketOrder(s, n, g, -10); if (err) app.toast(err); app.refresh(); } }),
      h('button', { class: 'btn tiny', text: '+10', onclick: () => { const err = marketOrder(s, n, g, 10); if (err) app.toast(err); app.refresh(); } }),
    );
    table.append(
      h('tr', {},
        h('td', { text: GOOD_LABEL[g] }),
        h('td', { text: fmt(n.stockpiles[g]) }),
        h('td', { class: net < 0 ? 'bad' : 'good', text: signed(net) }),
        h('td', { text: (Math.round(s.market.prices[g] * 10) / 10).toString() }),
        trade,
      ),
    );
  }
  root.append(table);

  // Regions & development (I5, I8, W10)
  root.append(h('h3', { text: 'Regions' }));
  for (const r of controlledRegions(s, n)) {
    const block = h('div', { class: 'region' });
    block.append(
      h('div', { class: 'row' },
        h('b', { class: 'grow', text: `${r.name}${r.ownerId !== n.id ? ' (occupied)' : ''}${r.chokepoint ? ` — ${r.chokepoint}` : ''}` }),
        h('span', { class: r.unrest > 40 ? 'bad' : 'sub', text: `unrest ${Math.round(r.unrest)}` }),
      ),
      h('p', { class: 'sub', text: `pop ${r.population}M — infra ${r.development.infra} · industry ${r.development.industry} · schools ${r.development.education}` }),
    );
    if (r.ownerId === n.id) {
      const dev = h('div', { class: 'row' });
      for (const kind of ['infra', 'industry', 'education'] as const) {
        const busy = n.projects.some((p) => p.regionId === r.id && p.kind === kind);
        dev.append(
          h('button', {
            class: 'btn tiny', text: busy ? `${kind}…` : `+${kind} (${BAL.developmentCost})`, disabled: busy || r.development[kind] >= 5,
            onclick: () => {
              if (n.treasury < BAL.developmentCost) return app.toast('Treasury too thin.');
              n.treasury -= BAL.developmentCost;
              n.projects.push({ regionId: r.id, kind, monthsLeft: BAL.developmentMonths });
              app.refresh();
            },
          }),
        );
      }
      block.append(dev);
      if (r.minority) {
        const mrow = h('div', { class: 'row' }, h('span', { class: 'sub grow', text: `${r.minority.name} (${r.minority.share}%) — policy:` }));
        for (const p of ['integrate', 'autonomy', 'suppress'] as const) {
          mrow.append(h('button', {
            class: `btn tiny ${r.minority.policy === p ? 'active' : ''}`, text: p,
            onclick: () => {
              if (n.politicalCapital < 3) return app.toast('Needs 3 political capital.');
              n.politicalCapital -= 3;
              r.minority!.policy = p;
              app.refresh();
            },
          }));
        }
        block.append(mrow);
      }
    }
    root.append(block);
  }
  return root;
}

// ---------------- Military (W1-W6, W9) ----------------

function military(app: App): HTMLElement {
  const s = app.state;
  const n = s.nations[s.playerId];
  const root = h('div', {});
  root.append(
    head('The Armed Forces', `Combined striking power ${fmt(armyPower(n))}`),
    h('div', { class: 'stat-row' },
      stat('Manpower', `${fmt(n.military.manpower)}k`),
      stat('Navy', Math.round(n.military.navy)),
      stat('Air', Math.round(n.military.air)),
      stat('Exhaustion', `${Math.round(n.warExhaustion)}%`),
    ),
  );

  // Doctrine (W4)
  root.append(h('h3', { text: 'Doctrine' }));
  const docRow = h('div', { class: 'row wrap' });
  for (const d of DOCTRINES) {
    docRow.append(h('button', {
      class: `btn small ${n.military.doctrine === d.id ? 'active' : ''}`, text: d.label, title: d.blurb,
      onclick: () => {
        if (n.politicalCapital < 8 && n.military.doctrine !== d.id) return app.toast('Needs 8 political capital.');
        if (n.military.doctrine !== d.id) n.politicalCapital -= 8;
        n.military.doctrine = d.id;
        app.refresh();
      },
    }));
  }
  root.append(docRow);

  // Armies (W2/W3)
  root.append(h('h3', { text: 'Armies' }));
  const fronts = s.wars.flatMap((w) => w.fronts.filter((f) => f.attackerId === n.id || f.defenderId === n.id).map((f) => ({ war: w, front: f })));
  for (const a of n.military.armies) {
    const general = a.generalId ? s.characters[a.generalId] : null;
    const frontSel = h('select', {
      onchange: (e: Event) => {
        a.frontId = (e.target as HTMLSelectElement).value || null;
        app.refresh();
      },
    });
    frontSel.append(h('option', { value: '', text: 'Reserve' }));
    for (const { front } of fronts) {
      const opt = h('option', { value: front.id, text: front.name });
      if (a.frontId === front.id) opt.selected = true;
      frontSel.append(opt);
    }
    root.append(
      h('div', { class: 'row' },
        h('div', { class: 'grow' },
          h('b', { text: `${a.name} — ${fmt(a.strength)}k` }),
          h('p', { class: 'sub', text: `org ${Math.round(a.organization)} — inf ${a.composition.inf}/art ${a.composition.art}/arm ${a.composition.arm}${general ? ` — Gen. ${general.name}` : ''}` }),
        ),
        frontSel,
      ),
    );
  }
  const recruit = h('div', { class: 'row' },
    h('button', {
      class: 'btn small', text: `Raise army (50k — ${BAL.recruitCostCash * 5}⛁, ${BAL.recruitCostArms * 5} arms)`,
      onclick: () => {
        const err = recruitArmy(n, 50, { inf: 70, art: 20, arm: 10 });
        if (err) app.toast(err);
        app.refresh();
      },
    }),
  );
  root.append(recruit);

  // Naval & air missions (W6)
  root.append(h('h3', { text: 'Navy & Air Missions' }));
  const missionSel = h('select', {
    onchange: (e: Event) => {
      const v = (e.target as HTMLSelectElement).value;
      n.military.navalMission = (v || null) as typeof n.military.navalMission;
      app.refresh();
    },
  });
  for (const [v, label] of [['', 'No mission'], ['patrol', 'Patrol sea lanes'], ['blockade', 'Blockade'], ['escort', 'Escort convoys'], ['bombing', 'Strategic bombing'], ['portStrike', 'Port strike']] as const) {
    const opt = h('option', { value: v, text: label });
    if ((n.military.navalMission ?? '') === v) opt.selected = true;
    missionSel.append(opt);
  }
  const targetSel = h('select', {
    onchange: (e: Event) => {
      n.military.navalTarget = (e.target as HTMLSelectElement).value || null;
      app.refresh();
    },
  });
  targetSel.append(h('option', { value: '', text: 'Target…' }));
  for (const other of Object.values(s.nations).filter((x) => x.alive && x.major && x.id !== n.id)) {
    const opt = h('option', { value: other.id, text: other.name });
    if (n.military.navalTarget === other.id) opt.selected = true;
    targetSel.append(opt);
  }
  root.append(h('div', { class: 'row' }, missionSel, targetSel));

  // Wars & fronts (W3/W8)
  root.append(h('h3', { text: 'Wars' }));
  const myWars = s.wars.filter((w) => w.attackers.includes(n.id) || w.defenders.includes(n.id));
  if (!myWars.length) root.append(h('p', { class: 'sub', text: 'The guns are quiet. The ledgers are not.' }));
  for (const w of myWars) {
    const div = h('div', { class: 'region' });
    div.append(h('b', { text: w.name }), h('p', { class: 'sub', text: `since ${dateLabel(w.startTurn)} — ${w.goal}` }));
    for (const f of w.fronts) {
      const mine = f.attackerId === n.id;
      const prog = mine ? f.progress : -f.progress;
      div.append(meter(f.name, 50 + prog / 2, prog >= 0 ? 'ok' : 'warn'));
    }
    div.append(
      h('button', {
        class: 'btn small', text: 'Negotiate peace…',
        onclick: () => {
          const enemy = w.attackers.includes(n.id) ? w.defenders[0] : w.attackers[0];
          openTreatyBuilder(app, enemy, { warId: w.id });
        },
      }),
    );
    root.append(div);
  }

  // Justification & war declaration (W1)
  root.append(h('h3', { text: 'Claims & Justifications' }));
  if (n.fabricating) {
    root.append(h('p', { class: 'sub', text: `Fabricating a claim against ${s.nations[n.fabricating.vs].name} — ${Math.round(n.fabricating.progress)}%.` }));
  }
  for (const cb of n.casusBelli) {
    root.append(
      h('div', { class: 'row' },
        h('span', { class: 'grow', text: `Casus belli vs ${s.nations[cb.vs].name} (${cb.type}), lapses ${dateLabel(cb.expires)}` }),
        h('button', {
          class: 'btn small danger', text: 'Declare war',
          onclick: () => {
            if (n.warSupport < 25) return app.toast('The country will not follow you to war (war support too low).');
            declareWar(s, n.id, cb.vs, cb.type);
            app.refresh();
          },
        }),
      ),
    );
  }
  const target = app.selectedNation && app.selectedNation !== n.id ? s.nations[app.selectedNation] : null;
  if (target?.alive) {
    root.append(
      h('div', { class: 'row' },
        h('span', { class: 'grow', text: `Against ${target.name}:` }),
        h('button', {
          class: 'btn small', text: 'Fabricate claim (3⚖)', disabled: !!n.fabricating,
          onclick: () => {
            if (n.politicalCapital < 3) return app.toast('Needs 3 political capital.');
            n.politicalCapital -= 3;
            startFabrication(s, n, target.id);
            app.refresh();
          },
        }),
        h('button', {
          class: 'btn small danger', text: 'War without pretext',
          onclick: () => {
            if (n.warSupport < 35) return app.toast('Unprovoked war needs 35% war support.');
            declareWar(s, n.id, target.id, 'naked aggression');
            app.refresh();
          },
        }),
      ),
    );
  } else {
    root.append(h('p', { class: 'sub', text: 'Select a nation on the map to prepare claims.' }));
  }
  return root;
}

// ---------------- Agenda & Research (I6, I7) ----------------

function agenda(app: App): HTMLElement {
  const s = app.state;
  const n = s.nations[s.playerId];
  const root = h('div', {});
  root.append(head('National Agenda & Research'));

  // Agenda (I6)
  root.append(h('h3', { text: 'Agenda' }));
  if (n.agenda.current) {
    const node = AGENDAS.find((a) => a.id === n.agenda.current)!;
    root.append(meter(`${node.title} (${n.agenda.progress}/${node.months} mo)`, (n.agenda.progress / node.months) * 100));
  }
  const open = AGENDAS.filter(
    (a) =>
      (a.tree === 'generic' || a.tree === n.id) &&
      !n.agenda.completed.includes(a.id) &&
      a.id !== n.agenda.current &&
      (a.requires ?? []).every((r) => n.agenda.completed.includes(r)) &&
      (!a.condition || a.condition(s, n)),
  );
  for (const node of open) {
    root.append(
      h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('b', { text: node.title }), h('p', { class: 'sub', text: `${node.blurb} (${node.months} months)` })),
        h('button', {
          class: 'btn small', text: n.agenda.current ? 'Switch' : 'Begin',
          onclick: () => {
            n.agenda.current = node.id;
            n.agenda.progress = 0;
            app.refresh();
          },
        }),
      ),
    );
  }
  if (n.agenda.completed.length) {
    root.append(h('p', { class: 'sub', text: `Completed: ${n.agenda.completed.map((id) => AGENDAS.find((a) => a.id === id)?.title ?? id).join(' · ')}` }));
  }

  // Research (I7)
  root.append(h('h3', { text: 'Research' }));
  if (n.research.current) {
    const t = TECHS.find((x) => x.id === n.research.current)!;
    root.append(meter(`${t.label} (${Math.round(n.research.progress)}/${t.cost})`, (n.research.progress / t.cost) * 100));
  }
  const year = 1936 + Math.floor(s.turn / 12);
  for (const branch of ['industry', 'military', 'statecraft'] as const) {
    root.append(h('h4', { text: branch[0].toUpperCase() + branch.slice(1) }));
    const avail = TECHS.filter((t) => t.branch === branch && !n.techs.includes(t.id) && t.year <= year && t.id !== n.research.current).slice(0, 4);
    for (const t of avail) {
      root.append(
        h('div', { class: 'row' },
          h('div', { class: 'grow' }, h('b', { text: `${t.label} (${t.cost})` }), h('p', { class: 'sub', text: t.blurb })),
          h('button', {
            class: 'btn small', text: 'Research',
            onclick: () => {
              n.research = { current: t.id, progress: 0 };
              app.refresh();
            },
          }),
        ),
      );
    }
  }
  root.append(h('p', { class: 'sub', text: `Mastered: ${n.techs.length} technologies.` }));
  return root;
}

// ---------------- Chronicle (E1) ----------------

let chronicleFilter = 'all';

function chroniclePanel(app: App): HTMLElement {
  const s = app.state;
  const root = h('div', {});
  root.append(head('The Chronicle', 'Every act of state, and what it led to.'));
  const tags = ['all', 'decision', 'treaty', 'war', 'crisis', 'politics', 'espionage', 'economy'];
  const bar = h('div', { class: 'row wrap' });
  for (const t of tags) {
    bar.append(h('button', {
      class: `btn tiny ${chronicleFilter === t ? 'active' : ''}`, text: t,
      onclick: () => { chronicleFilter = t; app.refresh(); },
    }));
  }
  root.append(bar);
  const entries = [...s.chronicle].reverse().filter((e) => chronicleFilter === 'all' || e.tags.includes(chronicleFilter)).slice(0, 80);
  for (const e of entries) {
    const consequences = effectsOf(s, e.id);
    const row = h('div', { class: 'chron' },
      h('span', { class: 'chron-date', text: dateLabel(e.turn) }),
      h('div', { class: 'grow' },
        h('b', { text: e.headline }),
        e.body ? h('p', { class: 'sub', text: e.body }) : null,
        consequences.length
          ? h('p', { class: 'sub', text: `↳ led to: ${consequences.map((c) => c.headline).join(' · ')}` })
          : null,
      ),
    );
    root.append(row);
  }
  return root;
}

// ---------------- Dossiers (E2) ----------------

function dossiers(app: App, nationId: string): HTMLElement {
  const s = app.state;
  const nation = s.nations[nationId];
  const root = h('div', {});
  root.append(head(`Dossiers — ${nation?.name ?? nationId}`, 'Everyone keeps a file. These are yours.'));
  const cast = Object.values(s.characters).filter((c) => c.nationId === nationId);
  for (const c of cast) {
    root.append(dossierCard(app, c));
  }
  return root;
}

export function dossierCard(app: App, c: Character): HTMLElement {
  const s = app.state;
  const attitude = !c.alive ? 'deceased' : c.loyalty > 70 ? 'loyal' : c.loyalty > 40 ? 'watchful' : 'estranged';
  const receipts = c.log.length ? c.log[c.log.length - 1].text : 'No file entries yet.';
  const card = h('div', { class: `dossier ${c.alive ? '' : 'dead'}` },
    h('div', { class: 'row' },
      h('div', { class: 'grow' },
        h('b', { text: c.name }),
        h('span', { class: 'sub', text: `  ${c.title} — ${attitude}` }),
      ),
      h('span', { class: 'sub', text: `cmp ${c.competence} · loy ${Math.round(c.loyalty)}` }),
    ),
    h('p', { class: 'sub', text: c.bio }),
    h('p', { class: 'sub', text: `Latest: ${receipts}` }),
  );
  if (c.log.length > 1) {
    card.append(h('button', {
      class: 'btn tiny', text: `Full record (${c.log.length})`,
      onclick: () => {
        const m = h('div', {});
        m.append(head(c.name, `${c.title} — the complete file`));
        for (const entry of [...c.log].reverse()) {
          m.append(h('p', {}, h('span', { class: 'chron-date', text: dateLabel(entry.turn) }), ` ${entry.text}`));
        }
        app.openModal(m);
      },
    }));
  }
  void s;
  return card;
}

// ---------------- Crises (D5, D6) ----------------

function crises(app: App): HTMLElement {
  const s = app.state;
  const root = h('div', {});
  root.append(head('Crises & Incidents', `World tension ${Math.round(s.worldTension)} — the ladder is climbed one rung at a time.`));
  const mine = s.crises.filter((c) => c.a === s.playerId || c.b === s.playerId);
  const others = s.crises.filter((c) => !mine.includes(c));

  if (!mine.length) root.append(h('p', { class: 'sub', text: 'No crisis bears your name this month.' }));
  for (const c of mine) root.append(crisisCard(app, c));

  if (others.length) {
    root.append(h('h3', { text: 'Elsewhere' }));
    for (const c of others) {
      root.append(h('p', { class: 'sub', text: `${c.title} — stage: ${STAGE_LABEL[c.stage]}` }));
    }
  }
  return root;
}

function crisisCard(app: App, c: Crisis): HTMLElement {
  const s = app.state;
  const other = c.a === s.playerId ? c.b : c.a;
  const div = h('div', { class: 'region' });
  div.append(
    h('b', { text: c.title }),
    meter(STAGE_LABEL[c.stage], (c.stage / 4) * 100, c.stage >= 3 ? 'warn' : ''),
    h('p', { class: 'sub', text: `Opposite number: ${s.nations[other].name}. ${c.stage >= 3 ? 'The powers are watching; a congress is possible.' : ''}` }),
  );
  const row = h('div', { class: 'row wrap' });
  const moves: { m: CrisisMove; label: string; cls?: string }[] = [
    { m: 'escalate', label: 'Escalate', cls: 'danger' },
    { m: 'hold', label: 'Hold firm' },
    { m: 'backDown', label: 'Back down' },
    { m: 'appealLeague', label: 'Appeal to the League' },
  ];
  for (const { m, label, cls } of moves) {
    row.append(h('button', {
      class: `btn small ${cls ?? ''}`, text: label,
      onclick: () => {
        const result = crisisMove(s, c, s.playerId, m, new Rng(s.rngState ^ (s.turn * 7919)));
        app.toast(result);
        app.refresh();
      },
    }));
  }
  div.append(row);
  if (c.stage >= 3) {
    div.append(h('button', {
      class: 'btn small', text: 'Convene a congress…',
      onclick: () => {
        const m = h('div', {});
        m.append(head('The Congress Convenes', 'Delegations, drafts, and side rooms. Pick the settlement to champion.'));
        for (const p of congressProposals(s, c)) {
          m.append(
            h('div', { class: 'row' },
              h('div', { class: 'grow' }, h('b', { text: p.label }), h('p', { class: 'sub', text: p.blurb })),
              h('button', {
                class: 'btn small', text: 'Champion', onclick: () => {
                  if (s.nations[s.playerId].politicalCapital < 6) return app.toast('Needs 6 political capital.');
                  s.nations[s.playerId].politicalCapital -= 6;
                  p.apply(s);
                  app.closeModal();
                  app.refresh();
                },
              }),
            ),
          );
        }
        app.openModal(m);
      },
    }));
  }
  return div;
}

// ---------------- Menu (E5, E6) ----------------

function menu(app: App): HTMLElement {
  const s = app.state;
  const root = h('div', {});
  const legacy = computeLegacy(s);
  root.append(
    head('Accord 1936', 'working title — menu'),
    h('p', { class: 'sub', text: `Campaign: ${s.nations[s.playerId].name}, ${dateLabel(s.turn)}. Legacy so far: prestige ${legacy.prestige}, prosperity ${legacy.prosperity}, liberty ${legacy.liberty}.` }),
    h('h3', { text: 'Saves' }),
    h('div', { class: 'row wrap' },
      h('button', { class: 'btn small', text: 'Export save file', onclick: () => exportSave(s) }),
      h('button', {
        class: 'btn small', text: 'Import save file',
        onclick: () => {
          const input = h('input', { type: 'file', accept: '.json' });
          input.addEventListener('change', async () => {
            const f = input.files?.[0];
            if (!f) return;
            const loaded = await importSave(f);
            if (!loaded) return app.toast('That file is not a valid campaign.');
            Object.assign(app.state, loaded);
            app.toast('Campaign restored.');
            app.refresh();
          });
          input.click();
        },
      }),
    ),
    h('h3', { text: 'Ledger Mode' }),
    h('div', { class: 'row' },
      h('p', { class: 'sub grow', text: 'One rolling save; decisions are permanent. The Chronicle means more when you cannot take it back.' }),
      h('button', {
        class: `btn small ${s.ledgerMode ? 'active' : ''}`, text: s.ledgerMode ? 'On' : 'Off',
        onclick: () => { s.ledgerMode = !s.ledgerMode; app.refresh(); },
      }),
    ),
    h('h3', { text: 'Campaign' }),
    h('button', {
      class: 'btn small danger', text: 'Abandon campaign (new game)',
      onclick: () => {
        clearAutosave();
        location.reload();
      },
    }),
    h('p', { class: 'sub', text: 'Map data: historical-basemaps (borders approximate). All characters are fictional.' }),
  );
  return root;
}

// ---------------- Selected nation (D1-D9, R5, R6, T-series entry) ----------------

function nationPanel(app: App): HTMLElement {
  const s = app.state;
  const player = s.nations[s.playerId];
  const id = app.selectedNation!;
  const n = s.nations[id];
  const root = h('div', {});
  if (!n) return root;

  const leader = s.characters[n.leaderId];
  root.append(
    h('div', { class: 'panel-head' },
      h('span', { class: 'swatch', style: `background:${colorHex(n.color)}` }),
      h('div', {},
        h('h2', { text: n.name + (n.playable ? ' ★' : '') + (n.alive ? '' : ' (extinguished)') }),
        h('p', { class: 'sub', text: `${leader?.name ?? 'Unknown'} — ${n.government}${n.note ? ` · ${n.note}` : ''}` }),
      ),
    ),
  );
  if (id === s.playerId) {
    root.append(h('p', { class: 'sub', text: 'This is your nation. Govern it from the panels below.' }));
    return root;
  }
  if (!n.alive) return root;

  const rel = n.relations[s.playerId] ?? { trust: 50, opinion: 0, fear: 10 };
  const mem = memoryScore(n, s.playerId);
  root.append(
    h('h3', { text: 'How they see us' }),
    meter('Trust', rel.trust),
    meter('Opinion', 50 + rel.opinion / 2),
    meter('Fear', rel.fear, 'warn'),
    h('p', { class: 'sub', text: mem < -2 ? 'They hold grudges against us.' : mem > 2 ? 'They remember our favors.' : 'The ledger between us is roughly even.' }),
    h('div', { class: 'stat-row' },
      stat('Standing', Math.round(n.standing)),
      stat('Power', fmt(armyPower(n))),
      stat('Bloc', n.blocId ? s.blocs.find((b) => b.id === n.blocId)?.name ?? '—' : '—'),
    ),
  );

  // Treaties between us
  const shared = s.treaties.filter((t) => t.parties.includes(id) && t.parties.includes(s.playerId));
  if (shared.length) {
    root.append(h('h3', { text: 'Standing accords' }));
    for (const t of shared) {
      const div = h('div', { class: 'region' });
      for (const c of t.clauses) {
        if (c.secret && !(t.exposedSecrets || t.parties.includes(s.playerId))) continue;
        div.append(h('p', { class: 'sub', text: `${describeClause(s, c)}${c.secret ? ' (secret)' : ''}` }));
      }
      div.append(
        h('p', { class: 'sub', text: t.duration === 0 ? 'In force permanently.' : `Expires ${dateLabel(t.startTurn + t.duration)}.` }),
        h('button', {
          class: 'btn tiny danger', text: t.escape ? 'Invoke escape clause' : 'Repudiate (costly)',
          onclick: () => {
            breakTreaty(s, s.playerId, t);
            app.refresh();
          },
        }),
      );
      root.append(div);
    }
  }

  // Actions
  root.append(h('h3', { text: 'Statecraft' }));
  const actions = h('div', { class: 'row wrap' });
  actions.append(
    h('button', { class: 'btn small', text: 'Propose treaty…', onclick: () => openTreatyBuilder(app, id) }),
    h('button', {
      class: `btn small ${player.embargoes.includes(id) ? 'active' : ''}`,
      text: player.embargoes.includes(id) ? 'Lift embargo' : 'Embargo',
      onclick: () => {
        if (player.embargoes.includes(id)) player.embargoes = player.embargoes.filter((e) => e !== id);
        else {
          player.embargoes.push(id);
          const r = n.relations[s.playerId];
          if (r) r.opinion = Math.max(-100, r.opinion - 15);
        }
        app.refresh();
      },
    }),
    h('button', { class: 'btn small', text: 'Dossiers', onclick: () => { app.open('dossiers'); } }),
  );
  // chokepoint lever (R6)
  const myStraits = controlledRegions(s, player).filter((r) => r.chokepoint);
  if (myStraits.length) {
    const closed = player.flags[`closeStraits_${id}`] === true;
    actions.append(h('button', {
      class: `btn small ${closed ? 'active' : ''}`,
      text: closed ? `Reopen ${myStraits[0].chokepoint}` : `Close ${myStraits[0].chokepoint} to them`,
      onclick: () => {
        player.flags[`closeStraits_${id}`] = !closed;
        if (!closed) {
          const r = n.relations[s.playerId];
          if (r) { r.opinion = Math.max(-100, r.opinion - 20); }
          s.worldTension = Math.min(100, s.worldTension + 3);
        }
        app.refresh();
      },
    }));
  }
  // blocs (D4)
  if (!player.blocId) {
    actions.append(h('button', {
      class: 'btn small', text: 'Found a bloc (10⚖)',
      onclick: () => {
        const err = createBloc(s, player, `The ${player.name} Pact`, 'alliance');
        if (err) app.toast(err);
        app.refresh();
      },
    }));
  } else if (!n.blocId) {
    actions.append(h('button', {
      class: 'btn small', text: 'Invite to bloc',
      onclick: () => {
        app.toast(inviteToBloc(s, player, id));
        app.refresh();
      },
    }));
  }
  if (player.blocId) {
    actions.append(h('button', {
      class: 'btn small danger', text: 'Leave bloc',
      onclick: () => { leaveBloc(s, player); app.refresh(); },
    }));
  }
  root.append(actions);

  // espionage (D7/D8)
  root.append(h('h3', { text: 'The Quiet Service' }));
  const net = player.intel[id] ?? { network: 0, op: null };
  player.intel[id] = net;
  root.append(meter('Network', net.network));
  const ops = h('div', { class: 'row wrap' });
  const available: SpyOpKind[] = ['intel', 'influence', 'sabotage', 'counterintel', 'rig', 'coup'];
  for (const op of available) {
    ops.append(h('button', {
      class: `btn tiny ${net.op === op ? 'active' : ''}`,
      text: OP_LABEL[op],
      onclick: () => {
        setOperation(player, id, net.op === op ? null : op);
        app.refresh();
      },
    }));
  }
  root.append(ops, h('p', { class: 'sub', text: 'Networks grow with time. Bolder operations risk louder failures.' }));

  if (atWarWith(s, s.playerId, id)) {
    root.append(h('p', { class: 'bad', text: 'We are at war with this nation.' }));
  }
  return root;
}
