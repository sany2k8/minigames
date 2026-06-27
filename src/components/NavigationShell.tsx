import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PointsBadge } from './PointsBadge';
import { SettingsDrawer } from './SettingsDrawer';
import { levelInfo, useApp } from '../store/store';

/* Inline icon set matching the Pulse design */
const icons = {
  home: (
    <><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9.5 20v-6h5v6" /></>
  ),
  browse: (
    <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>
  ),
  favorites: (
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
  ),
  leaderboard: (
    <><path d="M7 21V9" /><path d="M12 21V4" /><path d="M17 21v-7" /><path d="M4 21h16" /></>
  ),
  profile: (
    <><circle cx="12" cy="8" r="4" /><path d="M5 21v-1a7 7 0 0 1 14 0v1" /></>
  )
} as const;

function NavIcon({ name }: { name: keyof typeof icons }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

const NAV: { to: string; icon: keyof typeof icons; label: string }[] = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/games', icon: 'browse', label: 'Browse' },
  { to: '/favorites', icon: 'favorites', label: 'Favorites' },
  { to: '/leaderboards', icon: 'leaderboard', label: 'Leaderboard' },
  { to: '/profile', icon: 'profile', label: 'Profile' }
];

export function NavigationShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const points = useApp((s) => s.points);
  const favCount = useApp((s) => s.favorites.length);
  const tier = levelInfo(points);

  return (
    <div className="flex h-dvh bg-app-bg text-ink overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-[250px] shrink-0 bg-card border-r border-line p-[16px] pt-[22px]">
        <div className="flex items-center gap-3 px-1.5 pb-1 mb-6">
          <div className="w-9 h-9 rounded-[11px] grid place-items-center shadow-[0_6px_14px_rgba(255,90,60,0.35)]" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M7 5l12 7-12 7z" /></svg>
          </div>
          <span className="text-[19px] font-bold tracking-tight">Miniplay</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-[11px] text-[14.5px] transition-colors ${
                  isActive
                    ? 'bg-coral-soft text-coral-ink font-bold'
                    : 'text-ink-soft font-semibold hover:bg-line-soft'
                }`
              }
            >
              <NavIcon name={n.icon} />
              <span className="flex-1">{n.label}</span>
              {n.icon === 'favorites' && favCount > 0 && (
                <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-coral text-white text-[11px] font-bold">
                  {favCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* XP card */}
        <div className="rounded-2xl border border-line p-4" style={{ background: 'linear-gradient(160deg,#FFFDFB,#FFF3EE)' }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[30px] h-[30px] rounded-[9px] grid place-items-center text-white font-bold text-[13px]" style={{ background: 'linear-gradient(135deg,#F59E0B,#FB923C)' }}>
              {tier.level}
            </div>
            <div className="leading-tight">
              <div className="font-bold text-[13.5px]">{tier.title}</div>
              <div className="text-[11.5px] text-ink-faint">{tier.into} / {tier.span} XP</div>
            </div>
          </div>
          <div className="h-[7px] rounded-md bg-line overflow-hidden">
            <div className="h-full rounded-md" style={{ width: `${tier.pct}%`, background: 'linear-gradient(90deg,#FF5A3C,#FB7E50)' }} />
          </div>
          <div className="text-[11.5px] text-ink-faint mt-2">{Math.max(0, tier.span - tier.into)} XP to next level</div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 shrink-0 flex items-center gap-4 px-4 md:px-8 border-b border-line bg-card/85 backdrop-blur-md z-10">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-[9px] grid place-items-center shadow-[0_4px_10px_rgba(255,90,60,0.35)]" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M7 5l12 7-12 7z" /></svg>
            </div>
            <span className="text-base font-bold tracking-tight">Miniplay</span>
          </div>

          <NavLink to="/games" className="relative flex-1 max-w-[440px] hidden sm:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint text-xl">search</span>
            <div className="w-full h-10 rounded-[11px] border border-line bg-app-bg pl-10 pr-4 flex items-center text-[14px] text-ink-faint">
              Search games, categories…
            </div>
          </NavLink>

          <div className="flex-1" />

          <PointsBadge />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            aria-haspopup="dialog"
            aria-expanded={settingsOpen}
            className="w-10 h-10 rounded-[11px] border border-line bg-card grid place-items-center text-ink-soft hover:bg-line-soft transition-colors"
          >
            <span className="material-symbols-outlined text-xl">tune</span>
          </button>
          <NavLink
            to="/profile"
            aria-label="Profile"
            className="w-10 h-10 rounded-full grid place-items-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}
          >
            P1
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-line z-50 px-2">
        <div className="flex justify-around items-center h-16">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full transition-colors ${
                  isActive ? 'text-coral' : 'text-ink-faint'
                }`
              }
            >
              <NavIcon name={n.icon} />
              <span className="text-[10px] font-semibold mt-0.5">{n.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
