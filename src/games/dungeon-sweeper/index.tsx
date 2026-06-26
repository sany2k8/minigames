import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  type Config,
  type Dungeon,
  type Tile,
  botNextReveal,
  config,
  generate,
  revealFlood,
  revealedFloors
} from './logic';
import '../games.css';

const NUM_COLORS = ['', '#7fc7ff', '#51e08a', '#ffd166', '#ff9f43', '#ff5d73', '#ff5d73', '#ff5d73', '#ff5d73'];

interface State {
  revealed: boolean[];
  hp: number;
  gold: number;
  over: 'none' | 'win' | 'lose';
}

function scoreOf(d: Dungeon, s: State): number {
  return (
    s.gold * 150 +
    Math.max(0, s.hp) * 80 +
    revealedFloors(d, s.revealed) * 3 +
    (s.over === 'win' ? 2500 : 0)
  );
}

function reveal(d: Dungeon, s: State, idx: number): State {
  if (s.over !== 'none' || s.revealed[idx]) return s;
  const newly = revealFlood(d, s.revealed, idx);
  if (newly.length === 0) return s;
  const revealed = s.revealed.slice();
  let hp = s.hp;
  let gold = s.gold;
  let won = false;
  for (const j of newly) {
    revealed[j] = true;
    const t = d.tiles[j];
    if (t === 'monster') hp -= 1;
    else if (t === 'gold') gold += 1;
    else if (t === 'potion') hp += 1;
    else if (t === 'exit') won = true;
  }
  const over: State['over'] = won ? 'win' : hp <= 0 ? 'lose' : 'none';
  return { revealed, hp, gold, over };
}

function DungeonSweeperSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const cfg = useRef<Config>(config(difficulty)).current;
  const rng = useRef(makeRng(seed)).current;
  const dungeon = useRef<Dungeon>(generate(rng, cfg)).current;
  const botRng = useRef(makeRng(seed ^ 0x9e3779b9)).current;

  const [state, setState] = useState<State>(() =>
    reveal(dungeon, { revealed: new Array(dungeon.w * dungeon.h).fill(false), hp: cfg.hp, gold: 0, over: 'none' }, dungeon.start)
  );
  const [flagMode, setFlagMode] = useState(false);
  const [flags, setFlags] = useState<boolean[]>(() => new Array(dungeon.w * dungeon.h).fill(false));
  const startedAt = useRef(Date.now());
  const done = useRef(false);

  const finish = (s: State) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: s.over === 'win', score: scoreOf(dungeon, s), timeMs: Date.now() - startedAt.current });
  };

  useEffect(() => {
    onScore?.(scoreOf(dungeon, state));
    if (!done.current && state.over !== 'none') finish(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Bot deduces and reveals one cell per tick.
  useEffect(() => {
    if (!isBot || paused || done.current || state.over !== 'none') return;
    const t = setTimeout(() => {
      const idx = botNextReveal(dungeon, state.revealed, botRng);
      if (idx < 0) {
        finish(state);
        return;
      }
      setState((s) => reveal(dungeon, s, idx));
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isBot, paused, difficulty]);

  const tap = (idx: number) => {
    if (isBot || paused || done.current || state.over !== 'none') return;
    if (flagMode && !state.revealed[idx]) {
      setFlags((f) => {
        const nf = f.slice();
        nf[idx] = !nf[idx];
        return nf;
      });
      return;
    }
    if (flags[idx]) return;
    setState((s) => reveal(dungeon, s, idx));
  };

  const glyph = (t: Tile, adj: number) => {
    if (t === 'monster') return '💀';
    if (t === 'gold') return '💰';
    if (t === 'potion') return '🧪';
    if (t === 'exit') return '🚪';
    return adj > 0 ? String(adj) : '';
  };

  const left = dungeon.tiles.filter((t) => t === 'monster').length;
  const flagged = flags.filter(Boolean).length;
  const size = `min(88cqmin, 78cqh, 560px)`;

  return (
    <div className="board ds">
      <div className="board-info">
        <span className="ds-hp">{'❤'.repeat(Math.max(0, state.hp)) || '☠'}</span>
        <span>💰 {state.gold}</span>
        <span>💀 {left - flagged > 0 ? left - flagged : 0}</span>
      </div>

      <div
        className="ds-grid"
        style={{ gridTemplateColumns: `repeat(${dungeon.w}, 1fr)`, width: size }}
      >
        {dungeon.tiles.map((t, i) => {
          const rv = state.revealed[i];
          const cls = rv
            ? `open ${t}`
            : `covered ${flags[i] ? 'flag' : ''}`;
          return (
            <button
              key={i}
              className={`ds-cell ${cls}`}
              onPointerDown={() => tap(i)}
              disabled={isBot}
              style={rv && t === 'floor' ? { color: NUM_COLORS[dungeon.adj[i]] } : undefined}
            >
              <span>{rv ? glyph(t, dungeon.adj[i]) : flags[i] ? '⚑' : ''}</span>
            </button>
          );
        })}
      </div>

      {!isBot && (
        <div className="ds-controls">
          <button
            className={`btn ${flagMode ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFlagMode((v) => !v)}
          >
            ⚑ Flag {flagMode ? 'ON' : 'OFF'}
          </button>
          <button className="btn btn-ghost" onClick={() => finish(state)}>
            Give Up
          </button>
        </div>
      )}
      {!isBot && <div className="hint">Numbers = nearby monsters. Find 💰, drink 🧪, reach the 🚪 exit before your ❤ run out.</div>}
      {isBot && <div className="hint">🤖 deducing a safe path… 💰 {state.gold}</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: DungeonSweeperSolo };
export default mod;
