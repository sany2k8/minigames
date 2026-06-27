import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { useUndo } from '../../engine/useUndo';
import { UndoButton } from '../UndoButton';
import {
  BOX_CAP,
  type Box,
  SCREW_COLORS,
  anyLegal,
  canPlace,
  difficultyDistinct,
  emptyBoxes,
  generate,
  placeScrew
} from './logic';
import '../games.css';

function ScrewJamSolo({ seed, isBot, difficulty, paused, onProgress, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const screws = useRef<number[]>(generate(rng, difficultyDistinct(difficulty))).current;
  const [taken, setTaken] = useState<Set<number>>(new Set());
  const [boxes, setBoxes] = useState<Box[]>(emptyBoxes);
  const [score, setScore] = useState(0);
  const undoer = useUndo<{ taken: Set<number>; boxes: Box[]; score: number }>();
  const start = useRef(Date.now());
  const done = useRef(false);

  const remaining = () => screws.map((c, i) => ({ c, i })).filter(({ i }) => !taken.has(i));

  const finish = (won: boolean, sc: number) => {
    if (done.current) return;
    done.current = true;
    onScore?.(sc);
    onDone({ solved: won, score: sc, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onProgress?.(Math.round((taken.size / screws.length) * 100));
    if (done.current) return;
    const rem = remaining();
    if (rem.length === 0) finish(true, score + 1000);
    else if (!anyLegal(boxes, rem.map((r) => r.c))) setTimeout(() => finish(false, score), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taken, boxes]);

  const pick = (i: number) => {
    if (paused || done.current || taken.has(i) || !canPlace(boxes, screws[i])) return;
    if (!isBot) undoer.record({ taken: new Set(taken), boxes, score });
    const res = placeScrew(boxes, screws[i]);
    setBoxes(res.boxes);
    setTaken((s) => new Set(s).add(i));
    if (res.cleared)
      setScore((s) => {
        const ns = s + 30;
        onScore?.(ns);
        return ns;
      });
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  const undo = () => {
    if (isBot || paused || done.current) return;
    const prev = undoer.undo();
    if (prev) {
      setTaken(prev.taken);
      setBoxes(prev.boxes);
      setScore(prev.score);
    }
  };

  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const rem = remaining();
      // prefer a color a box is already collecting
      const open = boxes.filter((b) => b.color !== null).map((b) => b.color);
      const wanted = rem.find(({ c }) => open.includes(c) && canPlace(boxes, c));
      const any = rem.find(({ c }) => canPlace(boxes, c));
      const choice = wanted ?? any;
      if (choice) pickRef.current(choice.i);
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taken, boxes, isBot, paused, difficulty]);

  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
        <span>Left {screws.length - taken.size}</span>
      </div>
      <div className="sj-plate">
        {screws.map((c, i) =>
          taken.has(i) ? null : (
            <button
              key={i}
              className={`sj-screw ${canPlace(boxes, c) ? '' : 'locked'}`}
              style={{ background: SCREW_COLORS[c] }}
              onClick={() => pick(i)}
              disabled={isBot}
            >
              ✛
            </button>
          )
        )}
      </div>
      <div className="sj-boxes">
        {boxes.map((b, i) => (
          <div key={i} className="sj-box" style={{ borderColor: b.color !== null ? SCREW_COLORS[b.color] : undefined }}>
            {Array.from({ length: BOX_CAP }).map((_, k) => (
              <span
                key={k}
                className="sj-pip"
                style={{ background: b.color !== null && k < b.count ? SCREW_COLORS[b.color] : undefined }}
              />
            ))}
          </div>
        ))}
      </div>
      {!isBot && (
        <div className="board-actions">
          <UndoButton onUndo={undo} canUndo={undoer.canUndo} />
        </div>
      )}
      {!isBot && <div className="hint">Unscrew pins into the boxes — fill a box of {BOX_CAP} to clear it</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: ScrewJamSolo };
export default mod;
