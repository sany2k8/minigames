import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import {
  PYRAMID_SIZE,
  ROWS,
  SUITS,
  type Card,
  type PyramidState,
  botAction,
  deal,
  draw,
  isCleared,
  isExposed,
  isRed,
  removeKing,
  removePair,
  removedCount,
  wasteTop
} from './logic';
import '../games.css';

type Pick = { where: 'pyr'; idx: number } | { where: 'waste' };
const tri = (n: number) => (n * (n + 1)) / 2;
const rankLabel = (r: number) => (r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r));

function PyramidSolitaireSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [st, setSt] = useState<PyramidState>(() => deal(rng));
  const [sel, setSel] = useState<Pick | null>(null);
  const start = useRef(Date.now());
  const done = useRef(false);

  const finish = (solved: boolean) => {
    if (done.current) return;
    done.current = true;
    const cleared = isCleared(st);
    const score = removedCount(st) * 100 + (cleared ? 2000 : 0);
    onScore?.(score);
    onDone({ solved: solved && cleared, score, timeMs: Date.now() - start.current });
  };

  useEffect(() => {
    onScore?.(removedCount(st) * 100);
    if (done.current) return;
    if (isCleared(st)) {
      finish(true);
    } else if (!isBot && botAction(st).t === 'stuck') {
      setTimeout(() => finish(false), 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  const same = (a: Pick, b: Pick) => a.where === b.where && (a.where !== 'pyr' || a.idx === (b as { idx: number }).idx);

  const pick = (p: Pick) => {
    if (isBot || paused || done.current) return;
    const card = p.where === 'pyr' ? st.pyramid[p.idx] : wasteTop(st);
    if (!card) return;
    if (p.where === 'pyr' && !isExposed(st, p.idx)) return;
    if (card.rank === 13) {
      const next = removeKing(st, p);
      if (next) setSt(next);
      setSel(null);
      return;
    }
    if (!sel) {
      setSel(p);
      return;
    }
    if (same(sel, p)) {
      setSel(null);
      return;
    }
    const next = removePair(st, sel, p);
    if (next) setSt(next);
    setSel(null);
  };

  const onDraw = () => {
    if (isBot || paused || done.current) return;
    setSt((s) => draw(s));
    setSel(null);
  };

  // Bot loop.
  useEffect(() => {
    if (!isBot || paused || done.current) return;
    const t = setTimeout(() => {
      const a = botAction(st);
      if (a.t === 'king') setSt((s) => removeKing(s, a.src) ?? s);
      else if (a.t === 'pair') setSt((s) => removePair(s, a.a, a.b) ?? s);
      else if (a.t === 'draw') setSt((s) => draw(s));
      else finish(false);
    }, botTickMs[difficulty] + 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, isBot, paused, difficulty]);

  const isSelected = (p: Pick) =>
    sel != null && sel.where === p.where && (p.where !== 'pyr' || sel.where === 'pyr');

  const renderCard = (card: Card, opts: { exposed: boolean; selected: boolean; onClick?: () => void }) => (
    <button
      className={`py-card ${isRed(card.suit) ? 'red' : ''} ${opts.exposed ? 'live' : 'dim'} ${opts.selected ? 'sel' : ''}`}
      onClick={opts.onClick}
      disabled={isBot || !opts.exposed}
    >
      <span>{rankLabel(card.rank)}</span>
      <span className="py-suit">{SUITS[card.suit]}</span>
    </button>
  );

  const top = wasteTop(st);
  return (
    <div className="board py">
      <div className="board-info">
        <span>Cleared {removedCount(st)}/{PYRAMID_SIZE}</span>
        <span>Stock {st.stock.length}</span>
      </div>

      <div className="py-pyramid">
        {Array.from({ length: ROWS }).map((_, r) => (
          <div key={r} className="py-row">
            {Array.from({ length: r + 1 }).map((_, c) => {
              const idx = tri(r) + c;
              if (st.removed.has(idx)) return <div key={idx} className="py-slot" />;
              const exposed = isExposed(st, idx);
              return (
                <div key={idx} className="py-pos">
                  {renderCard(st.pyramid[idx], {
                    exposed,
                    selected: sel?.where === 'pyr' && sel.idx === idx,
                    onClick: () => pick({ where: 'pyr', idx })
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="py-foot">
        <button className="py-stock" onClick={onDraw} disabled={isBot}>
          <span className="py-card back">{st.stock.length}</span>
          <span className="py-cap">Draw</span>
        </button>
        <div className="py-waste">
          {top ? renderCard(top, { exposed: true, selected: isSelected({ where: 'waste' }) && sel?.where === 'waste', onClick: () => pick({ where: 'waste' }) }) : <div className="py-card empty" />}
          <span className="py-cap">Waste</span>
        </div>
      </div>

      {!isBot && <div className="hint">Pair exposed cards that add to 13 (K removes alone). Draw when stuck.</div>}
      {isBot && <div className="hint">🤖 clearing the pyramid…</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: PyramidSolitaireSolo };
export default mod;
