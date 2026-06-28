import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { makeRng, botTickMs, randomSeed } from '../../engine/rng';
import {
  type Tile,
  botMove,
  canPlay,
  deal,
  handCanPlay,
  handPips,
  place,
  playableSides,
  tileKey
} from './logic';
import '../games.css';

interface GS {
  hands: Tile[][];
  line: Tile[];
  boneyard: Tile[];
  turn: number;
  passes: number;
  over: boolean;
  result?: number; // seat index or -1 draw
}

function DominoesTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const rng = useRef(makeRng(randomSeed())).current;
  const [gs, setGs] = useState<GS>(() => {
    const { hands, boneyard } = deal(rng);
    return { hands, line: [], boneyard, turn: 0, passes: 0, over: false };
  });
  const reported = useRef(false);

  const afterPlace = (cur: GS, seat: number, idx: number, side: 'L' | 'R'): GS => {
    const tile = cur.hands[seat][idx];
    const line = place(cur.line, tile, side);
    if (!line) return cur;
    const hands = cur.hands.map((h, i) => (i === seat ? h.filter((_, j) => j !== idx) : h));
    if (hands[seat].length === 0) return { ...cur, line, hands, over: true, result: seat };
    return { ...cur, line, hands, passes: 0, turn: 1 - seat };
  };

  const resolveBlock = (cur: GS): GS => {
    const p0 = handPips(cur.hands[0]);
    const p1 = handPips(cur.hands[1]);
    const result = p0 < p1 ? 0 : p1 < p0 ? 1 : -1;
    return { ...cur, over: true, result };
  };

  // Report the result once.
  useEffect(() => {
    if (gs.over && !reported.current) {
      reported.current = true;
      onGameOver(gs.result === -1 || gs.result == null ? -1 : seats[gs.result].seat);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gs.over]);

  // Bot turn (also handles its own draw/pass).
  useEffect(() => {
    if (gs.over || seats[gs.turn].kind !== 'bot') return;
    const t = setTimeout(() => {
      setGs((cur) => {
        if (cur.over || seats[cur.turn].kind !== 'bot') return cur;
        const seat = cur.turn;
        const mv = botMove(cur.hands[seat], cur.line);
        if (mv) {
          const idx = cur.hands[seat].findIndex((tt) => tileKey(tt) === tileKey(mv.tile));
          return afterPlace(cur, seat, idx, mv.side);
        }
        if (cur.boneyard.length > 0) {
          const by = cur.boneyard.slice();
          const drawn = by.pop()!;
          return { ...cur, boneyard: by, hands: cur.hands.map((h, i) => (i === seat ? [...h, drawn] : h)) };
        }
        const passes = cur.passes + 1;
        return passes >= 2 ? resolveBlock(cur) : { ...cur, passes, turn: 1 - seat };
      });
    }, botTickMs[seats[gs.turn].difficulty] + 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gs]);

  const humanTurn = !gs.over && seats[gs.turn].kind === 'human';
  // Always show the human's own hand at the bottom (never reveal the bot's tiles).
  // In pass-and-play (two humans) the bottom follows whoever's turn it is.
  const humanSeat = seats.findIndex((s) => s.kind === 'human');
  const bottomSeat = seats[gs.turn].kind === 'human' ? gs.turn : humanSeat >= 0 ? humanSeat : gs.turn;
  const hand = gs.hands[bottomSeat] ?? [];
  const canMove = humanTurn && gs.turn === bottomSeat && handCanPlay(hand, gs.line);

  const playHand = (idx: number) => {
    if (!humanTurn) return;
    const tile = hand[idx];
    if (!canPlay(tile, gs.line)) return;
    setGs((cur) => afterPlace(cur, cur.turn, idx, playableSides(tile, cur.line)[0]));
  };
  const drawCard = () => {
    if (!humanTurn || gs.boneyard.length === 0) return;
    setGs((cur) => {
      const by = cur.boneyard.slice();
      const drawn = by.pop()!;
      return { ...cur, boneyard: by, hands: cur.hands.map((h, i) => (i === cur.turn ? [...h, drawn] : h)) };
    });
  };
  const pass = () => {
    if (!humanTurn) return;
    setGs((cur) => {
      const passes = cur.passes + 1;
      return passes >= 2 ? resolveBlock(cur) : { ...cur, passes, turn: 1 - cur.turn };
    });
  };

  const oppSeat = 1 - gs.turn;
  const statusText = gs.over
    ? gs.result === -1
      ? "Blocked — it's a draw"
      : `${seats[gs.result!].name} wins!`
    : `${seats[gs.turn].name}'s turn`;

  const Pip = ({ n }: { n: number }) => <span className="dom-half">{n}</span>;

  return (
    <div className="board dom">
      <div className="board-info">
        <span>{seats[oppSeat].name}: {gs.hands[oppSeat].length} tiles</span>
        <span>{statusText}</span>
        <span>Boneyard {gs.boneyard.length}</span>
      </div>

      <div className="dom-line">
        {gs.line.length === 0 ? (
          <span className="dom-empty">Play any tile to start</span>
        ) : (
          gs.line.map((t, i) => (
            <span key={i} className="dom-tile placed">
              <Pip n={t[0]} /><Pip n={t[1]} />
            </span>
          ))
        )}
      </div>

      <div className="dom-hand">
        {hand.map((t, i) => {
          const ok = humanTurn && canPlay(t, gs.line);
          return (
            <button key={tileKey(t) + i} className={`dom-tile ${ok ? 'live' : 'dim'}`} onClick={() => playHand(i)} disabled={!ok}>
              <Pip n={t[0]} /><Pip n={t[1]} />
            </button>
          );
        })}
      </div>

      {humanTurn && !canMove && (
        <div className="board-actions">
          {gs.boneyard.length > 0 ? (
            <button className="btn btn-primary" onClick={drawCard}>Draw a tile</button>
          ) : (
            <button className="btn btn-ghost" onClick={pass}>Pass</button>
          )}
        </div>
      )}

      <div className="hint">
        {gs.over ? 'Tap rematch to play again' : humanTurn ? (canMove ? 'Tap a glowing tile to play it' : 'No move — draw or pass') : '🤖 thinking…'}
      </div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: DominoesTable };
export default mod;
