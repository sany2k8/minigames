import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../games/registry';
import type { GameDefinition } from '../engine/types';
import { GameHost } from '../engine/GameHost';
import { useApp } from '../store/store';
import { sound } from '../lib/sound';

const ROUNDS = 5;

function pickGames(): GameDefinition[] {
  const pool = [...GAMES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUNDS);
}

type RoundResult = 'me' | 'bot' | 'draw';

/**
 * Tournament / gauntlet: a best-of-5 run across random games vs the bot, with a
 * cumulative scoreboard. Pure composition over GameHost — no new game logic.
 */
export function Tournament() {
  const nav = useNavigate();
  const difficulty = useApp((s) => s.difficulty);
  const awardWin = useApp((s) => s.awardWin);
  const [games, setGames] = useState<GameDefinition[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<'lobby' | 'play' | 'interlude' | 'done'>('lobby');

  const myWins = results.filter((r) => r === 'me').length;
  const botWins = results.filter((r) => r === 'bot').length;

  const start = () => {
    setGames(pickGames());
    setRound(0);
    setResults([]);
    setPhase('play');
  };

  const finishRound = (r: { humanWon?: boolean; outcome?: 'win' | 'loss' | 'draw' }) => {
    const outcome: RoundResult = r.humanWon ? 'me' : r.outcome === 'draw' ? 'draw' : 'bot';
    const next = [...results, outcome];
    setResults(next);
    const last = round + 1 >= ROUNDS;
    if (last) {
      const me = next.filter((x) => x === 'me').length;
      const bot = next.filter((x) => x === 'bot').length;
      if (me > bot) {
        awardWin(250); // champion bonus
        sound.win();
      }
      setPhase('done');
    } else {
      setPhase('interlude');
    }
  };

  if (phase === 'play') {
    const def = games[round];
    return (
      <div className="flex flex-col h-dvh bg-dark-bg text-gray-100">
        <GameHost key={`${def.id}-${round}`} def={def} mode="bot" difficulty={difficulty} onEnd={finishRound} />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto w-full animate-fade-in">
      <button
        onClick={() => nav('/')}
        aria-label="Back"
        className="w-10 h-10 rounded-full grid place-items-center text-ink-soft hover:bg-line-soft transition-colors mb-3"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-soft text-coral-ink text-[11.5px] font-bold tracking-[0.08em] mb-3">
        🏆 TOURNAMENT
      </div>

      {phase === 'lobby' && (
        <div className="card p-7 text-center">
          <div className="text-6xl mb-3">🏟️</div>
          <h1 className="text-2xl font-bold mb-2">Gauntlet of 5</h1>
          <p className="text-ink-soft mb-6">Five random games, back to back, against the bot. Win the most to be crowned champion — and bank a bonus.</p>
          <button className="btn-coral text-lg px-12 mx-auto" onClick={start}>
            <span className="material-symbols-outlined">play_arrow</span>
            Start tournament
          </button>
        </div>
      )}

      {(phase === 'interlude' || phase === 'done') && (
        <div className="card p-7">
          <Scoreboard myWins={myWins} botWins={botWins} />

          <div className="space-y-2.5 my-6">
            {games.map((g, i) => {
              const res = results[i];
              const current = i === round && phase === 'interlude';
              return (
                <div key={g.id} className={`flex items-center gap-3 rounded-xl p-3 ${current ? 'bg-coral-soft' : 'bg-line-soft'}`}>
                  <span className="w-7 text-center font-bold text-ink-faint">{i + 1}</span>
                  <span className="font-bold text-[14.5px] flex-1 truncate">{g.title}</span>
                  {res ? (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${res === 'me' ? 'bg-green-100 text-green-700' : res === 'bot' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                      {res === 'me' ? 'Won' : res === 'bot' ? 'Lost' : 'Draw'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-ink-faint">{current ? 'Up next' : '—'}</span>
                  )}
                </div>
              );
            })}
          </div>

          {phase === 'interlude' ? (
            <button className="btn-coral w-full" onClick={() => { setRound((r) => r + 1); setPhase('play'); }}>
              Next round ({round + 2} of {ROUNDS})
            </button>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-2">{myWins > botWins ? '🥇' : myWins === botWins ? '🤝' : '🥈'}</div>
              <h2 className="text-2xl font-bold mb-1">
                {myWins > botWins ? 'Champion!' : myWins === botWins ? 'Tied series' : 'Bot takes it'}
              </h2>
              <p className="text-ink-soft mb-5">{myWins > botWins ? '+250 bonus points banked.' : 'Run it back?'}</p>
              <div className="flex gap-3 justify-center">
                <button className="btn-soft" onClick={() => nav('/')}>Home</button>
                <button className="btn-coral" onClick={start}>New tournament</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Scoreboard({ myWins, botWins }: { myWins: number; botWins: number }) {
  return (
    <div className="flex items-center justify-center gap-6">
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600">{myWins}</div>
        <div className="text-xs text-ink-faint uppercase tracking-wide font-bold">You</div>
      </div>
      <div className="text-ink-faint font-bold text-xl">–</div>
      <div className="text-center">
        <div className="text-4xl font-bold text-red-500">{botWins}</div>
        <div className="text-xs text-ink-faint uppercase tracking-wide font-bold">Bot</div>
      </div>
    </div>
  );
}
