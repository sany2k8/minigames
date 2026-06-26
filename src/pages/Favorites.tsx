import { useMemo } from 'react';
import { GAMES, getGame } from '../games/registry';
import { GameTile } from '../components/GameTile';
import { useApp } from '../store/store';

export function Favorites() {
  const favorites = useApp((s) => s.favorites);
  
  const favGames = useMemo(
    () => favorites.map(getGame).filter(Boolean) as typeof GAMES,
    [favorites]
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-yellow-400 text-4xl">star</span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
          Favorites
        </h1>
      </div>

      {favGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel">
          <span className="material-symbols-outlined text-6xl text-dark-border mb-4">star_outline</span>
          <p className="text-gray-400 text-lg">You haven't favorited any games yet.</p>
          <p className="text-gray-500 mt-2">Open a game and tap <span className="text-yellow-300 font-medium">Favorite</span> to add it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {favGames.map((g) => (
            <GameTile key={g.id} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
