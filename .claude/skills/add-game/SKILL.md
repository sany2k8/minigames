---
name: add-game
description: Scaffold one or more new offline mini-games into the "No WiFi Games" app following its GameModule architecture. Use whenever the user asks to add, create, or implement a new game or batch of games by name + a short brief (e.g. "/add-game Snake: classic snake; Sokoban: push boxes onto targets"). Handles logic, UI, bot, icon, registry, CSS, tests, and verification.
---

# Add Game(s) to No WiFi Games

This project is a fully **offline, browser-playable** mini-games PWA. Every game is a
self-contained module that plugs into a shared engine. Follow this playbook exactly so a new
game inherits routing, the mode picker (1P / 2P / vs-Bot), scoring, results, rewards/confetti,
favorites, recents, responsive layout, and the Neon Arcade glass theme **for free**.

Read `CLAUDE.md` first for architecture. Work in the project root (`minigames/`).

## Input
The user gives a list of `Title: brief`. For each game, decide:
1. **`id`** — kebab-case (e.g. `snake`, `tower-stack`). The folder + registry key.
2. **`category`** — one of `puzzle | card | word | arcade | board | sort` (`src/engine/types.ts`).
3. **`contest`** — how it's contested (this is the most important choice):
   - **`score`** — single-player puzzle/arcade. 1P plays one round; vs-Bot = human round then a bot round, higher score wins; 2P = alternating rounds. **Default for most games.**
   - **`race`** — both players solve the *same seeded* board on a split screen; first to finish wins. Use when a puzzle has a clear "solved" state and head-to-head racing is fun.
   - **`table`** — a single shared board the game runs itself (turn-based board/card games, or real-time vs a bot). Use for 2-player turn games (Checkers, Reversi) and real-time-vs-bot (Tower War).

If any of these is ambiguous from the brief, pick the sensible default and state it; only ask the user when it materially changes the design.

## The contract (`src/engine/types.ts`)
A game's `src/games/<id>/index.tsx` must `export default` a `GameModule`:
- **`score` / `race`** → `{ contest, Solo }` where `Solo` is a `React.FC<SoloGameProps>`.
  - Props: `{ seed, player, isBot, difficulty, paused, onProgress?, onScore?, onDone }`.
  - It plays ONE board for ONE seat. **Drive your own bot when `isBot` is true.**
  - Call `onDone({ solved, score, timeMs })` exactly once when finished. Report live via `onScore`/`onProgress` (0–100).
- **`table`** → `{ contest, Table }` where `Table` is a `React.FC<TableGameProps>`.
  - Props: `{ players, onGameOver }`. Manage the whole board + all bots yourself.
  - `players` has `{ seat, name, kind: 'human'|'bot', color, difficulty }`. For 2-player games use `players.slice(0, 2)`.
  - Call `onGameOver(winnerSeat)`; pass **`-1` for a draw**.

## Steps per game
1. **Reuse first.** If a close cousin exists, import its `logic.ts` instead of duplicating (precedent: `nuts-and-bolts` & `liquid-lab` reuse `water-sort/logic`; `unblock-me` reuses `traffic-jam/logic`; `block-blast` & `blockudoku` mirror `color-blocks`; `tile-match` reuses `goods-match`; `word-wipe`/`word-finder` share the dictionary in `word-finder/words.ts`).
2. **`src/games/<id>/logic.ts`** — pure, deterministic rules + a bot helper. No React, no DOM. This is what tests target.
3. **`src/games/<id>/index.tsx`** — the React component(s) + `export default mod`.
4. **Icon** — add an SVG component to `src/games/icons.tsx` and an entry to the `ICONS` map. SVG attrs must be **camelCase** (`strokeWidth`, `fontSize`, `textAnchor`).
5. **Registry** — append one entry to `src/games/registry.ts`: `{ id, title, category, contest, blurb, icon: ICONS['<id>'], accent, accent2, load: () => import('./<id>').then(m => m.default), featured? }`. `accent`/`accent2` are the tile gradient.
6. **CSS** — add game-specific classes to `src/games/games.css`. Use the shared `.board` / `.board-info` / `.hint` wrappers and the **legacy tokens** (`--surface`, `--text-dim`, `--accent-2`, `--ok`, etc.). Size boards with **container-query units** (`cqmin`/`cqh`) so they fill the pane on desktop. For canvas games use the `.cv-board` class.
7. **Tests** — add cases to a `src/games/__tests__/*.test.ts` file for the tricky pure logic (generation validity, win/clear detection, bot move legality, determinism: same seed → same board).

## Conventions (do not break these)
- **Determinism:** `race`/`score` logic must seed `makeRng(seed)` from props — never `Math.random` — so opponents get identical boards. Give the bot a *derived* seed (`makeRng(seed ^ 0x9e3779b9)`) so it doesn't mirror the human. (`table` games may use a fresh `randomSeed()`.)
- **Bots:** pace with `botTickMs[difficulty]` from `src/engine/rng.ts`; only act when `!paused && !done`. Every contest needs a working bot (vs-Bot mode).
- **Styling is hybrid:** dashboard/chrome use **Tailwind v4**; in-game boards use **plain CSS + legacy tokens** in `games.css`. Don't delete the compatibility token block at the bottom of `src/theme/global.css`.
- **Tailwind dynamic classes don't compile** — never interpolate (`bg-${x}`). Use a lookup of full literal class strings, or inline `style`.
- **Centering raw text in a grid is unreliable** — wrap dynamic text in a `<span>` or use `flex items-center justify-center`.
- **Canvas games:** drive with `requestAnimationFrame`; handle `devicePixelRatio`; declare any `xxxRef` used inside the rAF effect **before** the `useEffect`; clean up with `cancelAnimationFrame`. Use pointer events + `touch-action: none`; for drag across elements use `document.elementFromPoint`. Set `[--game-accent]` / sizes via the player's `color` where relevant.
- **Chrome icons** (not game tile art) use Material Symbols (`<span className="material-symbols-outlined">`).

## Verify (the gate — all must pass)
Run from `minigames/`:
```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.json   # strict: noUnusedLocals/Params — clean it up
./node_modules/.bin/vitest run                       # logic tests
npm run build                                         # tsc -b + vite build + SW
```
Then play-test with the preview tools: launch the dev server, open `#/game/<id>`, click **Start Game**, and confirm the board renders + is interactive (tap/drag works, bot plays, win/score fires). Check mobile (375px) and desktop. Screenshot as proof.

## Minimal templates

### `score` Solo (`index.tsx`)
```tsx
import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { /* generate, step, isSolved, botMove */ } from './logic';
import '../games.css';

function MyGameSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [state, setState] = useState(() => /* generate(rng, difficulty) */);
  const start = useRef(Date.now());
  const done = useRef(false);
  const finish = (solved: boolean, score: number) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved, score, timeMs: Date.now() - start.current });
  };
  // bot loop
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {/* apply botMove(state); maybe finish() */}, botTickMs[difficulty]);
    return () => clearTimeout(t);
  }, [state, isBot, paused, difficulty]);

  return (
    <div className="board">
      <div className="board-info"><span>Score 0</span></div>
      {/* board UI; tap/drag guarded by !isBot && !paused && !done.current */}
      {!isBot && <div className="hint">How to play…</div>}
    </div>
  );
}
const mod: GameModule = { contest: 'score', Solo: MyGameSolo };
export default mod;
```

### `table` (turn-based, 2 seats)
```tsx
import type { GameModule, TableGameProps } from '../../engine/types';
function MyTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  // state + turn; on human tap apply move; bot effect when seats[turn].kind === 'bot'
  // onGameOver(seats[winner].seat) or onGameOver(-1) for a draw
  return <div className="board">{/* … */}</div>;
}
const mod: GameModule = { contest: 'table', Table: MyTable };
export default mod;
```

When done, give the user a one-line summary per game (title, category, contest, how the bot works) and the verification results.
