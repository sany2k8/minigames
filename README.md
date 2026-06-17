# No WiFi Games 🎮✈️

A modern, installable, **fully offline** mini-games web app where **2 players** can play
together — pass-and-play with a friend or against a bot. Built to scale to **100+ games**:
adding a game is a drop-in folder plus one registry line.

## Features
- **Offline-first PWA** — installable, runs with no network (service worker precache).
- **Three contest types** handled by a shared engine:
  - `race` — both players solve the same seeded puzzle on a split screen; first done wins.
  - `score` — alternating rounds on the same seed (pass-the-device); highest score wins.
  - `table` — a single shared board the game manages (card games), you + bots or friends.
- **Play modes**: 1 Player, 2 Players (same device), vs Bot (easy / medium / hard).
- **6 starter games**: Color Cards (UNO-style), Water Sort, Color Blocks, Nuts and Bolts,
  Maze Paint, Word Finder.
- Favorites, recent/continue, and high scores persisted to `localStorage`.

## Stack
React 18 · TypeScript · Vite · `vite-plugin-pwa` · zustand · react-router · Vitest.

## Develop
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build + service worker
npm run preview    # serve the production build (test offline here)
npm run test       # unit tests (engine + game logic)
```

## Architecture
```
src/
  engine/      Game contract (types.ts), GameHost (race/score/table), match, rng
  games/       registry.ts (catalog) + one self-contained folder per game
  pages/       Home, Library (search/filter), GamePage (mode picker)
  components/   GameTile, TopBar, ResultModal, ProgressBar
  store/       persisted favorites / scores / settings (zustand)
```

### Adding a game (the path to 100+)
1. Create `src/games/<id>/index.tsx` exporting a `GameModule` as default:
   - a **Solo** component (`race`/`score`) — plays one seeded puzzle for one seat, and
     drives its own bot when `isBot` is true; or
   - a **Table** component (`table`) — manages the whole multiplayer board.
2. Add tile art to `src/games/icons.tsx`.
3. Append one entry to `src/games/registry.ts`.

It then appears on Home/Library and gets routing, the mode picker, the 2-player wrapper,
scoring, and results automatically.

## Offline verification
`npm run build && npm run preview`, load once, then set DevTools → Network → **Offline**
and reload — the shell and any loaded game keep working. The "Install app" prompt appears
in supported browsers.
# minigames
