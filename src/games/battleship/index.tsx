import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { makeRng, randomSeed, botTickMs } from '../../engine/rng';
import { GRID, type Ship, allSunk, isSunk, nextBotShot, placeFleet, shipAt } from './logic';
import '../games.css';

function BattleshipTable({ players, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const humanCount = useMemo(() => seats.filter((p) => p.kind === 'human').length, [seats]);
  const rng = useRef(makeRng(randomSeed())).current;
  const ships = useRef<Ship[][]>([placeFleet(rng), placeFleet(rng)]).current;
  const [shots, setShots] = useState<[Set<number>, Set<number>]>([new Set(), new Set()]);
  const [turn, setTurn] = useState(0);
  const [revealed, setRevealed] = useState(humanCount <= 1);
  const [lastResult, setLastResult] = useState('');
  const over = useRef(false);

  const cur = seats[turn];
  const opp = 1 - turn;

  const fire = (cell: number) => {
    if (over.current || shots[turn].has(cell)) return;
    const ns: [Set<number>, Set<number>] = [new Set(shots[0]), new Set(shots[1])];
    ns[turn].add(cell);
    const hitShip = shipAt(ships[opp], cell);
    setShots(ns);
    if (hitShip) {
      setLastResult(isSunk(hitShip, ns[turn]) ? '💥 Sunk!' : '🔥 Hit!');
    } else {
      setLastResult('💦 Miss');
    }
    if (allSunk(ships[opp], ns[turn])) {
      over.current = true;
      setTimeout(() => onGameOver(seats[turn].seat), 600);
      return;
    }
    setTurn((t) => (t + 1) % 2);
  };
  const fireRef = useRef(fire);
  fireRef.current = fire;

  // hide between human turns (pass-and-play)
  useEffect(() => {
    if (humanCount > 1 && cur.kind === 'human') setRevealed(false);
  }, [turn, humanCount, cur.kind]);

  // bot turn
  useEffect(() => {
    if (over.current || cur.kind !== 'bot') return;
    const t = setTimeout(() => {
      const cell = nextBotShot(ships[opp], shots[turn], rng);
      fireRef.current(cell);
    }, botTickMs[cur.difficulty] + 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, shots]);

  if (humanCount > 1 && cur.kind === 'human' && !revealed && !over.current) {
    return (
      <div className="pass">
        <div className="pass-emoji">🎯</div>
        <div className="big">Pass to {cur.name}</div>
        <div className="pass-sub">Your turn to fire at the enemy fleet</div>
        <button className="btn btn-primary" onClick={() => setRevealed(true)}>
          I'm {cur.name} — Ready
        </button>
      </div>
    );
  }

  const myShots = shots[turn]; // what I've fired at the enemy
  const enemyShots = shots[opp]; // what the enemy fired at me

  const cellSize = 'min(8.4cqmin, 8.4cqw)';
  const EnemyCell = (i: number) => {
    const fired = myShots.has(i);
    const hit = fired && !!shipAt(ships[opp], i);
    return (
      <div
        key={i}
        className={`bs-cell ${fired ? (hit ? 'hit' : 'miss') : 'water'}`}
        onClick={() => cur.kind === 'human' && fire(i)}
      >
        {fired ? (hit ? '🔥' : '•') : ''}
      </div>
    );
  };
  const MyCell = (i: number) => {
    const ship = !!shipAt(ships[turn], i);
    const fired = enemyShots.has(i);
    return (
      <div key={i} className={`bs-mini ${fired && ship ? 'hit' : fired ? 'miss' : ship ? 'ship' : 'water'}`} />
    );
  };

  return (
    <div className="board bs">
      <div className="mm-scores">
        {seats.map((p, i) => (
          <div key={p.seat} className={`mm-score ${i === turn ? 'on' : ''}`} style={{ color: p.color }}>
            <span className="mm-name">{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
          </div>
        ))}
      </div>
      <div className="bs-label">Enemy waters {lastResult && `— ${lastResult}`}</div>
      <div
        className="bs-grid enemy"
        style={{ gridTemplateColumns: `repeat(${GRID}, ${cellSize})` }}
      >
        {Array.from({ length: GRID * GRID }).map((_, i) => EnemyCell(i))}
      </div>
      <div className="bs-label dim">Your fleet</div>
      <div className="bs-grid mini" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
        {Array.from({ length: GRID * GRID }).map((_, i) => MyCell(i))}
      </div>
      {cur.kind === 'human' && <div className="hint">Tap the enemy grid to fire</div>}
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: BattleshipTable };
export default mod;
