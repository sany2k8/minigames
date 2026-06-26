import { useMemo, useState } from 'react';
import { GAMES } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { CATEGORY_LABELS, type Category } from '../engine/types';

type Filter = 'all' | Category;

export function Library() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const cats = useMemo(
    () => Array.from(new Set(GAMES.map((g) => g.category))) as Category[],
    []
  );

  const shown = GAMES.filter((g) => {
    const matchQ = g.title.toLowerCase().includes(q.trim().toLowerCase());
    const matchCat = filter === 'all' || g.category === filter;
    return matchQ && matchCat;
  });

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-brand-primary text-4xl">search</span>
          Browse Games
        </h1>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            className="w-full bg-dark-surface border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all"
            placeholder="Search games…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        {cats.map((c) => (
          <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
            {CATEGORY_LABELS[c]}
          </Chip>
        ))}
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-6xl text-dark-border mb-4">sports_esports</span>
          <p className="text-gray-400 text-lg">No games match "{q}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {shown.map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button 
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
        active 
          ? 'bg-brand-primary/20 text-brand-primary border-brand-primary/50' 
          : 'bg-dark-surface border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
      }`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
}
