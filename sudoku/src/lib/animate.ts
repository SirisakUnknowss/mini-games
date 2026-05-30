// =====================================================================
// Tiny animation helpers — no deps, respect prefers-reduced-motion
// =====================================================================

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

/** Animate a number going from `from` → `to` inside an element. */
export function countUp(
  el: HTMLElement,
  from: number,
  to: number,
  durationMs = 700,
  format: (n: number) => string = (n) => Math.round(n).toLocaleString(),
): void {
  if (reducedMotion() || from === to) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const delta = to - from;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / durationMs);
    // ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = format(from + delta * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Spawn a short-lived floating "+50 💰" indicator near an anchor element. */
export function floatReward(anchor: HTMLElement, label: string): void {
  if (reducedMotion()) return;
  const rect = anchor.getBoundingClientRect();
  const node = document.createElement('div');
  node.className = 'float-reward';
  node.textContent = label;
  node.style.left = `${rect.left + rect.width / 2}px`;
  node.style.top = `${rect.top}px`;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 1200);
}
