import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGame } from '../games/registry';
import { GameHost } from '../engine/GameHost';
import { todayChallenge } from '../lib/daily';
import { useApp } from '../store/store';

/**
 * Daily Challenge: today's date-seeded puzzle, the same for everyone, played vs
 * a fixed-difficulty bot. Finishing it keeps your streak alive.
 */
export function DailyPage() {
  const nav = useNavigate();
  const daily = useMemo(() => todayChallenge(), []);
  const def = getGame(daily.gameId);
  const { dailyStreak, dailyBest, lastDailyKey, dailyHistory, completeDaily } = useApp();
  const [playing, setPlaying] = useState(false);

  const doneToday = lastDailyKey === daily.key;
  const todayResult = dailyHistory[daily.key];

  if (!def) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
        <div className="card p-12 text-center mt-6">
          <p className="text-ink-soft text-lg">No challenge available today.</p>
          <button onClick={() => nav('/')} className="btn-coral mx-auto mt-5">Home</button>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className="flex flex-col h-dvh bg-dark-bg text-gray-100">
        <GameHost
          key={def.id}
          def={def}
          mode="bot"
          difficulty="medium"
          fixedSeed={daily.seed}
          onEnd={(r) => completeDaily(daily.key, def.id, r.outcome ?? 'loss', r.score)}
        />
      </div>
    );
  }

  const Icon = def.icon;
  const longDate = new Date(`${daily.key}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto w-full animate-fade-in">
      <button
        onClick={() => nav('/')}
        aria-label="Back"
        className="w-10 h-10 rounded-full grid place-items-center text-ink-soft hover:bg-line-soft transition-colors mb-3"
      >
        <span className="material-symbols-outlined">arrow_back</span>
      </button>

      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-soft text-coral-ink text-[11.5px] font-bold tracking-[0.08em]">
          🗓️ DAILY CHALLENGE
        </div>
        <h1 className="mt-3 text-[28px] md:text-[34px] font-bold tracking-tight">{longDate}</h1>
        <p className="text-ink-soft mt-1">One puzzle. Everyone gets the same. Keep your streak alive.</p>
      </div>

      {/* Streak stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Streak" value={`${dailyStreak}`} accent="🔥" />
        <Stat label="Best" value={`${dailyBest}`} accent="🏅" />
        <Stat label="Status" value={doneToday ? 'Done' : 'Open'} accent={doneToday ? '✅' : '⏳'} />
      </div>

      {/* Today's game card */}
      <div className="card overflow-hidden">
        <div className="h-40 md:h-48 grid place-items-center" style={{ background: `linear-gradient(135deg, ${def.accent}, ${def.accent2})` }}>
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/[0.16] border border-white/25 grid place-items-center text-white backdrop-blur-sm scale-[1.6]">
            <Icon />
          </div>
        </div>
        <div className="p-6 md:p-8 text-center">
          <div className="text-xs font-mono uppercase tracking-wider text-ink-faint mb-1">Today's game</div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{def.title}</h2>
          <p className="text-ink-soft max-w-xl mx-auto mb-6">{def.blurb}</p>

          {doneToday && todayResult ? (
            <div className="space-y-4">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold ${
                  todayResult.outcome === 'win'
                    ? 'bg-green-100 text-green-700'
                    : todayResult.outcome === 'draw'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-line-soft text-ink-soft'
                }`}
              >
                {todayResult.outcome === 'win' ? '🏆 You won today!' : todayResult.outcome === 'draw' ? '🤝 Draw' : '💪 Completed'}
                {todayResult.score != null && ` · ${todayResult.score}`}
              </div>
              <div className="flex gap-3 justify-center">
                <button className="btn-soft" onClick={() => setPlaying(true)}>Replay</button>
                <button className="btn-coral" onClick={() => nav('/games')}>More games</button>
              </div>
              <p className="text-xs text-ink-faint">Come back tomorrow for a new challenge.</p>
            </div>
          ) : (
            <button className="btn-coral text-lg px-12 mx-auto" onClick={() => setPlaying(true)}>
              <span className="material-symbols-outlined">play_arrow</span>
              Play today's challenge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl">{accent}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-ink-faint font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
}
