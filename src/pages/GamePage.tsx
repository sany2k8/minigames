import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGame } from '../games/registry';
import { GameHost } from '../engine/GameHost';
import { StatsModal } from '../components/StatsModal';
import { CATEGORY_LABELS, type Difficulty, type PlayMode } from '../engine/types';
import { useApp } from '../store/store';

const MODE_LABEL: Record<PlayMode, { title: string; sub: string; emoji: string }> = {
  solo: { title: '1 Player', sub: 'Solo / practice', emoji: '🧍' },
  duo: { title: '2 Players', sub: 'Same device', emoji: '🧑‍🤝‍🧑' },
  bot: { title: 'vs Bot', sub: 'Beat the AI', emoji: '🤖' }
};

const CONTEST_LABEL: Record<string, string> = { race: 'RACE', score: 'SCORE', table: '2-4P' };
const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];

export function GamePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const def = id ? getGame(id) : undefined;
  const { difficulty, setDifficulty, isFavorite, toggleFavorite, p1Name, p2Name, setNames } = useApp();
  const [mode, setMode] = useState<PlayMode>('bot');
  const [playing, setPlaying] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [id]);

  if (!def) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
        <div className="card p-12 text-center mt-6">
          <span className="material-symbols-outlined text-5xl text-ink-faint mb-3">videogame_asset_off</span>
          <p className="text-ink-soft text-lg">That game doesn't exist.</p>
          <button onClick={() => nav('/games')} className="btn-coral mx-auto mt-5">Browse games</button>
        </div>
      </div>
    );
  }

  if (playing) {
    return (
      <div className="flex flex-col h-dvh bg-dark-bg text-gray-100">
        <GameHost key={def.id} def={def} mode={mode} difficulty={difficulty} />
      </div>
    );
  }

  const Icon = def.icon;
  const fav = isFavorite(def.id);

  return (
    <div className="flex flex-col min-h-full pb-28 md:pb-0">
      {/* Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-4 md:px-8 border-b border-line bg-card/85 backdrop-blur-md sticky top-0 z-20">
        <button onClick={() => nav(-1)} aria-label="Back" className="w-10 h-10 rounded-full grid place-items-center text-ink-soft hover:bg-line-soft transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg md:text-xl font-bold truncate max-w-[160px] md:max-w-md absolute left-1/2 -translate-x-1/2">{def.title}</h1>
        <div className="flex items-center gap-2">
        <button
          onClick={() => setShowStats(true)}
          aria-label="Statistics"
          className="w-9 h-9 rounded-full grid place-items-center border border-line bg-card text-ink-soft hover:text-ink hover:bg-line-soft transition-colors"
        >
          <span className="material-symbols-outlined text-xl">leaderboard</span>
        </button>
        <button
          onClick={() => toggleFavorite(def.id)}
          aria-pressed={fav}
          aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-full border text-sm font-bold transition-colors ${
            fav ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#F43F5E]' : 'bg-card border-line text-ink-soft hover:text-ink'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? '#F43F5E' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          <span className="hidden sm:inline">{fav ? 'Saved' : 'Favorite'}</span>
        </button>
        </div>
      </div>

      <StatsModal gameId={def.id} title={def.title} open={showStats} onClose={() => setShowStats(false)} />

      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-7">
        {/* Hero */}
        <div className="card overflow-hidden">
          <div className="h-44 md:h-56 grid place-items-center" style={{ background: `linear-gradient(135deg, ${def.accent}, ${def.accent2})` }}>
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-white/[0.16] border border-white/25 grid place-items-center text-white backdrop-blur-sm scale-[1.7]">
              <Icon />
            </div>
          </div>
          <div className="p-6 md:p-8 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">{def.title}</h2>
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="px-2.5 py-1 rounded-lg bg-line-soft text-ink-soft text-[12.5px] font-semibold">{CATEGORY_LABELS[def.category]}</span>
              <span className="font-mono text-[10.5px] text-ink-faint border border-line px-2 py-1 rounded-md">{CONTEST_LABEL[def.contest]}</span>
            </div>
            <p className="text-ink-soft max-w-2xl mx-auto">{def.blurb}</p>
          </div>
        </div>

        {/* Config */}
        <div className="card p-6 md:p-8 space-y-7">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-coral">sports_esports</span>
              Select mode
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(Object.keys(MODE_LABEL) as PlayMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === m ? 'bg-coral-soft border-coral text-ink' : 'bg-card border-line text-ink-soft hover:border-ink-faint'
                  }`}
                >
                  <div className="text-2xl mb-2">{MODE_LABEL[m].emoji}</div>
                  <div className="font-bold text-[15px] text-ink">{MODE_LABEL[m].title}</div>
                  <div className="text-sm text-ink-faint">{MODE_LABEL[m].sub}</div>
                </button>
              ))}
            </div>
          </div>

          {mode !== 'duo' && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-coral">psychology</span>
                Bot difficulty
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {DIFFS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-5 py-2.5 rounded-full font-bold border transition-colors ${
                      difficulty === d ? 'bg-coral text-white border-coral' : 'bg-card border-line text-ink-soft hover:text-ink'
                    }`}
                  >
                    {d[0].toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'duo' && (
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-coral">group</span>
                Player names
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="w-full bg-app-bg border border-line rounded-xl py-3 px-4 text-ink placeholder-ink-faint outline-none focus:border-coral transition-colors" value={p1Name} onChange={(e) => setNames(e.target.value || 'Player 1', p2Name)} placeholder="Player 1" />
                <input className="w-full bg-app-bg border border-line rounded-xl py-3 px-4 text-ink placeholder-ink-faint outline-none focus:border-coral transition-colors" value={p2Name} onChange={(e) => setNames(p1Name, e.target.value || 'Player 2')} placeholder="Player 2" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-md border-t border-line z-50 flex items-center justify-between md:justify-end gap-4 md:px-8">
        <button className="btn-soft hidden md:inline-flex" onClick={() => nav('/games')}>
          <span className="material-symbols-outlined">arrow_back</span>
          More games
        </button>
        <button className="btn-coral flex-1 md:flex-none text-lg md:text-base md:px-12" onClick={() => setPlaying(true)}>
          <span className="material-symbols-outlined">play_arrow</span>
          START GAME
        </button>
      </div>
    </div>
  );
}
