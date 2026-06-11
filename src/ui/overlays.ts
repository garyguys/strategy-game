/** Scene modal (N2), newspaper (N9), briefing (E4), offers inbox (T7), endings (N10/E3). */
import type { App } from './app';
import { h } from './dom';
import { dateLabel } from '../engine/util';
import type { QueuedScene, TreatyOffer } from '../engine/types';
import { ALL_SCENES, dueScenes, resolveScene } from '../systems/events';
import { describeClause, sign, endWar } from '../systems/treaty';
import { monthlyDemand } from '../systems/economy';
import { getRelation } from '../engine/state';

/** Show queued scenes one at a time; then call done(). */
export function playScenes(app: App, done: () => void): void {
  const s = app.state;
  const due = dueScenes(s);
  if (!due.length) return done();
  showScene(app, due[0], () => playScenes(app, done));
}

function showScene(app: App, queued: QueuedScene, next: () => void): void {
  const s = app.state;
  const scene = ALL_SCENES.get(queued.sceneId);
  if (!scene) {
    s.sceneQueue = s.sceneQueue.filter((q) => q !== queued);
    return next();
  }
  const nation = s.nations[queued.nationId];
  const speaker = scene.speaker ? s.characters[scene.speaker]?.name ?? scene.speaker : null;
  let text = '';
  try {
    text = scene.text({ state: s, nation });
  } catch {
    text = '(The dispatch is illegible.)';
  }
  const card = h('div', { class: 'scene' },
    h('p', { class: 'scene-date', text: dateLabel(s.turn) }),
    h('h2', { text: scene.title }),
    speaker ? h('p', { class: 'scene-speaker', text: `— ${speaker}` }) : null,
    h('p', { class: 'scene-text', text }),
  );
  for (const opt of scene.options) {
    let enabled = true;
    try {
      enabled = opt.enabled ? opt.enabled({ state: s, nation }) : true;
    } catch {
      enabled = false;
    }
    card.append(
      h('button', {
        class: 'btn scene-opt', text: opt.text, disabled: !enabled,
        onclick: () => {
          resolveScene(s, queued, opt.id);
          app.closeModal();
          app.refresh();
          next();
        },
      }),
    );
  }
  app.openModal(card);
}

/** N9 — the end-turn newspaper. */
export function showNewspaper(app: App, done: () => void): void {
  const s = app.state;
  if (!s.digest.length) return done();
  const paper = h('div', { class: 'newspaper' },
    h('div', { class: 'np-masthead' },
      h('h1', { text: 'THE CONTINENTAL GAZETTE' }),
      h('p', { class: 'np-date', text: `${dateLabel(s.turn)} — Price 10 ¢ — All the world in one sheet` }),
    ),
  );
  const [lead, ...rest] = s.digest;
  paper.append(h('h2', { class: 'np-lead', text: lead }));
  const cols = h('div', { class: 'np-cols' });
  for (const line of rest.slice(0, 10)) cols.append(h('p', { text: line }));
  if (!rest.length) cols.append(h('p', { class: 'sub', text: 'A quiet month, by recent standards. Nobody believes it will last.' }));
  paper.append(cols, h('button', { class: 'btn', text: 'Set the paper down', onclick: () => { app.closeModal(); done(); } }));
  app.openModal(paper);
}

/** E4 — the morning briefing: what needs you. */
export function showBriefing(app: App, done: () => void): void {
  const s = app.state;
  const n = s.nations[s.playerId];
  const items: string[] = [];

  if (s.offers.length) items.push(`${s.offers.length} diplomatic offer${s.offers.length > 1 ? 's' : ''} await${s.offers.length > 1 ? '' : 's'} your answer.`);
  const myCrises = s.crises.filter((c) => c.a === s.playerId || c.b === s.playerId);
  if (myCrises.length) items.push(`${myCrises.length} crisis ladder${myCrises.length > 1 ? 's' : ''} involve${myCrises.length > 1 ? '' : 's'} us directly.`);
  for (const t of s.treaties) {
    if (t.duration === 0 || !t.parties.includes(s.playerId)) continue;
    const left = t.startTurn + t.duration - s.turn;
    if (left > 0 && left <= 2) {
      items.push(`Accord with ${t.parties.filter((p) => p !== s.playerId).map((p) => s.nations[p].name).join(', ')} lapses in ${left} month${left > 1 ? 's' : ''}.`);
    }
  }
  const demand = monthlyDemand(s, n);
  for (const g of ['grain', 'oil', 'arms'] as const) {
    const need = demand[g] ?? 0;
    if (need > 0 && n.stockpiles[g] < need * 2) items.push(`The ${g} stockpile covers under two months of demand.`);
  }
  if (n.electionDue !== null && n.electionDue <= 6) items.push(`The election is ${n.electionDue} month${n.electionDue === 1 ? '' : 's'} away.`);
  if (!n.research.current) items.push('The research institutes sit idle.');
  if (!n.agenda.current) items.push('No national agenda is set.');
  if (n.treasury < 0) items.push('The treasury is in deficit; the bankers are circling.');

  if (!items.length) return done();
  const brief = h('div', { class: 'briefing' },
    h('h2', { text: 'The Morning Briefing' }),
    h('p', { class: 'sub', text: 'Your chief of staff, with the folder that matters.' }),
  );
  for (const item of items.slice(0, 8)) brief.append(h('p', { text: `• ${item}` }));
  brief.append(h('button', { class: 'btn', text: 'To work', onclick: () => { app.closeModal(); done(); } }));
  app.openModal(brief);
}

/** T7/W8 — pending offers from AI nations. */
export function showOffers(app: App, done: () => void): void {
  const s = app.state;
  if (!s.offers.length) return done();
  const offer = s.offers[0];
  showOffer(app, offer, () => showOffers(app, done));
}

function showOffer(app: App, offer: TreatyOffer, next: () => void): void {
  const s = app.state;
  const from = s.nations[offer.from];
  const card = h('div', { class: 'scene' },
    h('h2', { text: offer.warId ? 'A Peace Feeler' : 'A Proposal Arrives' }),
    h('p', { class: 'scene-speaker', text: `— the ${from.name} embassy` }),
    h('p', { class: 'scene-text', text: offer.message }),
  );
  for (const c of offer.clauses) card.append(h('p', { class: 'sub', text: `• ${describeClause(s, c)}` }));
  card.append(
    h('button', {
      class: 'btn scene-opt', text: 'Accept',
      onclick: () => {
        s.offers = s.offers.filter((o) => o.id !== offer.id);
        sign(s, [offer.from, s.playerId], offer.clauses, offer.duration, offer.guarantorId);
        if (offer.warId) endWar(s, offer.warId, `Peace of ${dateLabel(s.turn)}`);
        app.closeModal();
        app.refresh();
        next();
      },
    }),
    h('button', {
      class: 'btn scene-opt', text: 'Decline',
      onclick: () => {
        s.offers = s.offers.filter((o) => o.id !== offer.id);
        const rel = getRelation(s, offer.from, s.playerId);
        rel.opinion = Math.max(-100, rel.opinion - 4);
        app.closeModal();
        app.refresh();
        next();
      },
    }),
  );
  app.openModal(card);
}

/** N10/E3 — the ending screen. */
export function showGameOver(app: App): void {
  const s = app.state;
  if (!s.gameOver) return;
  const over = h('div', { class: 'scene' },
    h('h2', { text: 'The Reckoning' }),
    h('p', { class: 'scene-text', text: s.gameOver.reason }),
  );
  for (const line of s.gameOver.epilogue) {
    over.append(h('p', { class: line.startsWith('—') ? 'scene-speaker' : 'sub', text: line }));
  }
  over.append(h('button', {
    class: 'btn', text: 'Begin a new history',
    onclick: () => {
      import('../engine/serialize').then(({ clearAutosave }) => {
        clearAutosave();
        location.reload();
      });
    },
  }));
  app.openModal(over);
}
