import { useEffect, useRef, useState } from 'react';
import type { GameModule, TableGameProps } from '../../engine/types';
import { makeRng, randomSeed } from '../../engine/rng';
import { type Movement, type Node, botPlan, layout, winner } from './logic';
import '../games.css';

const NEUTRAL = '#6f79b0';

function TowerWarTable({ players, paused, onGameOver }: TableGameProps) {
  const seats = players.slice(0, 2);
  const rng = useRef(makeRng(randomSeed())).current;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<Node[]>(layout(rng, seats.length)).current;
  const moves = useRef<Movement[]>([]);
  const moveId = useRef(1);
  const [, force] = useState(0);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number } | null>(null);
  const over = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const sendRef = useRef<(f: number, t: number, o: number) => void>(() => {});

  const color = (owner: number) => (owner < 0 ? NEUTRAL : seats[owner].color);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let growAcc = 0;
    const botAcc = seats.map(() => 0);
    const botEvery = (d: string) => (d === 'hard' ? 1200 : d === 'medium' ? 1900 : 2800);

    const send = (from: number, to: number, owner: number) => {
      const f = nodes[from];
      if (f.owner !== owner || f.troops < 2 || from === to) return;
      const troops = Math.floor(f.troops / 2);
      f.troops -= troops;
      moves.current.push({ id: moveId.current++, from, to, owner, troops, t: 0 });
    };
    sendRef.current = send;

    const loop = (now: number) => {
      const dt = Math.min(60, now - last);
      last = now;
      if (!over.current && !pausedRef.current) {
        // growth
        growAcc += dt;
        if (growAcc > 650) {
          growAcc = 0;
          for (const n of nodes) if (n.owner >= 0 && n.troops < n.cap) n.troops++;
        }
        // movements
        for (const m of moves.current) {
          m.t += dt / 900;
          if (m.t >= 1) {
            const tgt = nodes[m.to];
            if (tgt.owner === m.owner) tgt.troops = Math.min(tgt.cap, tgt.troops + m.troops);
            else {
              tgt.troops -= m.troops;
              if (tgt.troops < 0) {
                tgt.owner = m.owner;
                tgt.troops = -tgt.troops;
              }
            }
          }
        }
        moves.current = moves.current.filter((m) => m.t < 1);
        // bots
        seats.forEach((p, i) => {
          if (p.kind !== 'bot') return;
          botAcc[i] += dt;
          if (botAcc[i] > botEvery(p.difficulty)) {
            botAcc[i] = 0;
            const plan = botPlan(nodes, i);
            if (plan) send(plan.from, plan.to, i);
          }
        });
        // win
        const w = winner(nodes);
        if (w !== null) {
          over.current = true;
          setTimeout(() => onGameOver(seats[w] ? seats[w].seat : w), 500);
        }
      }
      force((n) => n + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nodeAt = (clientX: number, clientY: number): number => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    let best = -1;
    let bd = 0.012;
    nodes.forEach((n) => {
      const d = (n.x - x) ** 2 + (n.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = n.id;
      }
    });
    return best;
  };

  const onDown = (e: React.PointerEvent) => {
    const id = nodeAt(e.clientX, e.clientY);
    if (id < 0) return;
    const human = seats.findIndex((p) => p.kind === 'human');
    if (nodes[id].owner !== (human >= 0 ? human : 0)) return;
    setDrag({ from: id, x: e.clientX, y: e.clientY });
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const to = nodeAt(e.clientX, e.clientY);
    if (to >= 0) sendRef.current(drag.from, to, nodes[drag.from].owner);
    setDrag(null);
  };

  const size = 'min(86cqmin, 78cqh, 440px)';
  const rect = wrapRef.current?.getBoundingClientRect();
  return (
    <div className="board">
      <div className="mm-scores">
        {seats.map((p) => (
          <div key={p.seat} className="mm-score" style={{ color: p.color }}>
            <span className="mm-name">{p.name}{p.kind === 'bot' ? ' 🤖' : ''}</span>
            <span className="mm-pts">{nodes.filter((n) => n.owner === seats.indexOf(p)).reduce((s, n) => s + n.troops, 0)}</span>
          </div>
        ))}
      </div>
      <div
        ref={wrapRef}
        className="tw-field"
        style={{ width: size, height: size }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={() => setDrag(null)}
      >
        <svg className="tw-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          {drag && rect && (
            <line
              x1={nodes[drag.from].x * 100}
              y1={nodes[drag.from].y * 100}
              x2={((drag.x - rect.left) / rect.width) * 100}
              y2={((drag.y - rect.top) / rect.height) * 100}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          )}
          {moves.current.map((m) => {
            const f = nodes[m.from];
            const t = nodes[m.to];
            const x = (f.x + (t.x - f.x) * m.t) * 100;
            const y = (f.y + (t.y - f.y) * m.t) * 100;
            return <circle key={m.id} cx={x} cy={y} r="2.4" fill={color(m.owner)} />;
          })}
        </svg>
        {nodes.map((n) => (
          <div
            key={n.id}
            className="tw-node"
            style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%`, background: color(n.owner), boxShadow: `0 0 14px ${color(n.owner)}` }}
          >
            {n.troops}
          </div>
        ))}
      </div>
      <div className="hint">Drag from your towers to attack. Capture every tower to win!</div>
    </div>
  );
}

const mod: GameModule = { contest: 'table', Table: TowerWarTable };
export default mod;
