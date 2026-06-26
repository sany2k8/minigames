import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGame } from '../games/registry';
import { GameHost } from '../engine/GameHost';
import { TopBar } from '../components/ui';
import { useApp } from '../store/store';
import type { Difficulty, PlayMode } from '../engine/types';

const MODE_LABEL: Record<PlayMode, { title: string; sub: string; emoji: string }> = {
  solo: { title: '1 Player', sub: 'Solo / practice', emoji: '🧍' },
  duo: { title: '2 Players', sub: 'Same device', emoji: '🧑‍🤝‍🧑' },
  bot: { title: 'vs Bot', sub: 'Beat the AI', emoji: '🤖' }
};

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];

export function GamePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const def = id ? getGame(id) : undefined;
  const { difficulty, setDifficulty, isFavorite, toggleFavorite, p1Name, p2Name, setNames } =
    useApp();
  const [mode, setMode] = useState<PlayMode>('bot');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [id]);

  if (!def) {
    return (
      <div className="p-4 md:p-8 animate-fade-in">
        <TopBar title="Not found" />
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel mt-6">
          <span className="material-symbols-outlined text-6xl text-dark-border mb-4">videogame_asset_off</span>
          <p className="text-gray-400 text-lg">That game doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (playing) {
    return <GameHost key={def.id} def={def} mode={mode} difficulty={difficulty} />;
  }

  const Icon = def.icon;
  const fav = isFavorite(def.id);

  return (
    <div className="flex flex-col min-h-full bg-dark-bg text-white pb-24 md:pb-0 relative">
      <TopBar
        title={def.title}
        right={
          <button
            className={`flex items-center gap-1.5 h-9 px-3 rounded-full border text-sm font-semibold transition-colors ${
              fav
                ? 'bg-yellow-400/15 border-yellow-400/50 text-yellow-300'
                : 'bg-dark-surface-hover border-dark-border text-gray-300 hover:text-white hover:border-gray-500'
            }`}
            onClick={() => toggleFavorite(def.id)}
            aria-pressed={fav}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={fav ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {fav ? 'star' : 'star_border'}
            </span>
            <span className="hidden sm:inline">{fav ? 'Favorited' : 'Favorite'}</span>
          </button>
        }
      />

      <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="glass-panel overflow-hidden border border-dark-border">
          <div
            className="h-48 md:h-64 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${def.accent}, ${def.accent2})` }}
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-dark-bg/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20">
              <Icon />
            </div>
          </div>
          <div className="p-6 md:p-8 text-center bg-dark-surface/90 backdrop-blur-md">
            <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">{def.title}</h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">{def.blurb}</p>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-8 glass-panel p-6 md:p-8">
          <div>
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">sports_esports</span>
              Select Mode
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(MODE_LABEL) as PlayMode[]).map((m) => (
                <button
                  key={m}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === m 
                      ? 'bg-brand-primary/10 border-brand-primary text-white shadow-[0_0_15px_rgba(79,70,229,0.2)]' 
                      : 'bg-dark-surface border-dark-border text-gray-400 hover:text-gray-200 hover:border-gray-600'
                  }`}
                  onClick={() => setMode(m)}
                >
                  <div className="text-2xl mb-2">{MODE_LABEL[m].emoji}</div>
                  <div className="font-bold text-lg">{MODE_LABEL[m].title}</div>
                  <div className="text-sm opacity-70">{MODE_LABEL[m].sub}</div>
                </button>
              ))}
            </div>
          </div>

          {mode !== 'duo' && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-neon-pink">psychology</span>
                Bot Difficulty
              </h3>
              <div className="flex flex-wrap gap-3">
                {DIFFS.map((d) => (
                  <button
                    key={d}
                    className={`px-6 py-2.5 rounded-full font-medium transition-colors border ${
                      difficulty === d 
                        ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/50 shadow-[0_0_10px_rgba(255,0,127,0.2)]' 
                        : 'bg-dark-surface border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
                    }`}
                    onClick={() => setDifficulty(d)}
                  >
                    {d[0].toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'duo' && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-secondary">group</span>
                Player Names
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">P1</span>
                  <input
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                    value={p1Name}
                    onChange={(e) => setNames(e.target.value || 'Player 1', p2Name)}
                    placeholder="Player 1"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">P2</span>
                  <input
                    className="w-full bg-dark-bg border border-dark-border rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary transition-all"
                    value={p2Name}
                    onChange={(e) => setNames(p1Name, e.target.value || 'Player 2')}
                    placeholder="Player 2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-surface/90 backdrop-blur-md border-t border-dark-border z-50 flex items-center justify-between md:justify-end gap-4 md:px-8">
        <button 
          className="btn-secondary hidden md:flex items-center gap-2" 
          onClick={() => nav('/games')}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          More Games
        </button>
        <button 
          className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-2 py-3 md:py-2 text-lg md:text-base md:px-12" 
          onClick={() => setPlaying(true)}
        >
          <span className="material-symbols-outlined">play_arrow</span>
          START GAME
        </button>
      </div>
    </div>
  );
}
