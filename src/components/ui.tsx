import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export function TopBar({
  title,
  onBack,
  right
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <div className="flex items-center justify-between h-16 px-4 md:px-8 border-b border-dark-border bg-dark-surface/80 backdrop-blur-md z-20 sticky top-0 shrink-0">
      <button 
        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-dark-surface-hover text-gray-400 hover:text-white transition-colors" 
        onClick={onBack ?? (() => nav(-1))} 
        aria-label="Back"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>
      <h1 className="text-lg md:text-xl font-display font-bold text-white truncate max-w-[200px] md:max-w-md absolute left-1/2 -translate-x-1/2">
        {title}
      </h1>
      <div className="flex items-center">
        {right || <div className="w-10" />}
      </div>
    </div>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2 bg-dark-surface border border-dark-border rounded-full overflow-hidden">
      <motion.div 
        className="h-full rounded-full" 
        style={{ background: color }} 
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

export function ResultModal({
  title,
  subtitle,
  emoji = '🏆',
  points = 0,
  onRematch,
  onHome,
  onShare,
  shareLabel = 'Challenge a friend'
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  points?: number;
  onRematch: () => void;
  onHome: () => void;
  /** When provided, shows a "Challenge a friend" button. */
  onShare?: () => void;
  shareLabel?: string;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-bg/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-sm glass-panel p-8 text-center flex flex-col items-center border border-dark-border shadow-2xl"
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <motion.div
          className="text-7xl mb-6 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
        >
          {emoji}
        </motion.div>
        <h2 className="text-3xl font-display font-black text-white mb-2">{title}</h2>
        {subtitle && <div className="text-gray-400 mb-6">{subtitle}</div>}
        
        {points > 0 && (
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-secondary/20 border border-brand-secondary/50 text-brand-secondary font-bold text-lg mb-8"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.25 }}
          >
            +{points} points <span className="material-symbols-outlined text-sm">stars</span>
          </motion.div>
        )}
        
        <div className="flex w-full gap-4 mt-2">
          <button className="flex-1 btn-secondary py-3" onClick={onHome}>
            Home
          </button>
          <button className="flex-1 btn-primary py-3" onClick={onRematch}>
            Rematch
          </button>
        </div>
        {onShare && (
          <button
            className="mt-3 w-full py-3 rounded-xl border border-dark-border text-gray-200 hover:bg-dark-surface-hover transition-colors flex items-center justify-center gap-2 font-bold"
            onClick={onShare}
          >
            <span className="material-symbols-outlined text-xl">ios_share</span>
            {shareLabel}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
