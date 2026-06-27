# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**No WiFi Games** — an installable, fully offline (PWA) mini-games web app where two players
play on the same device (pass-and-play) or against a bot. Built to scale to 100+ games:
adding a game is a self-contained folder plus one registry entry. Stack: React 18 + TypeScript
+ Vite + `vite-plugin-pwa` + zustand + react-router (HashRouter) + Vitest.

## Commands

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # tsc -b (type-check) then vite build + generates service worker
npm run preview    # serve the production build — use this to test offline/PWA behavior
npm run test       # run all unit tests once (vitest run)
npm run test:watch # vitest in watch mode
npx vitest run src/games/__tests__/games.test.ts   # run a single test file
npx vitest run -t "color-cards"                     # run tests matching a name
npx tsc --noEmit -p tsconfig.json                   # type-check only
```

There is no linter configured; `tsconfig.json` is strict (`noUnusedLocals`,
`noUnusedParameters`), and `npm run build` fails on type or unused-symbol errors — treat a
clean build as the gate.

## Git commit messages

Use Conventional Commits (`type(scope): subject`), e.g. `feat`, `fix`, `chore`, `refactor`,
`docs`, `test`. **Never use `claude` (or `ai`/`assistant`/`bot`) as the scope or anywhere in
the subject line** — the scope must name the actual area of the change (`games`, `engine`,
`ui`, `pwa`, `theme`, `store`, `deps`, …) or be omitted entirely.
- Good: `feat(games): add Snake and Sokoban`, `fix(ui): center settings avatar`, `chore: convert add-game command into a skill`
- Bad: `chore(claude): …`, `feat(claude): …`

(The `Co-Authored-By: Claude …` trailer at the *end* of the commit body is fine and expected;
this rule is only about keeping "claude" out of the subject/scope.)

## Architecture

The whole app is client-side and offline. Three layers matter:

### 1. The Game contract (`src/engine/types.ts`)
Every game is a `GameModule` exposing **one** of two component shapes, keyed by its `contest`:
- **`Solo`** (`SoloGameProps`) — plays ONE seeded puzzle for ONE seat. Used by `race` and
  `score` games. The component must drive its own bot when `props.isBot` is true, report
  `onProgress`/`onScore`, and call `onDone(SoloResult)` when finished. It receives a `seed`
  so opponents in a race get an identical puzzle (see `src/engine/rng.ts` `makeRng`).
- **`Table`** (`TableGameProps`) — manages the entire multiplayer board itself (turns, bots).
  Used by `table` games (card games). Calls `onGameOver(winnerSeat)`.

### 2. The host (`src/engine/GameHost.tsx`)
Given a `GameDefinition`, the chosen `PlayMode` (`solo`/`duo`/`bot`), and difficulty, it:
- builds the seated players via `buildPlayers` (`src/engine/match.ts`),
- lazy-loads the game module,
- renders by `contest`:
  - `race` → `RaceHost`: mounts the `Solo` once per seat in a split screen (`useOrientation`
    decides stacked vs side-by-side), runs a countdown, tracks per-seat progress, settles the
    winner (first to `solved`, else highest score).
  - `score` → `ScoreHost`: mounts the `Solo` sequentially per seat on the same seed, with a
    "pass the device" interstitial between human seats, then compares scores.
  - `table` → `TableHost`: mounts the `Table` once.
- owns the result modal and **rematch = new random seed remount** (the `key={seed}` pattern).

So a new game never touches multiplayer/scoring/layout — that all lives in the host.

### 3. The registry (`src/games/registry.ts`)
The single source of truth for the catalog. Each entry has metadata + a lazy `load()`
(`import('./<id>').then(m => m.default)`). Home (`src/pages/Home.tsx`) and Library
(`src/pages/Library.tsx`) derive everything (featured rows, categories, search/filter) from
this array. Routes are just `/`, `/games`, `/game/:id` (`src/app/App.tsx`).

### Adding a game
1. Create `src/games/<id>/index.tsx` exporting a `GameModule` as default (a `Solo` for
   race/score, or a `Table` for table). Put pure rules in a sibling `logic.ts` (it's what the
   tests target) and bot logic in `bot.ts` when non-trivial.
2. Add tile art to `src/games/icons.tsx` (SVG; use camelCase attrs like `strokeWidth`).
3. Append one entry to `src/games/registry.ts`.
Nothing else is required — routing, the mode picker, the 2-player wrapper, scoring, results,
favorites, and recents all work automatically.

## Conventions

- **Determinism for races:** never call `Math.random` inside `race`/`score` game logic — seed
  a `makeRng(seed)` from props so both seats get the same puzzle. (`table` games may use a
  fresh random seed; they aren't mirrored.) Use a derived seed for the bot's own RNG so it
  doesn't mirror the human (e.g. `makeRng(seed ^ 0x9e3779b9)`).
- **Bots** are paced with `botTickMs[difficulty]` from `src/engine/rng.ts` and only act when
  `!paused && !done`.
- **Persistence** (favorites, high scores, recents, settings, player names) is the single
  zustand store in `src/store/store.ts` (persisted to `localStorage` under `no-wifi-games`).
- **Styling is a hybrid** (light dashboard + dark play screen, since the "Pulse" redesign):
  - **Dashboard/chrome** (shell, pages, GameTile, SettingsDrawer, GamePage config) use the
    **Pulse light theme** — Tailwind CSS v4 tokens at the top of `src/theme/global.css`
    (`app-bg`, `card`, `ink`/`ink-soft`/`ink-faint`, `line`/`line-soft`, `coral`/`coral-2`/
    `coral-soft`/`coral-ink`, `gold`) with helpers `.card`/`.btn-coral`/`.btn-soft`/`.chip`.
    Fonts: **Space Grotesk** (sans/display) + **Space Mono** (mode badges) + Material Symbols,
    loaded in `index.html`. Tailwind compiles via **`postcss.config.mjs`** (`@tailwindcss/postcss`).
  - **The play screen stays dark/immersive**: `GameHost`, `ui.tsx` (`TopBar`/`ResultModal`/
    `ProgressBar`), and the in-game boards keep the old **dark Neon Arcade** tokens
    (`dark-bg`, `glass-panel`, `btn-primary`, `neon-*` in `@theme`/`@layer`, plus the legacy
    `:root` block — `--surface`, `--text-dim`, `--accent-2`, `.btn`, … — at the bottom of
    `global.css` that `src/games/*` + `src/games/games.css` depend on). Do NOT delete those
    dark tokens or the boards break. `GamePage` shows a light config screen, then renders
    `GameHost` inside a `bg-dark-bg` wrapper when playing.
  - The framer-motion page wrapper `.route` must stay `display:flex; flex-direction:column`
    so full-screen `GameHost` panes (`.split{flex:1}` + container queries) fill height.
- **Reuse:** `water-sort/logic.ts` is the shared tube-sort engine — `nuts-and-bolts` imports
  it rather than duplicating. Prefer extending shared logic over copying.
- Tests live in `__tests__/` folders and target pure `logic.ts` / engine helpers (vitest
  globals are enabled, jsdom environment).
