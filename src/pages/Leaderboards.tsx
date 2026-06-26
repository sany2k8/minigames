import { GAMES } from '../games/registry';
import { useApp } from '../store/store';

export function Leaderboards() {
  const highScores = useApp((s) => s.highScores);

  const rankedGames = GAMES
    .filter(g => highScores[g.id] !== undefined)
    .sort((a, b) => (highScores[b.id] || 0) - (highScores[a.id] || 0));

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-neon-blue text-4xl">leaderboard</span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
          Leaderboards
        </h1>
      </div>

      {rankedGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel">
          <span className="material-symbols-outlined text-6xl text-dark-border mb-4">emoji_events</span>
          <p className="text-gray-400 text-lg">No high scores yet.</p>
          <p className="text-gray-500 mt-2">Play some games to start ranking up!</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-surface border-b border-dark-border text-gray-400 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Rank</th>
                  <th className="px-6 py-4 font-medium">Game</th>
                  <th className="px-6 py-4 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {rankedGames.map((game, index) => {
                  const score = highScores[game.id];
                  const Icon = game.icon;
                  return (
                    <tr key={game.id} className="hover:bg-dark-surface-hover/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${index === 0 ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 
                              index === 1 ? 'bg-gray-400/20 text-gray-400 border border-gray-400/50' : 
                              index === 2 ? 'bg-amber-600/20 text-amber-600 border border-amber-600/50' : 
                              'bg-dark-surface text-gray-500'}
                          `}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded bg-dark-bg flex items-center justify-center text-white"
                            style={{ background: `linear-gradient(135deg, ${game.accent}, ${game.accent2})` }}
                          >
                            <Icon />
                          </div>
                          <span className="font-medium text-white">{game.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-lg font-bold text-neon-blue">
                          {score?.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
