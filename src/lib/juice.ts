/** A quick screen shake for big moments (wins, big clears). CSS-driven. */
export function shake(): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById('root');
  if (!el) return;
  el.classList.remove('juice-shake');
  // Force reflow so the animation can retrigger back-to-back.
  void el.offsetWidth;
  el.classList.add('juice-shake');
  window.setTimeout(() => el.classList.remove('juice-shake'), 450);
}
