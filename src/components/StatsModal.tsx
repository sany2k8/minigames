import { AnimatePresence, motion } from 'framer-motion';
import { emptyStats, useApp, winPct } from '../store/store';

export function StatsModal({ gameId, title, open, onClose }: { gameId: string; title: string; open: boolean; onClose: () => void }) {
  const stats = useApp((s) => s.stats[gameId]) ?? emptyStats();
  const rows: [string, number | string][] = [
    ['Wins', stats.wins],
    ['Draws', stats.draws],
    ['Losses', stats.losses],
    ['Win percentage', `${winPct(stats)}%`],
    ['Current streak', stats.streak],
    ['Best streak', stats.best]
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center p-5 bg-[#26201A]/45 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-sm card p-6 text-center"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <div className="text-xs font-mono uppercase tracking-[0.15em] text-ink-faint">Statistics</div>
            <h2 className="text-2xl font-bold mt-1 mb-5">{title}</h2>

            <div className="rounded-2xl bg-line-soft divide-y divide-line overflow-hidden">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-ink-soft">{label}</span>
                  <span className="text-lg font-bold text-coral">{value}</span>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="btn-coral w-full mt-5 justify-center">OK</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
