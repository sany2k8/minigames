import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, getGame } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { CATEGORY_LABELS, type Category } from '../engine/types';
import { useApp } from '../store/store';
import { todayChallenge } from '../lib/daily';
import { currentSeason } from '../lib/seasons';
import { QuestsCard } from '../components/QuestsCard';

const CONTEST_LABEL: Record<string, string> = { race: 'RACE', score: 'SCORE', table: '2-4P' };
const CAT_GLYPH: Record<Category, string> = {
  card: '♠', sort: '⇅', puzzle: '◧', word: 'A', board: '◉', arcade: '◆'
};

export function Home() {
  const nav = useNavigate();
  const recent = useApp((s) => s.recent);
  const favorites = useApp((s) => s.favorites);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const p1Name = useApp((s) => s.p1Name);
  const dailyStreak = useApp((s) => s.dailyStreak);
  const lastDailyKey = useApp((s) => s.lastDailyKey);

  const daily = useMemo(() => todayChallenge(), []);
  const dailyGame = getGame(daily.gameId);
  const dailyDone = lastDailyKey === daily.key;
  const season = useMemo(() => currentSeason(), []);

  const featured = useMemo(() => {
    const f = GAMES.filter((g) => g.featured);
    return (f.length ? f : GAMES).slice(0, 4);
  }, []);
  const recentGames = useMemo(
    () => recent.map(getGame).filter(Boolean).slice(0, 4) as typeof GAMES,
    [recent]
  );
  const popular = useMemo(() => GAMES.slice(0, 8), []);
  const categories = useMemo(() => {
    const counts = {} as Record<string, number>;
    GAMES.forEach((g) => (counts[g.category] = (counts[g.category] || 0) + 1));
    return (['card', 'sort', 'puzzle', 'word', 'board', 'arcade'] as Category[]).map((c) => ({
      cat: c,
      count: counts[c] || 0
    }));
  }, []);

  const [hero, setHero] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHero((h) => (h + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  const hg = featured[hero];
  const heroFav = favorites.includes(hg.id);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-5 md:p-10 max-w-[1180px] mx-auto w-full animate-fade-in">
      <div className="mb-6">
        <div className="text-[13px] font-bold text-ink-soft tracking-wide">{greeting}, {p1Name}</div>
        <h1 className="mt-1 text-[30px] font-bold tracking-tight">Ready to play? {season && <span>{season.emoji}</span>}</h1>
      </div>

      {/* Seasonal event banner */}
      {season && (
        <div
          className="mb-5 rounded-2xl px-5 py-4 flex items-center gap-4 text-white shadow-[0_12px_28px_rgba(20,20,40,0.16)]"
          style={{ background: `linear-gradient(120deg, ${season.accent}, ${season.accent2})` }}
        >
          <div className="text-4xl drop-shadow">{season.emoji}</div>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-[10.5px] font-bold tracking-[0.08em] mb-1">
              LIMITED EVENT
            </div>
            <div className="font-bold text-[17px] leading-tight">{season.name}</div>
            <div className="text-[13.5px] text-white/90">{season.tagline}</div>
          </div>
        </div>
      )}

      {/* Hero carousel */}
      <div
        className="relative overflow-hidden rounded-[24px] px-8 py-10 md:px-11 min-h-[276px] flex items-center shadow-[0_20px_48px_rgba(30,27,75,0.18)]"
        style={{ background: `linear-gradient(135deg, ${hg.accent}, ${hg.accent2})` }}
      >
        <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-white/[0.13]" />
        <div className="absolute right-24 -bottom-24 w-52 h-52 rounded-full bg-white/[0.10]" />

        <div className="relative z-10 max-w-[540px]">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 text-white text-[11.5px] font-bold tracking-[0.08em] backdrop-blur-sm">★ FEATURED</span>
          <h2 className="mt-4 text-[34px] md:text-[40px] font-bold text-white tracking-tight leading-[1.05]">{hg.title}</h2>
          <p className="mt-3 text-[15px] md:text-base text-white/90 max-w-[440px] leading-relaxed">{hg.blurb}</p>
          <div className="flex items-center gap-2.5 mt-3.5">
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.18] text-white text-[12.5px] font-bold">{CATEGORY_LABELS[hg.category]}</span>
            <span className="font-mono text-[11px] text-white/85 border border-white/35 px-2 py-1 rounded-md">{CONTEST_LABEL[hg.contest]}</span>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => nav(`/game/${hg.id}`)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-ink font-bold text-[15px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-transform">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z" /></svg> Play now
            </button>
            <button onClick={() => toggleFavorite(hg.id)} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.16] border border-white/35 text-white font-bold text-sm backdrop-blur-sm hover:bg-white/[0.26] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill={heroFav ? '#fff' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
              {heroFav ? 'Saved' : 'Favorite'}
            </button>
          </div>
        </div>

        <div className="relative z-10 ml-auto hidden md:flex">
          <div className="w-[130px] h-[130px] rounded-[28px] bg-white/[0.16] border border-white/[0.28] grid place-items-center text-white backdrop-blur-sm scale-[1.6]">
            <hg.icon />
          </div>
        </div>

        <div className="absolute bottom-6 left-9 z-20 flex gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setHero(i)}
              aria-label={`Slide ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{ width: i === hero ? 26 : 8, background: i === hero ? '#fff' : 'rgba(255,255,255,0.45)' }}
            />
          ))}
        </div>
      </div>

      {/* Daily Challenge */}
      {dailyGame && (
        <button
          onClick={() => nav('/daily')}
          className="mt-6 w-full text-left card p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(20,20,40,0.10)] transition-all"
        >
          <div
            className="w-14 h-14 shrink-0 rounded-2xl grid place-items-center text-white text-2xl shadow-sm"
            style={{ background: `linear-gradient(135deg, ${dailyGame.accent}, ${dailyGame.accent2})` }}
          >
            🗓️
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px]">Daily Challenge</span>
              {dailyStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-[12px] font-bold text-coral-ink bg-coral-soft px-2 py-0.5 rounded-full">
                  🔥 {dailyStreak}
                </span>
              )}
            </div>
            <div className="text-sm text-ink-faint truncate">
              {dailyDone ? 'Done today — come back tomorrow!' : `Today: ${dailyGame.title}`}
            </div>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm ${
              dailyDone ? 'bg-line-soft text-ink-soft' : 'btn-coral'
            }`}
          >
            {dailyDone ? '✓ Done' : 'Play'}
          </span>
        </button>
      )}

      {/* Weekly quests */}
      <QuestsCard />

      {/* Tournament */}
      <button
        onClick={() => nav('/tournament')}
        className="mt-4 w-full text-left card p-5 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(20,20,40,0.10)] transition-all"
      >
        <div className="w-14 h-14 shrink-0 rounded-2xl grid place-items-center text-white text-2xl shadow-sm" style={{ background: 'linear-gradient(135deg,#F59E0B,#FB923C)' }}>
          🏆
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[15px]">Tournament</div>
          <div className="text-sm text-ink-faint truncate">Best-of-5 gauntlet vs the bot — win to bank a bonus.</div>
        </div>
        <span className="shrink-0 btn-coral px-4 py-2 text-sm">Enter</span>
      </button>

      {/* Jump back in */}
      {recentGames.length > 0 && (
        <>
          <SectionHead title="Jump back in" onAll={() => nav('/games')} />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentGames.map((g) => (
              <GameTile key={g.id} game={g} showProgress />
            ))}
          </div>
        </>
      )}

      {/* Popular */}
      <SectionHead title="Popular this week" onAll={() => nav('/games')} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {popular.map((g) => (
          <GameTile key={g.id} game={g} />
        ))}
      </div>

      {/* Categories */}
      <h3 className="mt-10 mb-4 text-xl font-bold tracking-tight">Browse by category</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {categories.map(({ cat, count }) => (
          <button
            key={cat}
            onClick={() => nav(`/games?cat=${cat}`)}
            className="flex flex-col items-start text-left card p-4 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(20,20,40,0.10)] transition-all"
          >
            <div className="w-10 h-10 rounded-xl grid place-items-center text-white text-lg font-bold" style={{ background: catGradient(cat) }}>
              {CAT_GLYPH[cat]}
            </div>
            <div className="font-bold text-[14.5px] mt-3">{CATEGORY_LABELS[cat]}</div>
            <div className="text-xs text-ink-faint font-semibold">{count} games</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionHead({ title, onAll }: { title: string; onAll: () => void }) {
  return (
    <div className="flex items-center justify-between mt-10 mb-4">
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <button onClick={onAll} className="text-coral font-bold text-sm hover:text-coral-ink transition-colors">View all</button>
    </div>
  );
}

function catGradient(cat: Category): string {
  const map: Record<Category, string> = {
    card: 'linear-gradient(135deg,#FB7185,#F43F5E)',
    sort: 'linear-gradient(135deg,#3B82F6,#06B6D4)',
    puzzle: 'linear-gradient(135deg,#8B5CF6,#A855F7)',
    word: 'linear-gradient(135deg,#22C55E,#84CC16)',
    board: 'linear-gradient(135deg,#F59E0B,#FB923C)',
    arcade: 'linear-gradient(135deg,#F97316,#EF4444)'
  };
  return map[cat];
}
