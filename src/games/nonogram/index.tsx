import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import { N, type Sol, colClue, isSolved, progress, rowClue, solutionFor } from './logic';
import '../games.css';

function NonogramSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const sol = useRef<Sol>(solutionFor(seed)).current;
  const [state, setState] = useState<number[]>(() => Array(N * N).fill(0));
  const [mark, setMark] = useState(false);
  const undoer = useUndo<number[]>();
  const start = useRef(Date.now());
  const done = useRef(false);

  useEffect(() => {
    onProgress?.(progress(state, sol));
    if (!done.current && isSolved(state, sol)) {
      done.current = true;
      onDone({ solved: true, score: Math.max(100, 200000 - (Date.now() - start.current)), timeMs: Date.now() - start.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const tap = (i: number) => {
    if (isBot || paused || done.current) return;
    undoer.record(state.slice());
    setState((s) => {
      const ns = s.slice();
      if (mark) ns[i] = ns[i] === 2 ? 0 : 2;
      else ns[i] = ns[i] === 1 ? 0 : 1;
      return ns;
    });
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) setState(prev);
  };

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setState((s) => {
        const i = s.findIndex((v, idx) => sol[idx] && v !== 1);
        if (i < 0) return s;
        const ns = s.slice();
        ns[i] = 1;
        return ns;
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, isBot, paused, difficulty]);

  const rowClues = Array.from({ length: N }, (_, r) => rowClue(sol, r));
  const colClues = Array.from({ length: N }, (_, c) => colClue(sol, c));
  const size = 'min(70cqmin, 74cqh, 360px)';

  return (
    <div className="board">
      <div className="board-info">
        <span>{progress(state, sol)}% revealed</span>
      </div>
      <div className="ng-wrap" style={{ width: size }}>
        <div className="ng-corner" />
        <div className="ng-cols">
          {colClues.map((clue, c) => (
            <div key={c} className="ng-cclue">
              {clue.map((n, j) => (
                <span key={j}>{n}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="ng-rows">
          {rowClues.map((clue, r) => (
            <div key={r} className="ng-rclue">
              {clue.map((n, j) => (
                <span key={j}>{n}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="ng-grid" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
          {state.map((v, i) => (
            <div
              key={i}
              className={`ng-cell ${v === 1 ? 'fill' : ''} ${v === 2 ? 'mark' : ''}`}
              onClick={() => tap(i)}
            >
              {v === 2 ? '✕' : ''}
            </div>
          ))}
        </div>
      </div>
      {!isBot && (
        <div className="board-actions">
          <button className={`btn ${mark ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMark((m) => !m)}>
            {mark ? '✕ Mark mode' : '⬛ Fill mode'}
          </button>
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: NonogramSolo };
export default mod;
