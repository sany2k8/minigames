import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  GameDefinition,
  GameModule,
  PlayerInfo,
  PlayMode,
  SoloResult,
  Difficulty
} from './types';
import { buildPlayers } from './match';
import { resolveSimulOutcome } from './simul';
import { randomSeed } from './rng';
import { useOrientation } from './useOrientation';
import { useApp, winPoints } from '../store/store';
import { confettiBurst } from '../lib/confetti';
import { winBuzz } from '../lib/haptics';
import { ProgressBar, ResultModal, TopBar } from '../components/ui';
import '../components/components.css';

interface ResultData {
  title: string;
  subtitle?: string;
  emoji: string;
  score?: number; // for solo high-score recording
  humanWon?: boolean; // a human (not a bot) won — triggers rewards + confetti
  outcome?: 'win' | 'loss' | 'draw'; // for per-game statistics
}

export function GameHost({
  def,
  mode,
  difficulty
}: {
  def: GameDefinition;
  mode: PlayMode;
  difficulty: Difficulty;
}) {
  const nav = useNavigate();
  const { p1Name, p2Name, recordScore, recordResult, markPlayed, awardWin } = useApp();
  const [mod, setMod] = useState<GameModule | null>(null);
  const [seed, setSeed] = useState(randomSeed());
  const [result, setResult] = useState<ResultData | null>(null);
  const [earned, setEarned] = useState(0);

  const players = useMemo(
    () => buildPlayers(def.contest, mode, difficulty, p1Name, p2Name),
    [def.contest, mode, difficulty, p1Name, p2Name]
  );

  useEffect(() => {
    let live = true;
    def.load().then((m) => live && setMod(m));
    markPlayed(def.id);
    return () => {
      live = false;
    };
  }, [def, markPlayed]);

  const onResult = (r: ResultData) => {
    if (r.score != null) recordScore(def.id, r.score);
    if (r.outcome) recordResult(def.id, r.outcome);
    if (r.humanWon) {
      const pts = winPoints(difficulty);
      awardWin(pts);
      setEarned(pts);
      winBuzz();
      confettiBurst();
    } else {
      setEarned(0);
    }
    setResult(r);
  };

  const rematch = () => {
    setResult(null);
    setEarned(0);
    setSeed(randomSeed());
  };

  if (!mod) {
    return (
      <>
        <TopBar title={def.title} onBack={() => nav(-1)} />
        <div className="pass">
          <div className="big">Loading…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={def.title} onBack={() => nav(-1)} />
      {def.contest === 'table' && mod.Table && (
        <TableHost key={seed} Table={mod.Table} players={players} onResult={onResult} />
      )}
      {(def.contest === 'race' || def.contest === 'score') && mod.Solo && (
        <SimulHost
          key={seed}
          mode={def.contest}
          Solo={mod.Solo}
          players={players}
          seed={seed}
          onResult={onResult}
        />
      )}
      {result && (
        <ResultModal
          title={result.title}
          subtitle={result.subtitle}
          emoji={result.emoji}
          points={earned}
          onRematch={rematch}
          onHome={() => nav('/')}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* TABLE: single shared board the game manages itself                  */
/* ------------------------------------------------------------------ */
function TableHost({
  Table,
  players,
  onResult
}: {
  Table: NonNullable<GameModule['Table']>;
  players: PlayerInfo[];
  onResult: (r: ResultData) => void;
}) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div className="split single">
      <div className="split-pane">
        <div className="pane-inner">
          <div className="pane-board">
            {count <= 0 && (
              <Table
                players={players}
                onGameOver={(winnerSeat) => {
                  if (winnerSeat < 0) {
                    onResult({ title: "It's a draw", subtitle: 'Evenly matched!', emoji: '🤝', outcome: 'draw' });
                    return;
                  }
                  const w = players.find((p) => p.seat === winnerSeat)!;
                  onResult({
                    title: `${w.name} wins!`,
                    subtitle: w.kind === 'bot' ? 'The bot takes this one.' : 'Nicely played!',
                    emoji: '🏆',
                    humanWon: w.kind === 'human',
                    outcome: w.kind === 'human' ? 'win' : 'loss'
                  });
                }}
              />
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>{count > 0 && <Countdown n={count} />}</AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SIMUL: race + score. Both seats play the same seed side-by-side,     */
/* after a shared countdown. race = first to solve wins; score = wait   */
/* for everyone, highest score wins.                                    */
/* ------------------------------------------------------------------ */
function SimulHost({
  mode,
  Solo,
  players,
  seed,
  onResult
}: {
  mode: 'race' | 'score';
  Solo: NonNullable<GameModule['Solo']>;
  players: PlayerInfo[];
  seed: number;
  onResult: (r: ResultData) => void;
}) {
  const orientation = useOrientation();
  const [count, setCount] = useState(3);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [liveScore, setLiveScore] = useState<Record<number, number>>({});
  const results = useRef<Record<number, SoloResult>>({});
  const settled = useRef(false);

  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [count]);

  const finish = (seat: number, r: SoloResult) => {
    if (settled.current) return;
    results.current[seat] = r;
    const outcome = resolveSimulOutcome(mode, players, results.current, seat);
    if (outcome) {
      settled.current = true;
      onResult(outcome);
    }
  };

  const isDuo = players.length === 2 && players.every((p) => p.kind === 'human');
  // In bot mode put the bot on top and the human within thumb's reach at the bottom.
  const order = isDuo
    ? players
    : [...players].sort((a, b) => (a.kind === 'human' ? 1 : 0) - (b.kind === 'human' ? 1 : 0));

  const Pane = (p: PlayerInfo) => (
    <div className="split-pane" key={p.seat}>
      <div className="pane-inner">
        <div className="seat-head" style={{ ['--seat' as string]: p.color }}>
          <span className="seat-name">
            <span className="dot" style={{ background: p.color }} />
            {p.name}
            {p.kind === 'bot' && <span className="seat-tag">BOT</span>}
          </span>
          <span className="seat-pct">
            {mode === 'score' ? `★ ${liveScore[p.seat] ?? 0}` : `${progress[p.seat] ?? 0}%`}
          </span>
          {mode === 'race' && <ProgressBar pct={progress[p.seat] ?? 0} color={p.color} />}
        </div>
        <div className="pane-board">
          <Solo
            seed={seed}
            player={p}
            isBot={p.kind === 'bot'}
            difficulty={p.difficulty}
            paused={count > 0}
            onProgress={(pct) => setProgress((prev) => ({ ...prev, [p.seat]: pct }))}
            onScore={(s) => setLiveScore((prev) => ({ ...prev, [p.seat]: s }))}
            onDone={(r) => finish(p.seat, r)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`split ${players.length === 1 ? 'single' : orientation}${isDuo ? ' duo' : ''}`}>
      {order.map(Pane)}
      <AnimatePresence>{count > 0 && <Countdown n={count} />}</AnimatePresence>
    </div>
  );
}

function Countdown({ n }: { n: number }) {
  return (
    <motion.div
      className="countdown"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        key={n}
        className="countdown-num"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
      >
        {n === 0 ? 'GO!' : n}
      </motion.div>
    </motion.div>
  );
}

