import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import {
  BOXES,
  DOTS,
  type DBState,
  type Edge,
  applyEdge,
  boxIdx,
  botMove,
  emptyState,
  hasEdge,
  isOver,
  scoreOf
} from './logic';
import '../games.css';

function DotsBoxesTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const [state, setState] = useState<DBState>(emptyState);
  const [turn, setTurn] = useState(0);
  const over = useRef(false);

  const cur = seats[turn];

  const draw = (e: Edge) => {
    if (over.current || hasEdge(state, e)) return;
    const res = applyEdge(state, e, turn);
    setState(res.state);
    if (res.completed === 0) setTurn((t) => (t + 1) % 2);
    if (isOver(res.state)) {
      over.current = true;
      const a = scoreOf(res.state, 0);
      const b = scoreOf(res.state, 1);
      setTimeout(() => onGameOver(a === b ? -1 : seats[a > b ? 0 : 1].seat), 500);
    }
  };
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    if (over.current || cur.kind !== 'bot') return;
    const t = setTimeout(() => drawRef.current(botMove(state, turn, cur.difficulty)), botTickMs[cur.difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, turn]);

  const size = 'min(80cqmin, 82cqh, 420px)';
  const track = `repeat(${DOTS - 1}, auto 1fr) auto`;
  const cells: React.ReactNode[] = [];
  for (let gr = 0; gr < DOTS * 2 - 1; gr++) {
    for (let gc = 0; gc < DOTS * 2 - 1; gc++) {
      const dotR = gr % 2 === 0;
      const dotC = gc % 2 === 0;
      if (dotR && dotC) {
        cells.push(<span key={`${gr}-${gc}`} className="db-dot" />);
      } else if (dotR && !dotC) {
        const e: Edge = { type: 'h', r: gr / 2, c: (gc - 1) / 2 };
        const on = hasEdge(state, e);
        cells.push(
          <span
            key={`${gr}-${gc}`}
            className={`db-edge db-h ${on ? 'on' : ''}`}
            onClick={() => cur.kind === 'human' && draw(e)}
          />
        );
      } else if (!dotR && dotC) {
        const e: Edge = { type: 'v', r: (gr - 1) / 2, c: gc / 2 };
        const on = hasEdge(state, e);
        cells.push(
          <span
            key={`${gr}-${gc}`}
            className={`db-edge db-v ${on ? 'on' : ''}`}
            onClick={() => cur.kind === 'human' && draw(e)}
          />
        );
      } else {
        const r = (gr - 1) / 2;
        const c = (gc - 1) / 2;
        const owner = state.owner[boxIdx(r, c)];
        cells.push(
          <span
            key={`${gr}-${gc}`}
            className="db-box"
            style={owner >= 0 ? { background: seats[owner].color, opacity: 0.85 } : undefined}
          >
            {owner >= 0 ? (owner === 0 ? '✕' : '◯') : ''}
          </span>
        );
      }
    }
  }

  return (
    <div className="board">
      <div className="mm-scores">
        {seats.map((p, i) => (
          <div key={p.seat} className={`mm-score ${i === turn ? 'on' : ''}`} style={{ color: p.color }}>
            <span className="mm-name">{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
            <span className="mm-pts">{scoreOf(state, i)}</span>
          </div>
        ))}
      </div>
      <div
        className="db-board"
        style={{ width: size, height: size, gridTemplateColumns: track, gridTemplateRows: track }}
      >
        {cells}
      </div>
      <div className="hint">
        Boxes left: {BOXES * BOXES - (scoreOf(state, 0) + scoreOf(state, 1))} · {cur.name}'s turn
      </div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: DotsBoxesTable };
export default mod;
