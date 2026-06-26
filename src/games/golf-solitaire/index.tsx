import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  type Card,
  type GolfState,
  SUITS,
  cardsLeft,
  deal,
  draw,
  isRed,
  isStuck,
  isWon,
  playColumn,
  playableColumns,
  rankLabel,
  scoreOf
} from './logic';
import '../games.css';

const CardView = ({ card, ghost }: { card?: Card; ghost?: boolean }) =>
  card ? (
    <div className={`gs-card ${isRed(card.s) ? 'red' : ''}`}>
      <span>{rankLabel(card.r)}</span>
      <span className="gs-suit">{SUITS[card.s]}</span>
    </div>
  ) : (
    <div className={`gs-card ${ghost ? 'ghost' : 'empty'}`} />
  );

function GolfSolitaireSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [st, setSt] = useState<GolfState>(() => deal(rng));
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (s: GolfState) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: isWon(s), score: scoreOf(s), timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onScore?.(scoreOf(st));
    if (!done.current && (isWon(st) || isStuck(st))) setTimeout(() => finish(st), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  const tapCol = (i: number) => {
    if (isBot || paused || done.current) return;
    setSt((s) => playColumn(s, i));
  };
  const tapStock = () => {
    if (isBot || paused || done.current) return;
    setSt((s) => draw(s));
  };

  // greedy bot
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setSt((s) => {
        const cols = playableColumns(s);
        if (cols.length) {
          // prefer the column with the most cards (clears deeper stacks)
          cols.sort((a, b) => s.columns[b].length - s.columns[a].length);
          return playColumn(s, cols[0]);
        }
        return draw(s);
      });
    }, botTickMs[difficulty]);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, isBot, paused, difficulty]);

  const playable = new Set(isBot ? [] : playableColumns(st));
  const waste = st.waste[st.waste.length - 1];

  return (
    <div className="board gs">
      <div className="board-info">
        <span>Left {cardsLeft(st)}</span>
        <span>Score {scoreOf(st)}</span>
        <span>Stock {st.stock.length}</span>
      </div>
      <div className="gs-cols">
        {st.columns.map((col, i) => (
          <div key={i} className={`gs-col ${playable.has(i) ? 'hot' : ''}`} onClick={() => tapCol(i)}>
            {col.length === 0 ? (
              <CardView />
            ) : (
              col.map((card, j) => (
                <div key={j} className="gs-stacked" style={{ marginTop: j === 0 ? 0 : -42 }}>
                  <CardView card={card} />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      <div className="gs-foot">
        <button className="gs-stock" onClick={tapStock} disabled={isBot || st.stock.length === 0}>
          <div className="gs-card back">{st.stock.length}</div>
          <span className="gs-cap">Draw</span>
        </button>
        <div className="gs-waste">
          <CardView card={waste} />
          <span className="gs-cap">Waste</span>
        </div>
      </div>
      {!isBot && (
        <div className="hint">
          Move a card 1 higher/lower than the waste card. Tap Draw when stuck.
        </div>
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: GolfSolitaireSolo };
export default mod;
