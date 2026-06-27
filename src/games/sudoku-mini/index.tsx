import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import { type Grid, N, conflicts, difficultyGivens, generate, isComplete } from './logic';
import '../games.css';

function SudokuMiniSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const puz = useRef(generate(rng, difficultyGivens(difficulty))).current;
  const [grid, setGrid] = useState<Grid>(() => puz.puzzle.slice());
  const [sel, setSel] = useState<number | null>(null);
  const undoer = useUndo<Grid>();
  const start = useRef(Date.now());
  const done = useRef(false);

  const solvedCount = grid.filter((v, i) => !puz.given[i] && v !== 0).length;
  const total = grid.filter((_, i) => !puz.given[i]).length;
  const bad = conflicts(grid.slice());

  const finish = (won: boolean) => {
    if (done.current) return;
    done.current = true;
    const elapsed = Date.now() - start.current;
    const score = won ? Math.max(200, 100000 - elapsed) : solvedCount * 100;
    onScore?.(score);
    onDone({ solved: won, score, timeMs: elapsed });
  };

  useEffect(() => {
    onScore?.(solvedCount * 100);
    if (!done.current && isComplete(grid)) {
      const correct = grid.every((v, i) => v === puz.solution[i]);
      if (correct) finish(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  const setCell = (v: number) => {
    if (isBot || paused || done.current || sel === null || puz.given[sel]) return;
    undoer.record(grid.slice());
    setGrid((g) => {
      const ng = g.slice();
      ng[sel] = ng[sel] === v ? 0 : v;
      return ng;
    });
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) setGrid(prev);
  };

  // bot fills correct cells over time
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setGrid((g) => {
        const blanks = g.map((v, i) => (v !== puz.solution[i] ? i : -1)).filter((i) => i >= 0);
        if (blanks.length === 0) return g;
        const cell = blanks[0];
        const ng = g.slice();
        ng[cell] = puz.solution[cell];
        return ng;
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, isBot, paused, difficulty]);

  const size = 'min(78cqmin, 80cqh, 420px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Filled {solvedCount}/{total}</span>
        {bad.size > 0 && <span style={{ color: 'var(--danger)' }}>{bad.size} conflicts</span>}
      </div>
      <div className="sd-grid" style={{ width: size, height: size }}>
        {grid.map((v, i) => {
          const r = Math.floor(i / N);
          const c = i % N;
          const thickR = r % 2 === 0;
          const thickC = c % 3 === 0;
          return (
            <div
              key={i}
              className={`sd-cell ${puz.given[i] ? 'given' : ''} ${sel === i ? 'sel' : ''} ${bad.has(i) ? 'bad' : ''}`}
              style={{
                borderTopWidth: thickR ? 2 : 1,
                borderLeftWidth: thickC ? 2 : 1,
                borderRightWidth: c === N - 1 ? 2 : 1,
                borderBottomWidth: r === N - 1 ? 2 : 1
              }}
              onClick={() => !isBot && !puz.given[i] && setSel(i)}
            >
              {v || ''}
            </div>
          );
        })}
      </div>
      {!isBot ? (
        <>
          <div className="sd-pad">
            {[1, 2, 3, 4, 5, 6].map((v) => (
              <button key={v} className="sd-key" onClick={() => setCell(v)}>
                {v}
              </button>
            ))}
          </div>
          <div className="board-actions">
            <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
          </div>
        </>
      ) : (
        <div className="hint">🤖 solving the grid…</div>
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: SudokuMiniSolo };
export default mod;
