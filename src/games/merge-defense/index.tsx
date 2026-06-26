import { useEffect, useRef, useState } from 'react';
import type { GameModule, SoloGameProps } from '../../engine/types';
import { makeRng, botTickMs } from '../../engine/rng';
import { type Enemy, H, LANES, fire, spawnValue, tileColor, tileValue } from './logic';
import '../games.css';

function MergeDefenseSolo({ seed, isBot, difficulty, paused, onScore, onDone }: SoloGameProps) {
  const rng = useRef(makeRng(seed)).current;
  const [lanes, setLanes] = useState<Enemy[][]>(() => Array.from({ length: LANES }, () => []));
  const [tile, setTile] = useState(() => tileValue(rng, 0));
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(0);
  const eid = useRef(1);
  const done = useRef(false);
  const start = useRef(Date.now());
  const stateRef = useRef({ lanes: [] as Enemy[][], tile: 0, score: 0, stage: 0 });
  stateRef.current = { lanes, tile, score, stage };

  const finish = (sc: number) => {
    if (done.current) return;
    done.current = true;
    onScore?.(sc);
    onDone({ solved: false, score: sc, timeMs: Date.now() - start.current });
  };

  const fireLane = (l: number) => {
    if (done.current || paused) return;
    setLanes((cur) => {
      const res = fire(cur[l], stateRef.current.tile);
      if (res.destroyed > 0)
        setScore((s) => {
          const ns = s + res.destroyed;
          onScore?.(ns);
          return ns;
        });
      const next = cur.map((ln, i) => (i === l ? res.enemies : ln));
      return next;
    });
    setTile(tileValue(rng, stateRef.current.stage));
  };
  const fireRef = useRef(fireLane);
  fireRef.current = fireLane;

  // wave loop
  useEffect(() => {
    let ticks = 0;
    const id = setInterval(() => {
      if (paused || done.current) return;
      ticks++;
      setStage((s) => (ticks % 6 === 0 ? s + 1 : s));
      setLanes((cur) => {
        let breach = false;
        const moved = cur.map((ln) =>
          ln.map((e) => {
            const nd = e.dist - 1;
            if (nd <= 0) breach = true;
            return { ...e, dist: nd };
          })
        );
        if (breach) {
          finish(stateRef.current.score);
          return cur;
        }
        // spawn every 3 ticks in 1-2 random lanes
        if (ticks % 3 === 0) {
          const n = 1 + rng.int(2);
          for (let k = 0; k < n; k++) {
            const l = rng.int(LANES);
            moved[l] = [...moved[l], { id: eid.current++, value: spawnValue(rng, stateRef.current.stage), dist: H }];
          }
        }
        return moved;
      });
      // bot fires at the lane with the closest enemy
      if (isBot) {
        const ls = stateRef.current.lanes;
        let bestL = -1;
        let bestDist = Infinity;
        ls.forEach((ln, i) => ln.forEach((e) => {
          if (e.dist < bestDist) {
            bestDist = e.dist;
            bestL = i;
          }
        }));
        if (bestL >= 0) fireRef.current(bestL);
      }
    }, isBot ? botTickMs[difficulty] + 250 : 850);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, isBot, difficulty]);

  const size = 'min(86cqmin, 70cqh, 440px)';
  return (
    <div className="board">
      <div className="board-info">
        <span>Score {score}</span>
        <span>Wave {stage + 1}</span>
      </div>
      <div className="md-field" style={{ width: size }}>
        {Array.from({ length: LANES }).map((_, l) => (
          <button key={l} className="md-lane" onClick={() => !isBot && fireLane(l)} disabled={isBot}>
            {lanes[l].map((e) => (
              <span
                key={e.id}
                className="md-enemy"
                style={{ top: `${((H - e.dist) / H) * 100}%`, background: tileColor(e.value) }}
              >
                {e.value}
              </span>
            ))}
            <span className="md-base" />
          </button>
        ))}
      </div>
      <div className="md-launcher">
        <span className="md-tile" style={{ background: tileColor(tile) }}>{tile}</span>
        <span className="hint" style={{ minHeight: 0 }}>
          {isBot ? 'Bot defending the base…' : 'Tap a lane to fire — clear enemies before they reach the base!'}
        </span>
      </div>
    </div>
  );
}

const mod: GameModule = { contest: 'score', Solo: MergeDefenseSolo };
export default mod;
