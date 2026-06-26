import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { levelInfo, useApp } from '../store/store';
import type { Difficulty } from '../engine/types';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ${
        on ? 'bg-neon-blue shadow-[0_0_12px_rgba(0,243,255,0.5)]' : 'bg-dark-border'
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
          on ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="glass-panel p-5 space-y-5">
      <h3 className="text-base font-display font-bold flex items-center gap-2.5">
        <span className="material-symbols-outlined text-neon-blue text-xl">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="font-medium text-white text-sm">{label}</div>
        {desc && <div className="text-xs text-gray-400">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];

export function SettingsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    p1Name,
    p2Name,
    setNames,
    sound,
    setSound,
    haptics,
    setHaptics,
    difficulty,
    setDifficulty,
    points,
    gamesWon,
    resetProgress
  } = useApp();
  const [confirm, setConfirm] = useState(false);
  const tier = levelInfo(points);

  // Close on Escape; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          {/* Scrim */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel — slides in from the right */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Platform settings"
            className="absolute top-0 right-0 h-full w-full max-w-md bg-dark-surface border-l border-dark-border shadow-2xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center justify-between px-5 h-16 border-b border-dark-border shrink-0">
              <div>
                <h2 className="text-lg font-display font-black leading-none">Platform Settings</h2>
                <p className="text-xs text-gray-400 mt-1">Personalize your arcade</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close settings"
                className="w-9 h-9 grid place-items-center rounded-full bg-dark-bg/60 border border-dark-border text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <Card icon="person" title="Account">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-brand-secondary to-brand-primary flex items-center justify-center shadow-lg">
                    <span className="font-display font-black text-xl text-white">{tier.level}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold break-words">{p1Name}</div>
                    <div className="text-xs text-gray-400">
                      {tier.title} · {points.toLocaleString()} pts · {gamesWon} wins
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">Player 1</span>
                    <input
                      className="mt-1 w-full bg-dark-bg border-b-2 border-dark-border focus:border-neon-blue rounded-t-lg px-3 py-2.5 text-white outline-none transition-colors"
                      value={p1Name}
                      onChange={(e) => setNames(e.target.value || 'Player 1', p2Name)}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">Player 2</span>
                    <input
                      className="mt-1 w-full bg-dark-bg border-b-2 border-dark-border focus:border-brand-secondary rounded-t-lg px-3 py-2.5 text-white outline-none transition-colors"
                      value={p2Name}
                      onChange={(e) => setNames(p1Name, e.target.value || 'Player 2')}
                    />
                  </label>
                </div>
              </Card>

              <Card icon="tune" title="Gameplay">
                <Row label="Default bot difficulty" desc="Used when you start a vs-Bot match">
                  <div className="flex gap-2">
                    {DIFFS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          difficulty === d
                            ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/50'
                            : 'bg-dark-surface border-dark-border text-gray-400 hover:text-white'
                        }`}
                      >
                        {d[0].toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </Row>
              </Card>

              <Card icon="volume_up" title="Feedback">
                <Row label="Sound effects" desc="In-game audio cues">
                  <Toggle on={sound} onChange={setSound} />
                </Row>
                <Row label="Haptic vibration" desc="Tap feedback on supported devices">
                  <Toggle on={haptics} onChange={setHaptics} />
                </Row>
              </Card>

              <Card icon="shield" title="Privacy & Data">
                <Row label="Local storage" desc="Saved on this device only — never uploaded.">
                  <span className="text-[11px] font-mono text-brand-secondary px-3 py-1 rounded-full bg-brand-secondary/15">
                    OFFLINE
                  </span>
                </Row>
                {!confirm ? (
                  <button
                    onClick={() => setConfirm(true)}
                    className="px-5 py-2.5 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium transition-colors text-sm"
                  >
                    Reset all progress
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-300">Erase points, scores, favorites & history?</span>
                    <button
                      onClick={() => {
                        resetProgress();
                        setConfirm(false);
                        onClose();
                      }}
                      className="px-5 py-2.5 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm"
                    >
                      Yes, reset
                    </button>
                    <button onClick={() => setConfirm(false)} className="btn-secondary py-2.5 text-sm">
                      Cancel
                    </button>
                  </div>
                )}
              </Card>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
