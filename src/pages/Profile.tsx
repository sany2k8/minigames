import { useNavigate } from 'react-router-dom';
import { GAMES, getGame } from '../games/registry';
import { CATEGORY_LABELS } from '../engine/types';
import { levelInfo, useApp } from '../store/store';

const HEX = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';

// Full literal classes so Tailwind's scanner picks them up (no interpolation).
const BADGE: Record<string, { box: string; icon: string }> = {
  blue: { box: 'bg-neon-blue/20 border border-neon-blue/40', icon: 'text-neon-blue' },
  pink: { box: 'bg-neon-pink/20 border border-neon-pink/40', icon: 'text-neon-pink' },
  green: { box: 'bg-brand-secondary/20 border border-brand-secondary/40', icon: 'text-brand-secondary' },
  purple: { box: 'bg-neon-purple/20 border border-neon-purple/40', icon: 'text-neon-purple' }
};

export function Profile() {
  const nav = useNavigate();
  const { p1Name, points, gamesWon, gamesPlayed, favorites, recent, highScores } = useApp();
  const tier = levelInfo(points);
  const initials = p1Name.trim().slice(0, 2).toUpperCase() || 'P1';
  const recentGames = recent.map(getGame).filter(Boolean) as typeof GAMES;

  const achievements = [
    { icon: 'rocket_launch', label: 'Getting Started', got: gamesPlayed >= 1, c: 'blue' },
    { icon: 'stars', label: 'First Win', got: gamesWon >= 1, c: 'pink' },
    { icon: 'workspace_premium', label: 'Rising Star', got: points >= 200, c: 'green' },
    { icon: 'favorite', label: 'Collector', got: favorites.length >= 5, c: 'pink' },
    { icon: 'bolt', label: 'On Fire', got: gamesWon >= 10, c: 'blue' },
    { icon: 'military_tech', label: 'Veteran', got: gamesPlayed >= 25, c: 'green' },
    { icon: 'trophy', label: 'Champion', got: points >= 1000, c: 'purple' },
    { icon: 'diamond', label: 'Legend', got: points >= 3000, c: 'blue' },
    { icon: 'public', label: 'Explorer', got: recent.length >= 8, c: 'green' },
    { icon: 'local_fire_department', label: 'Unstoppable', got: gamesWon >= 25, c: 'pink' }
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none fixed top-[-10%] right-[-10%] w-[480px] h-[480px] bg-neon-blue/10 blur-[120px] rounded-full -z-10" />
      <div className="pointer-events-none fixed bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-neon-pink/10 blur-[110px] rounded-full -z-10" />

      <div className="max-w-[1100px] mx-auto px-5 md:px-10 py-8 md:py-12 space-y-10 animate-fade-in pb-28">
        {/* Hero */}
        <section className="flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-neon-blue/25 blur-2xl rounded-full scale-110" />
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-neon-blue p-1 bg-dark-surface shadow-[0_0_30px_rgba(0,243,255,0.35)]">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-primary via-neon-purple to-neon-pink grid place-items-center">
                <span className="font-display font-black text-4xl text-white drop-shadow">{initials}</span>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-neon-blue text-dark-bg px-3 py-1 rounded-full font-mono text-xs font-bold shadow-lg border-2 border-dark-bg">
              LVL {tier.level}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            <div className="inline-flex items-center gap-2 bg-neon-pink/15 text-neon-pink border border-neon-pink/30 px-3 py-1 rounded-full mb-3">
              <span className="material-symbols-outlined text-base">military_tech</span>
              <span className="font-mono text-[10px] uppercase tracking-widest">{tier.title} Rank</span>
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl text-white uppercase tracking-tight mb-2 break-words">
              {p1Name}
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto md:mx-0">
              Offline arcade explorer. Conquering {gamesPlayed} matches and counting — all saved right here on
              your device.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-neon-blue">
            <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mb-1">Total XP</p>
            <p className="font-display font-black text-3xl neon-text-blue">{points.toLocaleString()}</p>
            <div className="w-full h-1.5 bg-dark-bg mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-neon-blue shadow-[0_0_10px_#00f3ff] transition-all" style={{ width: `${tier.pct}%` }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase">{tier.pct}% to next level</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-neon-pink">
            <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mb-1">Games Won</p>
            <p className="font-display font-black text-3xl text-neon-pink">{gamesWon}</p>
            <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase">
              {gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0}% win rate
            </p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-brand-secondary">
            <p className="font-mono text-[11px] uppercase tracking-widest text-gray-400 mb-1">Matches Played</p>
            <p className="font-display font-black text-3xl text-brand-secondary">{gamesPlayed}</p>
            <p className="text-[10px] text-gray-400 mt-2 font-mono uppercase">{favorites.length} favorites</p>
          </div>
        </section>

        {/* Achievements + Recently Played */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7">
            <h2 className="font-display font-bold text-2xl uppercase tracking-tight mb-4">Achievements</h2>
            <div className="glass-panel p-6 md:p-8 rounded-2xl">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-5">
                {achievements.map((a) => {
                  const s = BADGE[a.c];
                  return (
                    <div key={a.label} className={`flex flex-col items-center gap-2 ${a.got ? '' : 'opacity-40'}`}>
                      <div
                        className={`w-14 h-14 grid place-items-center transition-transform hover:scale-110 ${
                          a.got ? s.box : 'bg-white/5 border border-white/10'
                        }`}
                        style={{ clipPath: HEX }}
                      >
                        <span
                          className={`material-symbols-outlined text-2xl ${a.got ? s.icon : 'text-white/30'}`}
                          style={a.got ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {a.got ? a.icon : 'lock'}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-center opacity-70 leading-tight">{a.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="lg:col-span-5">
            <h2 className="font-display font-bold text-2xl uppercase tracking-tight mb-4">Recently Played</h2>
            {recentGames.length === 0 ? (
              <div className="glass-panel p-8 rounded-2xl text-center text-gray-400">
                <span className="material-symbols-outlined text-4xl block mb-2 text-dark-border">history</span>
                No games played yet — jump in!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentGames.slice(0, 5).map((g) => {
                  const Icon = g.icon;
                  return (
                    <button
                      key={g.id}
                      onClick={() => nav(`/game/${g.id}`)}
                      className="glass-panel p-3 rounded-xl flex items-center gap-4 text-left hover:border-neon-blue/40 hover:-translate-y-0.5 transition-all group"
                    >
                      <div
                        className="w-12 h-12 rounded-lg grid place-items-center shrink-0 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${g.accent}, ${g.accent2})` }}
                      >
                        <Icon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white group-hover:text-neon-blue transition-colors truncate">
                          {g.title}
                        </h4>
                        <p className="text-[10px] font-mono uppercase text-gray-400">{CATEGORY_LABELS[g.category]}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {highScores[g.id] != null ? (
                          <p className="font-mono text-neon-blue text-sm">{highScores[g.id].toLocaleString()}</p>
                        ) : (
                          <span className="material-symbols-outlined text-neon-blue/70">play_circle</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
