import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { makeRng, randomSeed, botTickMs } from '../../engine/rng';
import {
  cardLabel,
  canPlay,
  chooseColor,
  deal,
  drawTurn,
  playableCards,
  playCard,
  top,
  type Card,
  type CardColor,
  type CCState
} from './logic';
import { botColor, botPlay } from './bot';
import '../games.css';

const colorClass = (c: CardColor) => `card-${c}`;

function ColorCardsTable({ players, onGameOver }: TableGameProps) {
  const rng = useRef(makeRng(randomSeed())).current;
  const humanCount = useMemo(() => players.filter((p) => p.kind === 'human').length, [players]);
  const [state, setState] = useState<CCState>(() => deal(rng, players.length));
  const [revealed, setRevealed] = useState(humanCount <= 1);

  const cur = players[state.current];
  const isHumanTurn = cur.kind === 'human';

  // Drive bots + win detection.
  useEffect(() => {
    if (state.winner !== null) {
      const t = setTimeout(() => onGameOver(players[state.winner!].seat), 600);
      return () => clearTimeout(t);
    }
    if (cur.kind !== 'bot') return;
    const t = setTimeout(() => {
      setState((s) => {
        if (s.winner !== null) return s;
        if (s.awaitingColor) return chooseColor(s, botColor(s), rng);
        const card = botPlay(s, cur.difficulty);
        if (card) return playCard(s, card.id, rng);
        return drawTurn(s, rng).state;
      });
    }, botTickMs[cur.difficulty]);
    return () => clearTimeout(t);
  }, [state, cur, players, onGameOver, rng]);

  // Hide hand when turn passes between two different humans.
  useEffect(() => {
    if (humanCount > 1 && isHumanTurn) setRevealed(false);
  }, [state.current, humanCount, isHumanTurn]);

  const seat = state.current;
  const playable = isHumanTurn ? playableCards(state, seat) : [];
  const mustDraw = isHumanTurn && playable.length === 0 && !state.awaitingColor;

  const onPlay = (c: Card) => {
    if (!canPlay(c, state)) return;
    setState((s) => playCard(s, c.id, rng));
  };
  const onDraw = () => setState((s) => drawTurn(s, rng).state);
  const onPickColor = (color: CardColor) => setState((s) => chooseColor(s, color, rng));

  const t = top(state);

  if (humanCount > 1 && isHumanTurn && !revealed && state.winner === null) {
    return (
      <div className="pass">
        <div style={{ fontSize: 50 }}>🃏</div>
        <div className="big">Pass to {cur.name}</div>
        <button className="btn btn-primary" onClick={() => setRevealed(true)}>
          I'm {cur.name} — Show my hand
        </button>
      </div>
    );
  }

  return (
    <div className="cc-table">
      <div className="cc-opponents">
        {players.map((p, i) =>
          p.seat === seat && p.kind === 'human' ? null : (
            <div
              key={p.seat}
              className={`cc-opp ${i === state.current ? 'turn' : ''}`}
              style={{ color: p.color }}
            >
              <span className="cc-avatar">{p.kind === 'bot' ? '🤖' : '🧑'}</span>
              <span style={{ color: 'var(--text)' }}>{p.name}</span>
              <span className="count">{state.hands[i].length}</span>
            </div>
          )
        )}
      </div>

      <div className="cc-center">
        <div className="cc-pile">
          <div className="cc-card cc-back">·</div>
          <div className="cc-pile-label">Draw</div>
        </div>
        <div className="cc-pile">
          <div
            key={t.id}
            className={`cc-card discard ${colorClass(t.color === 'wild' ? state.activeColor : t.color)}`}
          >
            {cardLabel(t)}
          </div>
          <div className="cc-pile-label" style={{ textTransform: 'capitalize' }}>
            {state.activeColor}
          </div>
        </div>
      </div>

      <div className="cc-msg">
        {state.awaitingColor && isHumanTurn
          ? 'Pick a color'
          : isHumanTurn
            ? mustDraw
              ? 'No playable card — draw one'
              : 'Your turn — play a card'
            : `${cur.name} is thinking…`}
      </div>

      {state.awaitingColor && isHumanTurn && (
        <div className="cc-colorpick">
          {(['red', 'yellow', 'green', 'blue'] as CardColor[]).map((c) => (
            <button
              key={c}
              className={`cc-swatch ${colorClass(c)}`}
              onClick={() => onPickColor(c)}
              aria-label={c}
            />
          ))}
        </div>
      )}

      {mustDraw && (
        <button className="btn btn-primary" style={{ alignSelf: 'center' }} onClick={onDraw}>
          Draw card
        </button>
      )}

      <div className="cc-hand">
        {(isHumanTurn ? state.hands[seat] : []).map((c) => {
          const ok = canPlay(c, state) && !state.awaitingColor;
          return (
            <div
              key={c.id}
              className={`cc-card ${colorClass(c.color)} ${ok ? 'playable' : 'dim'}`}
              onClick={() => ok && onPlay(c)}
            >
              {cardLabel(c)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: ColorCardsTable };
export default mod;
