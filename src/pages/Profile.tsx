import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, getGame } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { AuthModal } from '../components/AuthModal';
import { useAuth } from '../lib/auth';
import { levelInfo, useApp } from '../store/store';
import { ACHIEVEMENTS } from '../lib/achievements';
import { avatarById } from '../lib/cosmetics';
import { StatsDashboard } from '../components/StatsDashboard';

export function Profile() {
  const nav = useNavigate();
  const { points, gamesWon, gamesPlayed, recent, p1Name, unlocked, dailyBest, coins, avatar } = useApp();
  const tier = levelInfo(points);
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const earnedCount = unlocked.length;
  const avatarEmoji = avatarById(avatar).emoji;

  const recentGames = useMemo(
    () => recent.map(getGame).filter(Boolean).slice(0, 4) as typeof GAMES,
    [recent]
  );

  return (
    <div className="p-5 md:p-10 max-w-[1100px] mx-auto w-full animate-fade-in">
      <AccountCard />
      <div className="flex items-center gap-5 card p-6 mb-5">
        <div className="w-[88px] h-[88px] rounded-[24px] grid place-items-center text-white font-bold text-[32px] shadow-[0_10px_24px_rgba(255,90,60,0.32)]" style={{ background: 'linear-gradient(135deg,var(--color-coral),var(--color-coral-2))' }}>
          {avatarEmoji || p1Name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[25px] font-bold tracking-tight">{p1Name}</h1>
            <span className="px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-[#FDEBD3] text-[#B8770E]">{tier.title} · Lv {tier.level}</span>
            <span className="px-2.5 py-1 rounded-md text-[11.5px] font-bold bg-[#FDEBD3] text-[#B8770E]">🪙 {coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3 max-w-[360px] mt-3">
            <div className="flex-1 h-2 rounded-md bg-line overflow-hidden">
              <div className="h-full rounded-md" style={{ width: `${tier.pct}%`, background: 'linear-gradient(90deg,#FF5A3C,#FB7E50)' }} />
            </div>
            <span className="text-[12.5px] text-ink-faint font-bold whitespace-nowrap">{tier.into} / {tier.span} XP</span>
          </div>
        </div>
      </div>

      <button onClick={() => nav('/shop')} className="w-full card p-4 mb-5 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
        <span className="w-10 h-10 rounded-xl grid place-items-center text-xl" style={{ background: 'linear-gradient(135deg,var(--color-coral),var(--color-coral-2))' }}>🎨</span>
        <span className="font-bold text-[15px] flex-1 text-left">Customize your look</span>
        <span className="material-symbols-outlined text-ink-faint">chevron_right</span>
      </button>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat value={gamesPlayed} label="Games played" />
        <Stat value={gamesWon} label="Wins" />
        <Stat value={`${winRate}%`} label="Win rate" accent="#1F9D72" />
        <Stat value={dailyBest} label="Best daily streak" accent="#F97316" />
      </div>

      <div className="mb-8">
        <StatsDashboard />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold tracking-tight">Achievements</h3>
        <span className="text-sm font-bold text-ink-faint">{earnedCount} / {ACHIEVEMENTS.length}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {ACHIEVEMENTS.map((a) => {
          const earned = unlocked.includes(a.id);
          return (
            <div key={a.id} className={`flex items-center gap-3.5 rounded-2xl p-4 ${earned ? 'card' : 'bg-line-soft border border-dashed border-line opacity-70'}`}>
              <div className="w-[46px] h-[46px] rounded-[13px] grid place-items-center shrink-0 text-2xl" style={{ background: earned ? a.grad : '#E4DCD0', filter: earned ? undefined : 'grayscale(1)' }}>
                {earned ? a.icon : '🔒'}
              </div>
              <div>
                <div className={`font-bold text-[14.5px] ${earned ? '' : 'text-ink-soft'}`}>{a.title}</div>
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

/** Account / sign-in card. Hidden entirely when Supabase isn't configured. */
function AccountCard() {
  const { enabled, loading, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!enabled) return null;

  const signedIn = Boolean(user);

  return (
    <div className="card p-5 mb-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-[13px] grid place-items-center shrink-0 text-white" style={{ background: signedIn ? 'linear-gradient(135deg,#1F9D72,#34D399)' : 'linear-gradient(135deg,#94A3B8,#CBD5E1)' }}>
        <span className="material-symbols-outlined">{signedIn ? 'cloud_done' : 'cloud_off'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[15px]">
          {loading ? 'Checking account…' : signedIn ? 'Signed in' : 'Playing as guest'}
        </div>
        <div className="text-[13px] text-ink-faint truncate">
          {signedIn
            ? user!.email
            : 'Sign in to sync scores across devices and join the global leaderboard.'}
        </div>
      </div>
      {!loading &&
        (signedIn ? (
          <button onClick={() => void signOut()} className="btn-soft shrink-0">Sign out</button>
        ) : (
          <button onClick={() => setOpen(true)} className="btn-coral shrink-0">Sign in</button>
        ))}

      <AuthModal open={open} onClose={() => setOpen(false)} />
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
