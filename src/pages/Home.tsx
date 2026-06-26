import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, getGame } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { CATEGORY_LABELS, type Category } from '../engine/types';
import { useApp } from '../store/store';
import { useInstallPrompt } from '../lib/pwa';

type Filter = 'all' | Category;

export function Home() {
  const nav = useNavigate();
  const recent = useApp((s) => s.recent);
  const favorites = useApp((s) => s.favorites);
  const { canInstall, promptInstall } = useInstallPrompt();
  const [filter, setFilter] = useState<Filter>('all');

  const recentGames = useMemo(
    () => recent.map(getGame).filter(Boolean).slice(0, 3) as typeof GAMES,
    [recent]
  );
  const favGames = useMemo(
    () => favorites.map(getGame).filter(Boolean).slice(0, 4) as typeof GAMES,
    [favorites]
  );
  const categories = useMemo(
    () => Array.from(new Set(GAMES.map((g) => g.category))) as Category[],
    []
  );
  const shown = filter === 'all' ? GAMES : GAMES.filter((g) => g.category === filter);

  const playNow = () => nav(`/game/${recent[0] ?? GAMES.find((g) => g.featured)!.id}`);

  return (
    <div className="p-4 md:p-8 space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-8 md:p-12 animate-fade-in neon-border-blue">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/20 to-brand-primary/20 opacity-30 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-blue to-neon-purple" />
        
        <div className="relative z-10">
          <div className="inline-block px-3 py-1 rounded-full border border-neon-blue/50 text-neon-blue text-sm font-mono mb-6 backdrop-blur-md">
            ✈︎ 100% OFFLINE CAPABLE
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight mb-4">
            Play anywhere.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">
              No internet needed.
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl">
            {GAMES.length} mini-games · solo, vs a friend, or vs a bot. 
            Your progress is saved directly on this device.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary flex items-center gap-2" onClick={playNow}>
              <span className="material-symbols-outlined">play_arrow</span>
              Play Now
            </button>
            {canInstall ? (
              <button className="btn-secondary flex items-center gap-2" onClick={promptInstall}>
                <span className="material-symbols-outlined">download</span>
                Install App
              </button>
            ) : (
              <button className="btn-secondary flex items-center gap-2" onClick={() => nav('/games')}>
                Browse all
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Continue Playing */}
      {recentGames.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-neon-pink">history</span>
              Continue Playing
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentGames.map((g) => (
              <div key={g.id}>
                <GameTile game={g} showProgress />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Favorites (Quick Access) */}
      {favGames.length > 0 && (
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-yellow-400">star</span>
              Favorites
            </h2>
            <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1" onClick={() => nav('/favorites')}>
              View all <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {favGames.map((g) => (
              <GameTile key={g.id} game={g} />
            ))}
          </div>
        </section>
      )}

      {/* Featured / All Games Section */}
      <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-secondary">explore</span>
            Discover Games
          </h2>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip on={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c} on={filter === c} onClick={() => setFilter(c)}>
              {CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {shown.map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button 
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
        on 
          ? 'bg-neon-blue/20 text-neon-blue border-neon-blue/50' 
          : 'bg-dark-surface border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
      }`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
}
