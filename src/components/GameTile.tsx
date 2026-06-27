import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { GameDefinition } from '../engine/types';
import { CATEGORY_LABELS } from '../engine/types';
import { useApp } from '../store/store';

const CONTEST_LABEL: Record<string, string> = {
  race: 'RACE',
  score: 'SCORE',
  table: '2-4P'
};

export function GameTile({ game, showProgress }: { game: GameDefinition; showProgress?: boolean }) {
  const nav = useNavigate();
  const fav = useApp((s) => s.favorites.includes(game.id));
  const best = useApp((s) => s.highScores[game.id]);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const Icon = game.icon;
  const open = () => nav(`/game/${game.id}`);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={game.title}
      onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
      className="group relative flex flex-col gap-3.5 min-h-[162px] bg-card border border-line rounded-[18px] p-4 cursor-pointer shadow-[0_1px_2px_rgba(20,20,40,0.04)] hover:shadow-[0_18px_36px_rgba(30,27,75,0.13)] hover:border-[#E6D9C9] transition-[box-shadow,border-color]"
    >
      {/* Icon + favorite */}
      <div className="flex items-start justify-between">
        <div
          className="w-[52px] h-[52px] rounded-[15px] grid place-items-center text-white shadow-[0_4px_10px_rgba(20,20,40,0.12)] group-hover:shadow-[0_10px_20px_rgba(20,20,40,0.20)] transition-all group-hover:-rotate-2 group-hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${game.accent}, ${game.accent2})` }}
        >
          <Icon />
        </div>
        <button
          type="button"
          aria-pressed={fav}
          aria-label={fav ? `Remove ${game.title} from favorites` : `Add ${game.title} to favorites`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(game.id);
          }}
          className={`w-[34px] h-[34px] rounded-[10px] grid place-items-center border transition-colors ${
            fav
              ? 'bg-[#FFF1F2] border-[#FECDD3] text-[#F43F5E]'
              : 'bg-card border-line text-ink-faint hover:text-[#F43F5E] hover:border-[#FECDD3]'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? '#F43F5E' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
        </button>
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[16px] tracking-tight truncate">{game.title}</div>
        <div className="flex items-center gap-2 mt-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-line-soft text-ink-soft text-[12px] font-semibold">
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: game.accent }} />
            {CATEGORY_LABELS[game.category]}
          </span>
          <span className="font-mono text-[10px] tracking-wider font-semibold text-ink-faint border border-line px-1.5 py-1 rounded-md">
            {CONTEST_LABEL[game.contest]}
          </span>
        </div>
      </div>

      {/* Footer: best score + play */}
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-semibold text-ink-faint">
          {showProgress && best != null ? `Best ${best.toLocaleString()}` : ''}
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] bg-coral text-white font-bold text-[12.5px] opacity-100 md:opacity-0 md:translate-y-1.5 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5l12 7-12 7z" /></svg>
          Play
        </span>
      </div>
    </motion.div>
  );
}
