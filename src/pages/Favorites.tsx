import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES, getGame } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { useApp } from '../store/store';

export function Favorites() {
  const nav = useNavigate();
  const favorites = useApp((s) => s.favorites);

  const favGames = useMemo(
    () => favorites.map(getGame).filter(Boolean) as typeof GAMES,
    [favorites]
  );

  return (
    <div className="p-5 md:p-10 max-w-[1180px] mx-auto w-full animate-fade-in">
      <h1 className="text-[30px] font-bold tracking-tight">Favorites</h1>
      <p className="mt-1.5 mb-6 text-[14.5px] text-ink-soft">
        {favGames.length === 0 ? 'No games saved yet' : `${favGames.length} game${favGames.length > 1 ? 's' : ''} saved`}
      </p>

      {favGames.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favGames.map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 card">
          <div className="w-[72px] h-[72px] rounded-[20px] bg-[#FFF1F2] grid place-items-center mx-auto mb-4 text-[#F43F5E]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          </div>
          <h3 className="text-xl font-bold">No favorites yet</h3>
          <p className="mt-2 mb-5 text-ink-faint text-[14.5px]">Tap the heart on any game to save it here.</p>
          <button onClick={() => nav('/games')} className="btn-coral mx-auto">Browse games</button>
        </div>
      )}
    </div>
  );
}
