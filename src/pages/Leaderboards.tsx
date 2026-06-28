import { useEffect, useState } from 'react';
import { GAMES } from '../games/registry';
import { levelInfo, useApp } from '../store/store';
import { fetchGlobalLeaderboard, isCloudEnabled } from '../lib/cloud';
import type { GlobalLeaderboardRow } from '../lib/database.types';

const TIER_CHIP: Record<string, string> = {
  Bronze: 'bg-[#FDEBD3] text-[#B8770E]',
  Silver: 'bg-[#F1F5F9] text-[#64748B]',
  Gold: 'bg-[#FEF3C7] text-[#B45309]',
  Platinum: 'bg-[#EDE9FE] text-[#7C3AED]',
  Diamond: 'bg-[#E0F2FE] text-[#0284C7]'
};

export function Leaderboards() {
  const highScores = useApp((s) => s.highScores);
  const points = useApp((s) => s.points);
  const gamesWon = useApp((s) => s.gamesWon);
  const p1Name = useApp((s) => s.p1Name);
  const tier = levelInfo(points);

  // Local "personal bests" vs cloud "global" ranking. The Global tab only
  // exists when Supabase is configured; otherwise the page is unchanged.
  const [tab, setTab] = useState<'you' | 'global'>('you');

  const ranked = GAMES.filter((g) => highScores[g.id] !== undefined).sort(
    (a, b) => (highScores[b.id] || 0) - (highScores[a.id] || 0)
  );

  return (
    <div className="p-5 md:p-10 max-w-[880px] mx-auto w-full animate-fade-in">
      <h1 className="text-[30px] font-bold tracking-tight">Leaderboard</h1>
      <p className="mt-1.5 mb-6 text-[14.5px] text-ink-soft">
        {tab === 'global' ? 'Top players worldwide' : 'Your personal best scores'}
      </p>

      {/* Your stats banner */}
      <div className="relative overflow-hidden rounded-[20px] px-6 py-5 flex items-center gap-5 text-white mb-7 shadow-[0_14px_30px_rgba(255,90,60,0.25)]" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>
        <div className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-white/[0.12]" />
        <div className="w-[54px] h-[54px] rounded-[14px] bg-white/20 grid place-items-center font-bold text-lg z-10">{tier.level}</div>
        <div className="z-10">
          <div className="text-[12.5px] opacity-85 font-bold tracking-wide">YOUR TIER</div>
          <div className="text-[26px] font-bold tracking-tight">{tier.title} <span className="text-[15px] opacity-85 font-semibold">· {gamesWon} wins</span></div>
        </div>
        <div className="ml-auto text-right z-10">
          <div className="text-[12.5px] opacity-85 font-bold">POINTS</div>
          <div className="text-[24px] font-bold">{points.toLocaleString()}</div>
        </div>
      </div>

      {/* Tab switch — only when cloud sync is available */}
      {isCloudEnabled && (
        <div className="inline-flex p-1 rounded-[12px] bg-line-soft mb-6">
          {(['you', 'global'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-[9px] text-[13.5px] font-bold transition ${
                tab === t ? 'bg-card text-ink shadow-sm' : 'text-ink-faint'
              }`}
            >
              {t === 'you' ? 'My scores' : 'Global'}
            </button>
          ))}
        </div>
      )}

      {tab === 'global' ? (
        <GlobalBoard />
      ) : ranked.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="w-16 h-16 rounded-[18px] bg-line-soft grid place-items-center mx-auto mb-4 text-ink-faint">
            <span className="material-symbols-outlined text-3xl">emoji_events</span>
          </div>
          <h3 className="text-lg font-bold">No high scores yet</h3>
          <p className="mt-1.5 text-ink-faint text-sm">Play some games to start ranking up!</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[54px_1fr_110px] px-5 py-3.5 text-[12px] font-bold text-ink-faint tracking-wide border-b border-line">
            <span>RANK</span><span>GAME</span><span className="text-right">BEST</span>
          </div>
          {ranked.map((game, i) => {
            const Icon = game.icon;
            const top = i < 3;
            return (
              <div key={game.id} className="grid grid-cols-[54px_1fr_110px] items-center px-5 py-3 border-b border-line-soft last:border-0">
                <span className={`font-bold text-[15px] ${top ? 'text-coral' : 'text-ink-faint'}`}>#{i + 1}</span>
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-[38px] h-[38px] rounded-[11px] grid place-items-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${game.accent}, ${game.accent2})` }}>
                    <Icon />
                  </span>
                  <span className="font-bold text-[14.5px] truncate">{game.title}</span>
                </span>
                <span className="text-right font-mono font-bold text-[15px] text-ink">{highScores[game.id]?.toLocaleString()}</span>
              </div>
            );
          })}
          <div className="px-5 py-2.5 text-[12px] font-bold text-ink-faint tracking-wide bg-line-soft border-t border-line">YOU</div>
          <div className="grid grid-cols-[54px_1fr_110px] items-center px-5 py-3.5 bg-coral-soft">
            <span className="font-bold text-[15px] text-coral-ink">★</span>
            <span className="flex items-center gap-3">
              <span className="w-[38px] h-[38px] rounded-[11px] grid place-items-center text-white font-bold text-[13px]" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>{tier.level}</span>
              <span className="font-bold text-[14.5px]">{p1Name} <span className="text-[11px] text-coral-ink font-bold">(you)</span></span>
            </span>
            <span className="text-right"><span className={`inline-block px-2.5 py-1 rounded-md text-[11.5px] font-bold ${TIER_CHIP[tier.title] || TIER_CHIP.Bronze}`}>{tier.title}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Cloud-backed worldwide ranking by points. */
function GlobalBoard() {
  const [rows, setRows] = useState<GlobalLeaderboardRow[] | null>(null);

  useEffect(() => {
    let live = true;
    fetchGlobalLeaderboard(50).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, []);

  if (rows === null) {
    return (
      <div className="text-center py-16 card text-ink-faint">
        <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
        <p className="mt-3 text-sm font-semibold">Loading global ranking…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 card">
        <div className="w-16 h-16 rounded-[18px] bg-line-soft grid place-items-center mx-auto mb-4 text-ink-faint">
          <span className="material-symbols-outlined text-3xl">public</span>
        </div>
        <h3 className="text-lg font-bold">No players yet</h3>
        <p className="mt-1.5 text-ink-faint text-sm">Be the first to land on the global board — win some games while online!</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[54px_1fr_90px_90px] px-5 py-3.5 text-[12px] font-bold text-ink-faint tracking-wide border-b border-line">
        <span>RANK</span><span>PLAYER</span><span className="text-right">TIER</span><span className="text-right">POINTS</span>
      </div>
      {rows.map((r) => {
        const top = r.rank <= 3;
        return (
          <div key={r.user_id} className="grid grid-cols-[54px_1fr_90px_90px] items-center px-5 py-3 border-b border-line-soft last:border-0">
            <span className={`font-bold text-[15px] ${top ? 'text-coral' : 'text-ink-faint'}`}>#{r.rank}</span>
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-[34px] h-[34px] rounded-[10px] grid place-items-center text-white font-bold text-[13px] shrink-0" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>{r.level}</span>
              <span className="font-bold text-[14.5px] truncate">{r.display_name}</span>
            </span>
            <span className="text-right">
              <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${TIER_CHIP[r.tier] || TIER_CHIP.Bronze}`}>{r.tier}</span>
            </span>
            <span className="text-right font-mono font-bold text-[15px] text-ink">{r.points.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
