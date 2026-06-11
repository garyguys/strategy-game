/** T1 — the two-column treaty builder, with ratification (T5) and counters (T7). */
import type { App } from './app';
import { h, stat } from './dom';
import type { Clause, ClauseType, NationState } from '../engine/types';
import { GOODS, GOOD_LABEL, type Good } from '../data/goods';
import { CLAUSE_LABEL, describeClause, propose, evaluate, needsRatification, warScoreFor, sign, endWar } from '../systems/treaty';
import { legislatureVote } from '../systems/internal';
import { dateLabel } from '../engine/util';

interface Draft {
  clauses: Clause[];
  duration: number;
  escape: boolean;
  guarantorId?: string;
}

const PEACE_TYPES: ClauseType[] = ['cession', 'reparations', 'demilitarized', 'cash'];
const NORMAL_TYPES: ClauseType[] = [
  'nonAggression', 'defensivePact', 'tradeAgreement', 'resourceContract', 'militaryAccess',
  'guarantee', 'cession', 'demilitarized', 'techSharing', 'cash', 'loan',
];

export function openTreatyBuilder(app: App, targetId: string, opts: { warId?: string } = {}): void {
  const draft: Draft = { clauses: [], duration: 60, escape: false };
  renderBuilder(app, targetId, draft, opts);
}

function renderBuilder(app: App, targetId: string, draft: Draft, opts: { warId?: string }): void {
  const s = app.state;
  const player = s.nations[s.playerId];
  const target = s.nations[targetId];
  const peace = !!opts.warId;
  const root = h('div', { class: 'builder' });

  root.append(
    h('div', { class: 'panel-title' },
      h('h2', { text: peace ? `Peace negotiation with ${target.name}` : `Treaty with ${target.name}` }),
      h('p', { class: 'sub', text: peace ? 'The table replaces the front. Bargaining power follows the armies.' : 'Compose the package. They will weigh every clause.' }),
    ),
  );

  if (peace) {
    const war = s.wars.find((w) => w.id === opts.warId);
    if (war) {
      const score = warScoreFor(s, war, s.playerId);
      root.append(h('p', { class: 'sub', text: `Our position at the table: ${score > 20 ? 'commanding' : score > 0 ? 'favorable' : score > -20 ? 'contested' : 'weak'} (${Math.round(score)}).` }));
    }
  }

  // current clauses, two columns
  const give = draft.clauses.filter((c) => c.from === s.playerId);
  const get = draft.clauses.filter((c) => c.from === targetId);
  const cols = h('div', { class: 'builder-cols' });
  for (const [label, list] of [['We give', give], ['We receive', get]] as const) {
    const col = h('div', { class: 'builder-col' }, h('h3', { text: label }));
    if (!list.length) col.append(h('p', { class: 'sub', text: '— nothing —' }));
    for (const c of list) {
      col.append(
        h('div', { class: 'row' },
          h('span', { class: 'grow sub', text: `${describeClause(s, c)}${c.secret ? ' 🤫' : ''}` }),
          h('button', {
            class: 'btn tiny', text: '×',
            onclick: () => {
              draft.clauses = draft.clauses.filter((x) => x !== c);
              renderBuilder(app, targetId, draft, opts);
            },
          }),
        ),
      );
    }
    cols.append(col);
  }
  root.append(cols);

  // add-clause form
  const types = peace ? PEACE_TYPES : NORMAL_TYPES;
  const typeSel = h('select', {});
  for (const t of types) typeSel.append(h('option', { value: t, text: CLAUSE_LABEL[t] }));
  const dirSel = h('select', {},
    h('option', { value: 'give', text: 'We provide' }),
    h('option', { value: 'get', text: 'They provide' }),
  );
  const goodSel = h('select', {});
  for (const g of GOODS) goodSel.append(h('option', { value: g, text: GOOD_LABEL[g] }));
  const qty = h('input', { type: 'number', value: '5', min: '1', style: 'width:70px' });
  const amount = h('input', { type: 'number', value: '50', min: '1', style: 'width:80px' });
  const regionSel = h('select', {});
  const secret = h('input', { type: 'checkbox', id: 'cl-secret' });

  const refreshRegionOptions = () => {
    regionSel.textContent = '';
    const from = (dirSel as HTMLSelectElement).value === 'give' ? player : target;
    for (const rid of from.regionIds) {
      const r = s.regions[rid];
      if (r) regionSel.append(h('option', { value: rid, text: r.name }));
    }
  };
  refreshRegionOptions();
  dirSel.addEventListener('change', refreshRegionOptions);

  root.append(
    h('h3', { text: 'Add a clause' }),
    h('div', { class: 'row wrap' }, typeSel, dirSel, goodSel, qty, amount, regionSel,
      h('label', { class: 'sub', for: 'cl-secret' }, secret, ' secret'),
      h('button', {
        class: 'btn small', text: 'Add',
        onclick: () => {
          const type = (typeSel as HTMLSelectElement).value as ClauseType;
          const giveDir = (dirSel as HTMLSelectElement).value === 'give';
          const from = giveDir ? s.playerId : targetId;
          const to = giveDir ? targetId : s.playerId;
          const clause: Clause = { type, from, to, secret: (secret as HTMLInputElement).checked || undefined };
          if (type === 'resourceContract') {
            clause.good = (goodSel as HTMLSelectElement).value as Good;
            clause.qty = Math.max(1, Number((qty as HTMLInputElement).value));
            clause.amount = Math.max(1, Number((amount as HTMLInputElement).value));
          }
          if (type === 'cash' || type === 'loan' || type === 'reparations') {
            clause.amount = Math.max(1, Number((amount as HTMLInputElement).value));
          }
          if (type === 'cession' || type === 'demilitarized') {
            clause.regionId = (regionSel as HTMLSelectElement).value;
            if (!clause.regionId) return app.toast('Pick a region.');
          }
          draft.clauses.push(clause);
          renderBuilder(app, targetId, draft, opts);
        },
      }),
    ),
    h('p', { class: 'sub', text: 'Resource contracts use Good/Qty/Payment. Cash, loans, reparations use Payment. Cessions use the region picker.' }),
  );

  // terms
  const durSel = h('select', {
    onchange: (e: Event) => { draft.duration = Number((e.target as HTMLSelectElement).value); },
  },
    h('option', { value: '12', text: '1 year' }),
    h('option', { value: '60', text: '5 years', selected: 'selected' }),
    h('option', { value: '0', text: 'Permanent' }),
  );
  const escapeBox = h('input', { type: 'checkbox', id: 'tr-escape' });
  escapeBox.addEventListener('change', () => { draft.escape = (escapeBox as HTMLInputElement).checked; });
  const guarantorSel = h('select', {
    onchange: (e: Event) => { draft.guarantorId = (e.target as HTMLSelectElement).value || undefined; },
  }, h('option', { value: '', text: 'No guarantor' }));
  for (const g of Object.values(s.nations).filter((x: NationState) => x.alive && x.major && x.id !== s.playerId && x.id !== targetId)) {
    guarantorSel.append(h('option', { value: g.id, text: g.name }));
  }
  root.append(h('div', { class: 'row wrap' },
    h('span', { class: 'sub', text: 'Term:' }), durSel,
    h('label', { class: 'sub', for: 'tr-escape' }, escapeBox, ' escape clause (costs goodwill)'),
    peace ? '' : guarantorSel,
  ));

  // their appraisal (visible if we have intel — D7 reward)
  const known = player.flags[`intel_${targetId}`] !== undefined;
  if (draft.clauses.length) {
    const evald = evaluate(s, targetId, s.playerId, draft.clauses, draft.duration,
      opts.warId ? warScoreFor(s, s.wars.find((w) => w.id === opts.warId)!, s.playerId) : 0, draft.escape);
    root.append(
      h('div', { class: 'stat-row' },
        stat('Their appraisal', known ? `${Math.round(evald.total)} (${evald.total >= 0 ? 'acceptable' : 'short'})` : evald.total >= 0 ? 'reads agreeable' : 'reads doubtful'),
      ),
    );
  }

  // submit
  root.append(h('div', { class: 'row' },
    h('button', {
      class: 'btn', text: peace ? 'Offer these terms' : 'Propose the treaty',
      disabled: !draft.clauses.length,
      onclick: () => submit(app, targetId, draft, opts),
    }),
    h('button', { class: 'btn small', text: 'Cancel', onclick: () => app.closeModal() }),
  ));

  app.openModal(root);
}

function submit(app: App, targetId: string, draft: Draft, opts: { warId?: string }): void {
  const s = app.state;
  const player = s.nations[s.playerId];

  const conclude = () => {
    const result = propose(s, s.playerId, targetId, draft.clauses, draft.duration, {
      guarantorId: draft.guarantorId, warId: opts.warId, escape: draft.escape,
    });
    if (result.outcome === 'accepted') {
      app.toast(`${s.nations[targetId].name} signs.`);
      app.closeModal();
    } else if (result.outcome === 'countered' && result.counter) {
      showCounter(app, targetId, { ...draft, clauses: result.counter }, opts);
      return;
    } else {
      app.toast(result.reason ?? 'Refused.');
      app.closeModal();
    }
    app.refresh();
  };

  // T5 — ratification first, where the constitution demands it
  if (!opts.warId && needsRatification(player, draft.clauses) && !(typeof player.flags['decreeUntil'] === 'number' && (player.flags['decreeUntil'] as number) > s.turn)) {
    openRatification(app, targetId, draft, conclude);
  } else {
    conclude();
  }
}

function openRatification(app: App, targetId: string, draft: Draft, onPassed: () => void): void {
  const s = app.state;
  const player = s.nations[s.playerId];
  const root = h('div', {});
  let whip = 0;
  const whipLabel = h('span', { class: 'sub', text: 'whip 0⚖' });
  root.append(
    h('div', { class: 'panel-title' }, h('h2', { text: 'The House Must Consent' }),
      h('p', { class: 'sub', text: 'A treaty of this weight needs ratification. Spend capital to whip the vote.' })),
    h('input', {
      type: 'range', min: '0', max: String(Math.floor(player.politicalCapital)), value: '0',
      oninput: (e: Event) => {
        whip = Number((e.target as HTMLInputElement).value);
        whipLabel.textContent = `whip ${whip}⚖`;
      },
    }),
    whipLabel,
    h('div', { class: 'row' },
      h('button', {
        class: 'btn', text: 'Call the vote',
        onclick: () => {
          const { passed, support } = legislatureVote(s, player, targetId, draft.clauses, whip);
          app.closeModal();
          if (passed) {
            app.toast(`Ratified, ${support} ayes.`);
            onPassed();
          } else {
            app.toast(`Defeated — only ${support} ayes. The treaty dies on the floor.`);
            player.stability = Math.max(0, player.stability - 2);
            app.refresh();
          }
        },
      }),
      h('button', { class: 'btn small', text: 'Withdraw', onclick: () => app.closeModal() }),
    ),
  );
  app.openModal(root);
}

function showCounter(app: App, targetId: string, draft: Draft, opts: { warId?: string }): void {
  const s = app.state;
  const root = h('div', {});
  root.append(
    h('div', { class: 'panel-title' },
      h('h2', { text: `${s.nations[targetId].name} counters` }),
      h('p', { class: 'sub', text: 'Not a refusal — an invoice. Their amended terms:' })),
  );
  for (const c of draft.clauses) {
    root.append(h('p', { class: 'sub', text: `• ${describeClause(s, c)}` }));
  }
  root.append(h('div', { class: 'row' },
    h('button', {
      class: 'btn', text: 'Accept their terms',
      onclick: () => {
        const treaty = sign(s, [s.playerId, targetId], draft.clauses, draft.duration, draft.guarantorId);
        treaty.escape = draft.escape;
        if (opts.warId) endWar(s, opts.warId, `Peace of ${dateLabel(s.turn)}`);
        app.toast('Signed as amended.');
        app.closeModal();
        app.refresh();
      },
    }),
    h('button', {
      class: 'btn small', text: 'Amend further…',
      onclick: () => renderBuilder(app, targetId, draft, opts),
    }),
    h('button', { class: 'btn small', text: 'Walk away', onclick: () => app.closeModal() }),
  ));
  app.openModal(root);
}
