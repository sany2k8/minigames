import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GAMES } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { CATEGORY_LABELS, type Category } from '../engine/types';

type Filter = 'all' | Category;
type Sort = 'popular' | 'new' | 'az';

const CATS: Filter[] = ['all', 'card', 'sort', 'puzzle', 'word', 'board', 'arcade'];
const SORTS: { key: Sort; label: string }[] = [
  { key: 'popular', label: 'Popular' },
  { key: 'new', label: 'New' },
  { key: 'az', label: 'A–Z' }
];

export function Library() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialCat = (params.get('cat') as Filter) || 'all';
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>(initialCat);
  const [sort, setSort] = useState<Sort>('popular');

  const filtered = useMemo(() => {
    let list = GAMES.slice();
    if (filter !== 'all') list = list.filter((g) => g.category === filter);
    const query = q.trim().toLowerCase();
    if (query) list = list.filter((g) => g.title.toLowerCase().includes(query) || CATEGORY_LABELS[g.category].toLowerCase().includes(query));
    if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'new') list.reverse();
    return list;
  }, [q, filter, sort]);

  const featuredTwo = useMemo(() => GAMES.filter((g) => g.featured).slice(0, 2), []);
  const showFeatured = filter === 'all' && !q.trim();

  return (
    <div className="p-5 md:p-10 max-w-[1180px] mx-auto w-full animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <h1 className="text-[30px] font-bold tracking-tight">Browse games</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">
            {filtered.length} game{filtered.length !== 1 ? 's' : ''}{filter !== 'all' ? ` in ${CATEGORY_LABELS[filter]}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] text-ink-faint font-semibold hidden sm:inline">Sort</span>
          <div className="flex gap-1 p-1 rounded-[11px] bg-line-soft">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                  sort === s.key ? 'bg-card text-ink shadow-[0_1px_3px_rgba(20,20,40,0.10)]' : 'text-ink-faint hover:text-ink-soft'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">search</span>
        <input
          className="w-full h-11 rounded-xl border border-line bg-card pl-10 pr-4 text-ink placeholder-ink-faint outline-none focus:border-coral transition-colors"
          placeholder="Search games…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATS.map((c) => {
          const active = filter === c;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3.5 py-2 rounded-[10px] text-[13.5px] font-semibold border transition-colors ${
                active ? 'bg-coral text-white border-coral' : 'bg-card text-ink-soft border-line hover:text-ink'
              }`}
            >
              {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
            </button>
          );
        })}
      </div>

      {/* Featured banners */}
      {showFeatured && featuredTwo.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
          {featuredTwo.map((f) => (
            <div
              key={f.id}
              onClick={() => nav(`/game/${f.id}`)}
              className="relative overflow-hidden rounded-[20px] p-6 min-h-[168px] flex justify-between cursor-pointer shadow-[0_10px_26px_rgba(30,27,75,0.14)]"
              style={{ background: `linear-gradient(135deg, ${f.accent}, ${f.accent2})` }}
            >
              <div className="absolute -right-8 -bottom-10 w-40 h-40 rounded-full bg-white/[0.12]" />
              <div className="relative z-10 max-w-[300px]">
                <span className="inline-flex px-2.5 py-1 rounded-full bg-white/20 text-white text-[10.5px] font-bold tracking-[0.07em]">FEATURED</span>
                <h3 className="mt-3.5 text-[25px] font-bold text-white tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[13.5px] text-white/[0.88] leading-snug">{f.blurb}</p>
                <button className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-white text-ink font-bold text-[13.5px] hover:-translate-y-0.5 transition-transform">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z" /></svg> Play
                </button>
              </div>
              <div className="relative z-10 self-center w-[84px] h-[84px] rounded-[20px] bg-white/[0.16] border border-white/[0.28] grid place-items-center text-white scale-150">
                <f.icon />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-[18px] bg-line-soft grid place-items-center mx-auto mb-4 text-ink-faint">
            <span className="material-symbols-outlined text-3xl">search_off</span>
          </div>
          <h3 className="text-lg font-bold">No games found</h3>
          <p className="mt-1.5 text-ink-faint text-sm">Try a different search or category.</p>
        </div>
      )}
    </div>
  );
}
