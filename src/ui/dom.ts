/** Tiny DOM helpers for the panel UI. */

type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else if (k === 'text') el.textContent = String(v);
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === 'value' && 'value' in el) (el as HTMLInputElement).value = String(v);
    else if (k === 'disabled' && v) (el as HTMLButtonElement).disabled = true;
    else el.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el: HTMLElement): void {
  el.textContent = '';
}

export function colorHex(c: number): string {
  return '#' + c.toString(16).padStart(6, '0');
}

export function signed(n: number): string {
  const v = Math.round(n * 10) / 10;
  return v > 0 ? `+${v}` : `${v}`;
}

/** A labelled stat block. */
export function stat(label: string, value: string | number): HTMLElement {
  return h('span', { class: 'stat' }, h('b', { text: label }), String(value));
}

/** Simple meter bar 0..100. */
export function meter(label: string, value: number, hue = ''): HTMLElement {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return h(
    'div',
    { class: 'meter' },
    h('span', { class: 'meter-label', text: label }),
    h('span', { class: 'meter-track' }, h('span', { class: `meter-fill ${hue}`, style: `width:${v}%` })),
    h('span', { class: 'meter-num', text: String(v) }),
  );
}
