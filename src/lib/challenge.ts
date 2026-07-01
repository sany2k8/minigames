/**
 * "Challenge a friend" share codes. Because race/score puzzles are fully
 * determined by their seed, a challenge is just {game, seed, score, name}
 * packed into a URL hash — the friend opens it, plays the identical puzzle
 * offline, and tries to beat the score. No server, no accounts.
 */
export interface Challenge {
  gameId: string;
  seed: number;
  score: number;
  name: string;
}

// base64url helpers that survive unicode names.
function b64urlEncode(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeChallenge(c: Challenge): string {
  // Short keys keep the code compact.
  return b64urlEncode(JSON.stringify({ g: c.gameId, s: c.seed, c: c.score, n: c.name }));
}

export function decodeChallenge(code: string): Challenge | null {
  try {
    const o = JSON.parse(b64urlDecode(code));
    if (typeof o.g !== 'string' || typeof o.s !== 'number' || typeof o.c !== 'number') return null;
    return { gameId: o.g, seed: o.s, score: o.c, name: typeof o.n === 'string' ? o.n : 'A friend' };
  } catch {
    return null;
  }
}

/** Full shareable URL for a challenge (HashRouter route /vs/:code). */
export function challengeUrl(c: Challenge): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/vs/${encodeChallenge(c)}`;
}

/**
 * Share via the native share sheet when available, else copy to clipboard.
 * Returns 'shared' | 'copied' | 'failed' so the caller can show feedback.
 */
export async function shareChallenge(c: Challenge): Promise<'shared' | 'copied' | 'failed'> {
  const url = challengeUrl(c);
  const text = `Beat my score of ${c.score} — I challenge you! 🎮`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'No WiFi Games', text, url });
      return 'shared';
    }
  } catch {
    return 'failed'; // user cancelled the share sheet
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
