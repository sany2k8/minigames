import { motion } from 'framer-motion';
import { levelInfo, useApp } from '../store/store';

export function PointsBadge() {
  const points = useApp((s) => s.points);
  const info = levelInfo(points);
  return (
    <motion.div
      className="flex items-center gap-3 bg-dark-surface border border-dark-border rounded-xl p-2 pr-4 shadow-sm"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      key={info.level}
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-secondary to-brand-primary flex items-center justify-center shadow-inner">
        <span className="font-display font-black text-white text-lg">{info.level}</span>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between gap-4 mb-1">
          <span className="text-sm font-bold text-white tracking-wide">{info.title}</span>
          <span className="text-xs font-mono text-brand-secondary">★ {points.toLocaleString()}</span>
        </div>
        <div className="w-full h-1.5 bg-dark-bg rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full" 
            initial={{ width: 0 }}
            animate={{ width: `${info.pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
