import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import { type Dir, type Level, type State, isSolved, levelFor, onTarget, step } from './logic';
import '../games.css';

function SokobanSolo({ seed, isBot, difficulty, paused, onProgress, onDone }: SoloGameProps) {
  const level = useRef<Level>(levelFor(makeRng(seed), difficulty)).current;
  const [state, setState] = useState<State>({ player: level.player, boxes: level.boxes.slice() });
  const [moves, setMoves] = useState(0);
  const undoer = useUndo<{ state: State; moves: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);
  const botStep = useRef(0);

  useEffect(() => {
    onProgress?.(Math.round((onTarget(state.boxes, level.targets) / level.targets.size) * 100));
    if (!done.current && isSolved(state.boxes, level.targets)) {
      done.current = true;
      const elapsed = Date.now() - start.current;
      onDone({ solved: true, score: Math.max(100, 200000 - elapsed - moves * 200), timeMs: elapsed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const go = (dir: Dir) => {
    if (isBot || paused || done.current) return;
    const next = step(level, state, dir);
    if (!next) return;
    undoer.record({ state, moves });
    setState(next);
    setMoves((m) => m + 1);
  };

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setState(prev.state);
      setMoves(prev.moves);
    }
  };

  useEffect(() => {
    if (isBot) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R',
        w: 'U', s: 'D', a: 'L', d: 'R'
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        go(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Bot replays the verified solution.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    if (botStep.current >= level.solution.length) return;
    const t = setTimeout(() => {
      const dir = level.solution[botStep.current];
      botStep.current += 1;
      setState((s) => step(level, s, dir) ?? s);
    }, botTickMs[difficulty] + 200);
    return () => clearTimeout(t);
  }, [state, isBot, paused, difficulty, level]);

  const boxes = new Set(state.boxes);
  const size = `min(${level.w * 13}cqmin, 78cqh, ${level.w * 64}px)`;
  return (
    <div className="board">
      <div className="board-info">
        <span>On target {onTarget(state.boxes, level.targets)}/{level.targets.size}</span>
        <span>Moves {moves}</span>
      </div>
      <div className="sk-grid" style={{ width: size, gridTemplateColumns: `repeat(${level.w}, 1fr)` }}>
        {Array.from({ length: level.w * level.h }).map((_, i) => {
          const wall = level.walls.has(i);
          const target = level.targets.has(i);
          const box = boxes.has(i);
          const player = state.player === i;
          return (
            <div key={i} className={`sk-cell ${wall ? 'wall' : 'floor'} ${target ? 'target' : ''}`}>
              {box && <span className={`sk-box ${target ? 'home' : ''}`} />}
              {player && <span className="sk-player" />}
            </div>
          );
        })}
      </div>

      {!isBot && (
        <div className="sk-pad">
          <button className="sk-key up" onClick={() => go('U')} aria-label="up">▲</button>
          <button className="sk-key left" onClick={() => go('L')} aria-label="left">◀</button>
          <button className="sk-key right" onClick={() => go('R')} aria-label="right">▶</button>
          <button className="sk-key down" onClick={() => go('D')} aria-label="down">▼</button>
        </div>
      )}
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Push every box onto a target. Use arrow keys or the pad.</div>}
      {isBot && <div className="hint">🤖 pushing boxes home…</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'race', Solo: SokobanSolo };
export default mod;
