import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { GameDefinition } from '../engine/types';
import { CATEGORY_LABELS } from '../engine/types';
import { useApp } from '../store/store';

const CONTEST_LABEL: Record<string, string> = {
  race: 'Race',
  score: 'Score',
  table: '2–4P'
};

export function GameTile({ game, showProgress }: { game: GameDefinition; showProgress?: boolean }) {
  const nav = useNavigate();
  const best = useApp((s) => s.highScores[game.id]);
  const Icon = game.icon;
  const open = () => nav(`/game/${game.id}`);

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={game.title}
      className="relative w-full text-left glass-panel p-4 flex flex-col gap-3 group cursor-pointer transition-all duration-300 hover:neon-border-blue hover:shadow-[0_0_18px_rgba(0,243,255,0.18)]"
      onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
    >
      {/* Game art */}
      <div
        className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg ring-1 ring-white/10"
        style={{ background: `linear-gradient(135deg, ${game.accent}, ${game.accent2})` }}
      >
        <Icon />
      </div>

      {/* Title */}
      <h3 className="text-base md:text-lg font-display font-bold text-white leading-snug group-hover:text-neon-blue transition-colors line-clamp-2">
        {game.title}
      </h3>

      {/* Footer: category + mode + (optional) best score.
          Category text is kept neutral/bright (the accent is only a dot) so it
          stays readable regardless of how dark a game's accent colour is. */}
      <div className="mt-auto flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-gray-200">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: game.accent }} />
          {CATEGORY_LABELS[game.category]}
        </span>

        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wide rounded bg-dark-bg/60 border border-dark-border text-gray-200">
          {CONTEST_LABEL[game.contest]}
        </span>

        {showProgress && best != null && (
          <span className="ml-auto text-xs font-semibold text-brand-secondary">
            Best {best.toLocaleString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}
