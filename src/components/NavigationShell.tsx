import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { PointsBadge } from './PointsBadge';
import { SettingsDrawer } from './SettingsDrawer';

export function NavigationShell() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navLinks = [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/games', icon: 'search', label: 'Browse' },
    { to: '/favorites', icon: 'favorite', label: 'Favorites' },
    { to: '/leaderboards', icon: 'leaderboard', label: 'Leaderboard' },
    { to: '/profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <div className="flex h-dvh bg-dark-bg text-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-surface border-r border-dark-border h-full shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-brand-primary">
            NEON ARCADE
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-dark-bg text-neon-blue border-l-4 border-neon-blue shadow-[inset_0_0_10px_rgba(0,243,255,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-dark-surface-hover'
                }`
              }
            >
              <span className="material-symbols-outlined text-2xl">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md z-10 shrink-0">
          <div className="md:hidden">
             <h1 className="text-xl font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-brand-primary">
               NEON ARCADE
             </h1>
          </div>
          <div className="hidden md:block" /> {/* spacer */}

          <div className="flex items-center gap-3">
             <PointsBadge />
             <button
               type="button"
               onClick={() => setSettingsOpen(true)}
               aria-label="Settings"
               aria-haspopup="dialog"
               aria-expanded={settingsOpen}
               className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                 settingsOpen
                   ? 'bg-neon-blue/15 border-neon-blue/50 text-neon-blue'
                   : 'bg-dark-surface-hover border-dark-border text-gray-400 hover:text-white'
               }`}
             >
                <span className="material-symbols-outlined">settings</span>
             </button>
             <NavLink to="/profile" aria-label="Profile" className="w-10 h-10 rounded-full bg-dark-surface-hover border border-dark-border flex items-center justify-center hover:bg-dark-border transition-colors">
                <span className="material-symbols-outlined text-gray-400 hover:text-white">person</span>
             </NavLink>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 h-full w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-surface/90 backdrop-blur-md border-t border-dark-border z-50 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full transition-colors ${
                  isActive ? 'text-neon-blue' : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <span className="material-symbols-outlined text-2xl">{link.icon}</span>
              <span className="text-[10px] font-medium mt-0.5">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
