import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/store';
import { achievementById } from '../lib/achievements';
import { sound } from '../lib/sound';

/**
 * Listens for freshly-earned achievements (store.recentUnlocks) and pops a
 * celebratory toast for each, auto-dismissing after a few seconds. Mounted once
 * at the app root so it shows on any screen.
 */
export function AchievementToast() {
  const recent = useApp((s) => s.recentUnlocks);
  const clear = useApp((s) => s.clearRecentUnlocks);

  useEffect(() => {
    if (recent.length === 0) return;
    sound.coin();
    const t = setTimeout(clear, 4200);
    return () => clearTimeout(t);
  }, [recent, clear]);

  const items = recent.map(achievementById).filter(Boolean);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {items.map((a) => (
          <motion.div
            key={a!.id}
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="flex items-center gap-3 rounded-2xl bg-card border border-line shadow-[0_12px_30px_rgba(20,20,40,0.18)] pl-3 pr-5 py-3"
          >
            <div className="w-11 h-11 rounded-xl grid place-items-center text-2xl shrink-0" style={{ background: a!.grad }}>
              {a!.icon}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-coral-ink">Achievement unlocked</div>
              <div className="font-bold text-[15px] leading-tight">{a!.title}</div>
              <div className="text-xs text-ink-faint">{a!.desc}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
