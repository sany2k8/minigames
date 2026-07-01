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
import { botHeadStartMs, randomSeed } from './rng';
import { useOrientation } from './useOrientation';
import { useApp, winPoints } from '../store/store';
import { confettiBurst } from '../lib/confetti';
import { winBuzz } from '../lib/haptics';
import { sound } from '../lib/sound';
import { startMusic, stopMusic } from '../lib/music';
import { shake } from '../lib/juice';
import { shareChallenge } from '../lib/challenge';
import { recordPlay } from '../lib/cloud';
import { ProgressBar, ResultModal, TopBar } from '../components/ui';
import { HowToPlay } from '../games/HowToPlay';
import { HOWTO } from '../games/howto';
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
  difficulty,
  fixedSeed,
  onEnd
}: {
  def: GameDefinition;
  mode: PlayMode;
  difficulty: Difficulty;
  /** Force a specific puzzle seed (Daily Challenge / shared-code matches). */
  fixedSeed?: number;
  /** Fired whenever a match resolves, with the human's outcome + score. */
  onEnd?: (r: { outcome?: 'win' | 'loss' | 'draw'; humanWon?: boolean; score?: number }) => void;
}) {
  const nav = useNavigate();
  const { p1Name, p2Name, recordScore, recordResult, markPlayed, awardWin } = useApp();
  const music = useApp((s) => s.music);
  const [mod, setMod] = useState<GameModule | null>(null);
  const [seed, setSeed] = useState(fixedSeed ?? randomSeed());
  const [result, setResult] = useState<ResultData | null>(null);
  const [earned, setEarned] = useState(0);
  const [paused, setPaused] = useState(false);
  // Show the rules card before play when the game has a how-to entry.
  const howTo = HOWTO[def.id];
  const [ready, setReady] = useState(() => !howTo);
  const [shareLabel, setShareLabel] = useState('Challenge a friend');

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

  // Background music plays for the duration of a match when enabled.
  useEffect(() => {
    if (!music) return;
    startMusic();
    return () => stopMusic();
  }, [music]);

  const onResult = (r: ResultData) => {
    if (r.score != null) recordScore(def.id, r.score);
    if (r.outcome) recordResult(def.id, r.outcome);
    const pts = r.humanWon ? winPoints(difficulty) : 0;
    if (r.humanWon) {
      awardWin(pts);
      setEarned(pts);
      winBuzz();
      confettiBurst();
      shake();
      sound.win();
    } else {
      setEarned(0);
      if (r.outcome === 'loss') sound.lose();
    }
    setResult(r);
    onEnd?.({ outcome: r.outcome, humanWon: r.humanWon, score: r.score });
    // Best-effort cloud mirror — no-op offline / when Supabase isn't configured.
    void recordPlay({
      gameId: def.id,
      outcome: r.outcome,
      score: r.score ?? undefined,
      difficulty,
      points: pts
    });
  };

  const rematch = () => {
    setResult(null);
    setEarned(0);
    setPaused(false);
    // Daily / shared-code matches keep the same puzzle; everything else re-rolls.
    setSeed(fixedSeed ?? randomSeed());
  };

  // A challenge is only meaningful for seeded solo puzzles (race/score) with a
  // score — table games use a fresh random board that can't be reproduced.
  const canShare = def.contest !== 'table' && result?.score != null;
  const doShare = async () => {
    const r = await shareChallenge({ gameId: def.id, seed, score: result!.score!, name: p1Name });
    setShareLabel(r === 'copied' ? 'Link copied!' : r === 'shared' ? 'Shared!' : 'Could not share');
    setTimeout(() => setShareLabel('Challenge a friend'), 2500);
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
      <TopBar
        title={def.title}
        onBack={() => nav(-1)}
        right={
          ready && !result ? (
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-dark-surface-hover text-gray-400 hover:text-white transition-colors"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume' : 'Pause'}
            >
              <span className="material-symbols-outlined text-2xl">{paused ? 'play_arrow' : 'pause'}</span>
            </button>
          ) : undefined
        }
      />
      {!ready && howTo && (
        <HowToPlay
          title={def.title}
          tagline={def.blurb}
          icon={<def.icon />}
          steps={howTo}
          accent={def.accent2}
          accent2={def.accent}
          onStart={() => setReady(true)}
          cta="Start game"
        />
      )}
      {ready && def.contest === 'table' && mod.Table && (
        <TableHost key={seed} Table={mod.Table} players={players} paused={paused} onResult={onResult} />
      )}
      {ready && (def.contest === 'race' || def.contest === 'score') && mod.Solo && (
        <SimulHost
          key={seed}
          gameId={def.id}
          mode={def.contest}
          Solo={mod.Solo}
          players={players}
          seed={seed}
          paused={paused}
          onResult={onResult}
        />
      )}
      <AnimatePresence>
        {paused && !result && <PauseOverlay onResume={() => setPaused(false)} onHome={() => nav('/')} />}
      </AnimatePresence>
      {result && (
        <ResultModal
          title={result.title}
          subtitle={result.subtitle}
          emoji={result.emoji}
          points={earned}
          onRematch={rematch}
          onHome={() => nav('/')}
          onShare={canShare ? doShare : undefined}
          shareLabel={shareLabel}
        />
      )}
    </>
  );
}

function PauseOverlay({ onResume, onHome }: { onResume: () => void; onHome: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onResume}
    >
      <motion.div
        className="w-full max-w-xs glass-panel p-8 text-center flex flex-col items-center border border-dark-border shadow-2xl"
        initial={{ scale: 0.85, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">⏸️</div>
        <h2 className="text-2xl font-display font-black text-white mb-1">Paused</h2>
        <div className="text-gray-400 mb-7 text-sm">Take a breather — pick up right where you left off.</div>
        <div className="flex w-full gap-4">
          <button className="flex-1 btn-secondary py-3" onClick={onHome}>
            Home
          </button>
          <button className="flex-1 btn-primary py-3" onClick={onResume}>
            Resume
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* TABLE: single shared board the game manages itself                  */
/* ------------------------------------------------------------------ */
/**
 * Shared start countdown with audio. Counts 3 → 2 → 1 → GO (0) → done (-1).
 * Ticks beep on 3/2/1, a chime plays on GO. Freezes while `paused`.
 * `counting` is true (board hidden, game frozen) for any count >= 0.
 */
function useCountdown(paused: boolean) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count < 0 || paused) return;
    if (count === 0) sound.go();
    else sound.tick();
    const t = setTimeout(() => setCount((c) => c - 1), count === 0 ? 600 : 700);
    return () => clearTimeout(t);
  }, [count, paused]);
  return { count, counting: count >= 0 };
}

function TableHost({
  Table,
  players,
  paused,
  onResult
}: {
  Table: NonNullable<GameModule['Table']>;
  players: PlayerInfo[];
  paused: boolean;
  onResult: (r: ResultData) => void;
}) {
  const { count, counting } = useCountdown(paused);

  return (
    <div className="split single">
      <div className="split-pane">
        <div className="pane-inner">
          <div className="pane-board">
            {!counting && (
              <Table
                players={players}
                paused={paused}
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
      <AnimatePresence>{counting && <Countdown n={count} />}</AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SIMUL: race + score. Both seats play the same seed side-by-side,     */
/* after a shared countdown. race = first to solve wins; score = wait   */
/* for everyone, highest score wins.                                    */
/* ------------------------------------------------------------------ */
/** Progress (0..100) the ghost has reached at engine-time `t` ms. */
function interpPath(path: { t: number; p: number }[], t: number): number {
  if (path.length === 0) return 0;
  if (t <= path[0].t) return path[0].p;
  for (let i = 1; i < path.length; i++) {
    if (t <= path[i].t) {
      const a = path[i - 1];
      const b = path[i];
      const f = b.t === a.t ? 1 : (t - a.t) / (b.t - a.t);
      return a.p + (b.p - a.p) * f;
    }
  }
  return path[path.length - 1].p;
}

function SimulHost({
  gameId,
  mode,
  Solo,
  players,
  seed,
  paused,
  onResult
}: {
  gameId: string;
  mode: 'race' | 'score';
  Solo: NonNullable<GameModule['Solo']>;
  players: PlayerInfo[];
  seed: number;
  paused: boolean;
  onResult: (r: ResultData) => void;
}) {
  const orientation = useOrientation();
  const { count, counting } = useCountdown(paused);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [liveScore, setLiveScore] = useState<Record<number, number>>({});
  const results = useRef<Record<number, SoloResult>>({});
  const settled = useRef(false);

  // Ghost replay: a solo race becomes a race against your best run. The same
  // engine clock (elapsedRef) drives both recording and ghost playback.
  const { ghosts, saveGhost } = useApp();
  const soloRace = mode === 'race' && players.length === 1;
  const ghost = soloRace ? ghosts[gameId] : undefined;
  const elapsedRef = useRef(0);
  const pathRef = useRef<{ t: number; p: number }[]>([]);
  const [ghostPct, setGhostPct] = useState(0);

  useEffect(() => {
    if (!soloRace || counting || paused || settled.current) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      elapsedRef.current += now - last;
      last = now;
      const e = elapsedRef.current;
      if (ghost) {
        setGhostPct(interpPath(ghost.path, e));
        if (e >= ghost.time && !settled.current) {
          settled.current = true;
          onResult({
            title: '👻 Ghost wins!',
            subtitle: `Your record: ${(ghost.time / 1000).toFixed(1)}s`,
            emoji: '👻',
            outcome: 'loss'
          });
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloRace, counting, paused, ghost]);

  // Give the human a fair head start: hold the bot's first move for a short,
  // difficulty-scaled grace once play begins, so short puzzles don't end before
  // the player has had a chance to read the rules and make a move.
  const bot = players.find((p) => p.kind === 'bot');
  const hasHuman = players.some((p) => p.kind === 'human');
  const [headStartOver, setHeadStartOver] = useState(false);
  useEffect(() => {
    if (counting || paused || headStartOver || !bot || !hasHuman) return;
    const t = setTimeout(() => setHeadStartOver(true), botHeadStartMs[bot.difficulty]);
    return () => clearTimeout(t);
  }, [counting, paused, headStartOver, bot, hasHuman]);

  const finish = (seat: number, r: SoloResult) => {
    if (settled.current) return;
    // Banked a new best solo-race run → store its path for the ghost to chase.
    if (soloRace && r.solved) {
      const path = [...pathRef.current, { t: elapsedRef.current, p: 100 }];
      saveGhost(gameId, elapsedRef.current, path);
    }
    results.current[seat] = r;
    const outcome = resolveSimulOutcome(mode, players, results.current, seat);
    if (outcome) {
      settled.current = true;
      if (soloRace && ghost && r.solved) {
        outcome.subtitle = `You beat your ghost! ${(elapsedRef.current / 1000).toFixed(1)}s`;
      }
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
          {soloRace && ghost && p.kind === 'human' && (
            <div className="ghost-row">
              <span className="ghost-tag">👻 Ghost</span>
              <ProgressBar pct={ghostPct} color="rgba(255,255,255,0.45)" />
            </div>
          )}
        </div>
        <div className="pane-board">
          <Solo
            seed={seed}
            player={p}
            isBot={p.kind === 'bot'}
            difficulty={p.difficulty}
            paused={counting || paused || (p.kind === 'bot' && !headStartOver)}
            onProgress={(pct) => {
              setProgress((prev) => ({ ...prev, [p.seat]: pct }));
              // Record the human's progress timeline for the ghost.
              if (soloRace && p.kind === 'human') {
                const path = pathRef.current;
                if (path.length === 0 || path[path.length - 1].p !== pct) {
                  path.push({ t: elapsedRef.current, p: pct });
                }
              }
            }}
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
      <AnimatePresence>{counting && <Countdown n={count} />}</AnimatePresence>
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

