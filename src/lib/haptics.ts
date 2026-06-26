/**
 * Haptic-like vibration feedback. Wraps the Vibration API (mobile) and is a
 * no-op where unsupported. A global delegated listener gives every tappable
 * element a light buzz without wiring each one.
 */
let enabled = true;

export const setHapticsEnabled = (on: boolean) => {
  enabled = on;
};

export function haptic(pattern: number | number[] = 10): void {
  if (!enabled) return;
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

export const tapBuzz = () => haptic(8);
export const selectBuzz = () => haptic(14);
export const winBuzz = () => haptic([20, 40, 30, 40, 60]);

const INTERACTIVE = 'button, a, [role="button"], .gcard, .tile, .chip, .sm-pad, input[type="button"]';

/** Attach once: any pointerdown on an interactive element gives a light buzz. */
export function initGlobalHaptics(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener(
    'pointerdown',
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest(INTERACTIVE)) tapBuzz();
    },
    { passive: true }
  );
}
