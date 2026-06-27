import { useMemo } from 'react';
import { GAMES, getGame } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { levelInfo, useApp } from '../store/store';

interface Stats { gamesWon: number; played: number; favs: number; points: number }

const STAR = 'M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6 7.3 13.8 2.2 9.1l6.9-.8z';
const ACHIEVEMENTS = [
  { name: 'First Win', desc: 'Won your first game', grad: 'linear-gradient(135deg,#F59E0B,#FB923C)', need: (s: Stats) => s.gamesWon >= 1, glyph: STAR },
  { name: 'On a Roll', desc: 'Won 10 games', grad: 'linear-gradient(135deg,#FB7185,#F43F5E)', need: (s: Stats) => s.gamesWon >= 10, glyph: 'M12 2c1 4-2 5-2 8a4 4 0 0 0 8 0c0-1-.5-2-1-3 2 1 4 3 4 7a7 7 0 0 1-14 0c0-5 5-7 5-12z' },
  { name: 'Collector', desc: 'Favorite 5 games', grad: 'linear-gradient(135deg,#8B5CF6,#A855F7)', need: (s: Stats) => s.favs >= 5, glyph: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z' },
  { name: 'Explorer', desc: 'Play 25 games', grad: 'linear-gradient(135deg,#3B82F6,#06B6D4)', need: (s: Stats) => s.played >= 25, glyph: STAR },
  { name: 'Champion', desc: 'Win 50 games', grad: 'linear-gradient(135deg,#22C55E,#84CC16)', need: (s: Stats) => s.gamesWon >= 50, glyph: STAR },
  { name: 'Devotee', desc: 'Earn 5,000 points', grad: 'linear-gradient(135deg,#F97316,#EF4444)', need: (s: Stats) => s.points >= 5000, glyph: STAR }
];

export function Profile() {
  const { points, gamesWon, gamesPlayed, favorites, recent, p1Name } = useApp();
  const tier = levelInfo(points);
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const stats: Stats = { gamesWon, played: gamesPlayed, favs: favorites.length, points };

  const recentGames = useMemo(
    () => recent.map(getGame).filter(Boolean).slice(0, 4) as typeof GAMES,
    [recent]
  );

  return (
    <div className="p-5 md:p-10 max-w-[1100px] mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-5 card p-6 mb-5">
        <div className="w-[88px] h-[88px] rounded-[24px] grid place-items-center text-white font-bold text-[32px] shadow-[0_10px_24px_rgba(255,90,60,0.32)]" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>
          {p1Name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[25px] font-bold tracking-tight">{p1Name}</h1>
            <span className="px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-[#FDEBD3] text-[#B8770E]">{tier.title} · Lv {tier.level}</span>
          </div>
          <div className="flex items-center gap-3 max-w-[360px] mt-3">
            <div className="flex-1 h-2 rounded-md bg-line overflow-hidden">
              <div className="h-full rounded-md" style={{ width: `${tier.pct}%`, background: 'linear-gradient(90deg,#FF5A3C,#FB7E50)' }} />
            </div>
            <span className="text-[12.5px] text-ink-faint font-bold whitespace-nowrap">{tier.into} / {tier.span} XP</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat value={gamesPlayed} label="Games played" />
        <Stat value={gamesWon} label="Wins" />
        <Stat value={`${winRate}%`} label="Win rate" accent="#1F9D72" />
        <Stat value={favorites.length} label="Favorites" />
      </div>

      <h3 className="mb-4 text-xl font-bold tracking-tight">Achievements</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ACHIEVEMENTS.map((a) => {
          const earned = a.need(stats);
          return (
            <div key={a.name} className={`flex items-center gap-3.5 rounded-2xl p-4 ${earned ? 'card' : 'bg-line-soft border border-dashed border-line opacity-70'}`}>
              <div className="w-[46px] h-[46px] rounded-[13px] grid place-items-center shrink-0" style={{ background: earned ? a.grad : '#E4DCD0' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: earned ? '#fff' : '#A89E92' }}><path d={a.glyph} /></svg>
              </div>
              <div>
                <div className={`font-bold text-[14.5px] ${earned ? '' : 'text-ink-soft'}`}>{a.name}</div>
                <div className="text-[12.5px] text-ink-faint">{a.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {recentGames.length > 0 && (
        <>
          <h3 className="mb-4 text-xl font-bold tracking-tight">Recently played</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentGames.map((g) => (
              <GameTile key={g.id} game={g} showProgress />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: number | string; label: string; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="text-[30px] font-bold tracking-tight" style={accent ? { color: accent } : undefined}>{value}</div>
      <div className="text-[13px] text-ink-faint font-semibold mt-0.5">{label}</div>
    </div>
  );
}
