import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { HowToPlay } from '../HowToPlay';
import { KlondikeIcon } from '../icons';
import {
  type Card,
  type KlondikeState,
  type Move,
  SUITS,
  applyMove,
  botMove,
  canApply,
  deal,
  foundationCount,
  isRed,
  isWon,
  rankLabel,
  scoreOf,
  selectableRun
} from './logic';
import '../games.css';

type Sel = { src: 'waste' } | { src: 'tab'; col: number; idx: number } | null;

const CardFace = ({ card }: { card: Card }) => (
  <div className={`kl-card ${isRed(card.s) ? 'red' : ''}`}>
    <span>{rankLabel(card.r)}</span>
    <span className="kl-suit">{SUITS[card.s]}</span>
  </div>
);

function KlondikeSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [st, setSt] = useState<KlondikeState>(() => deal(rng));
  const [sel, setSel] = useState<Sel>(null);
  const [ready, setReady] = useState(isBot);
  const start = useRef(Date.now());
  const done = useRef(false);
  const noProg = useRef(0);

  const finish = (s: KlondikeState) => {
    if (done.current) return;
    done.current = true;
    onDone({ solved: isWon(s), score: scoreOf(s), timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onScore?.(scoreOf(st));
    if (!done.current && isWon(st)) setTimeout(() => finish(st), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  // greedy bot
  useEffect(() => {
    if (!ready || !isBot || paused || done.current) return;
    const t = setTimeout(() => {
      setSt((s) => {
        const canCycle = noProg.current < s.stock.length + s.waste.length + 8;
        const m = botMove(s, canCycle);
        if (!m) {
          finish(s);
          return s;
        }
        if (m.t === 'wf' || m.t === 'tf') noProg.current = 0;
        else noProg.current++;
        return applyMove(s, m);
      });
    }, botTickMs[difficulty] / 2 + 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, isBot, paused, difficulty, ready]);

  const human = ready && !isBot && !paused && !done.current;
  const apply = (m: Move) => {
    if (!canApply(st, m)) return false;
    setSt((s) => applyMove(s, m));
    return true;
  };

  const tapStock = () => {
    if (!human) return;
    setSel(null);
    apply({ t: 'draw' });
  };

  const tapWaste = () => {
    if (!human || st.waste.length === 0) return;
    setSel(sel?.src === 'waste' ? null : { src: 'waste' });
  };

  const tapFoundation = (s: number) => {
    if (!human || !sel) return;
    if (sel.src === 'waste') {
      const c = st.waste[st.waste.length - 1];
      if (c && c.s === s && apply({ t: 'wf' })) setSel(null);
    } else if (sel.src === 'tab' && sel.idx === st.tableau[sel.col].length - 1) {
      const c = st.tableau[sel.col][sel.idx];
      if (c && c.s === s && apply({ t: 'tf', from: sel.col })) setSel(null);
    }
  };

  // tap a tableau column: either drop the selection there, or select a run
  const tapColumn = (col: number, cardIdx?: number) => {
    if (!human) return;
    if (sel) {
      const m: Move = sel.src === 'waste' ? { t: 'wt', to: col } : { t: 'tt', from: sel.col, idx: sel.idx, to: col };
      if ((sel.src === 'tab' && sel.col === col) || !apply(m)) {
        // not a legal drop — try selecting the tapped card instead
        if (cardIdx != null && selectableRun(st, col, cardIdx)) setSel({ src: 'tab', col, idx: cardIdx });
        else setSel(null);
      } else setSel(null);
      return;
    }
    if (cardIdx != null && selectableRun(st, col, cardIdx)) setSel({ src: 'tab', col, idx: cardIdx });
  };

  const waste = st.waste[st.waste.length - 1];
  const isSel = (col: number, idx: number) => sel?.src === 'tab' && sel.col === col && idx >= sel.idx;

  return (
    <div className="board kl">
      <div className="board-info">
        <span>Foundations {foundationCount(st)}/52</span>
        <span>Score {scoreOf(st)}</span>
        <span>Stock {st.stock.length}</span>
      </div>

      <div className="kl-top">
        <div className="kl-pile">
          <button className="kl-slot kl-stock" onClick={tapStock} disabled={!human}>
            {st.stock.length > 0 ? <div className="kl-card back">{st.stock.length}</div> : <span className="kl-recycle">↻</span>}
          </button>
          <div className={`kl-slot kl-waste ${sel?.src === 'waste' ? 'sel' : ''}`} onClick={tapWaste}>
            {waste ? <CardFace card={waste} /> : <div className="kl-card empty" />}
          </div>
        </div>
        <div className="kl-pile">
          {st.foundations.map((pile, s) => {
            const tc = pile[pile.length - 1];
            return (
              <div key={s} className="kl-slot kl-found" onClick={() => tapFoundation(s)}>
                {tc ? <CardFace card={tc} /> : <div className={`kl-card empty ${isRed(s) ? 'red' : ''}`}>{SUITS[s]}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="kl-cols">
        {st.tableau.map((col, c) => (
          <div key={c} className="kl-col" onClick={() => col.length === 0 && tapColumn(c)}>
            {col.length === 0 && <div className="kl-card empty slot" />}
            {col.map((card, j) => {
              const faceDown = j < st.down[c];
              return (
                <div
                  key={j}
                  className={`kl-stacked ${isSel(c, j) ? 'lift' : ''}`}
                  style={{ marginTop: j === 0 ? 0 : faceDown ? -34 : -26 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    tapColumn(c, faceDown ? undefined : j);
                  }}
                >
                  {faceDown ? <div className="kl-card back sm" /> : <CardFace card={card} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {!isBot ? (
        <div className="hint">
          {isWon(st)
            ? 'Solved! 🎉'
            : 'Tap a card to pick it up, then tap where to drop it. Tap the stock to draw.'}
        </div>
      ) : (
        <div className="hint">🤖 playing… {foundationCount(st)}/52 home</div>
      )}
      {!ready && (
        <HowToPlay
          title="Klondike Solitaire"
          tagline="The classic game of patience."
          icon={<KlondikeIcon />}
          accent="#51e08a"
          accent2="#1d3a2c"
          onStart={() => {
            start.current = Date.now();
            setReady(true);
          }}
          steps={[
            { icon: '🃏', text: 'Tap a face-up card to pick it up, then tap a column or pile to drop it.' },
            { icon: '🔁', text: 'Build the columns down in alternating colours (red on black). Tap the deck to draw new cards.' },
            { icon: '🏠', text: 'Move cards to the four foundations, Ace up to King by suit, to clear the table.' }
          ]}
        />
      )}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: KlondikeSolo };
export default mod;
