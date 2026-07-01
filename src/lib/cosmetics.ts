/**
 * Cosmetics you buy with coins: accent themes (recolor the whole light UI by
 * overriding the Tailwind `--color-coral*` tokens at runtime) and profile
 * avatars. Purely visual — no gameplay effect.
 */
export interface Theme {
  id: string;
  name: string;
  cost: number;
  coral: string;
  coral2: string;
  soft: string;
  ink: string;
}

export interface Avatar {
  id: string;
  name: string;
  cost: number;
  emoji: string; // '' = use initials
}

export const THEMES: Theme[] = [
  { id: 'theme-coral', name: 'Coral', cost: 0, coral: '#FF5A3C', coral2: '#FB7E50', soft: '#FFEDE7', ink: '#D6432A' },
  { id: 'theme-ocean', name: 'Ocean', cost: 150, coral: '#2D9CDB', coral2: '#56CCF2', soft: '#E6F4FC', ink: '#1D6FA5' },
  { id: 'theme-grape', name: 'Grape', cost: 150, coral: '#8B5CF6', coral2: '#A855F7', soft: '#F1ECFE', ink: '#6D28D9' },
  { id: 'theme-forest', name: 'Forest', cost: 200, coral: '#22C55E', coral2: '#4ADE80', soft: '#E7F8EE', ink: '#15803D' },
  { id: 'theme-sunset', name: 'Sunset', cost: 250, coral: '#FB7185', coral2: '#FB923C', soft: '#FFEDE9', ink: '#BE3A52' },
  { id: 'theme-mono', name: 'Slate', cost: 300, coral: '#475569', coral2: '#64748B', soft: '#EEF2F6', ink: '#334155' }
];

export const AVATARS: Avatar[] = [
  { id: 'avatar-initials', name: 'Initials', cost: 0, emoji: '' },
  { id: 'avatar-fox', name: 'Fox', cost: 60, emoji: '🦊' },
  { id: 'avatar-panda', name: 'Panda', cost: 60, emoji: '🐼' },
  { id: 'avatar-rocket', name: 'Rocket', cost: 100, emoji: '🚀' },
  { id: 'avatar-alien', name: 'Alien', cost: 100, emoji: '👾' },
  { id: 'avatar-dragon', name: 'Dragon', cost: 150, emoji: '🐲' },
  { id: 'avatar-unicorn', name: 'Unicorn', cost: 150, emoji: '🦄' },
  { id: 'avatar-wizard', name: 'Wizard', cost: 200, emoji: '🧙' }
];

export const DEFAULT_OWNED = ['theme-coral', 'avatar-initials'];

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];
export const avatarById = (id: string) => AVATARS.find((a) => a.id === id) ?? AVATARS[0];

/** Recolor the app by overriding the Tailwind coral tokens on :root. */
export function applyTheme(id: string): void {
  if (typeof document === 'undefined') return;
  const t = themeById(id);
  const root = document.documentElement.style;
  root.setProperty('--color-coral', t.coral);
  root.setProperty('--color-coral-2', t.coral2);
  root.setProperty('--color-coral-soft', t.soft);
  root.setProperty('--color-coral-ink', t.ink);
}
