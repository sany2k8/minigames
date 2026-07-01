import { useApp } from '../store/store';
import { weekKey, weeklyQuests, questProgress, type QuestCounters } from '../lib/quests';
import { sound } from '../lib/sound';

/**
 * Weekly quests panel for the Home page: three rotating missions with progress
 * bars and a one-tap points claim when complete.
 */
export function QuestsCard() {
  const s = useApp();
  const quests = weeklyQuests();
  const fresh = s.questWeek === weekKey(); // counters belong to this week?

  // Until the first action of the week rolls the counters, show zeros.
  const counters: QuestCounters = fresh
    ? { wins: s.qWins, plays: s.qPlays, distinct: s.qDistinct.length, daily: s.qDaily, bestScore: s.qBestScore }
    : { wins: 0, plays: 0, distinct: 0, daily: 0, bestScore: 0 };
  const claimed = fresh ? s.questClaimed : [];

  return (
    <div className="card p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold flex items-center gap-2">
          <span className="text-lg">🎯</span> Weekly Quests
        </h3>
        <span className="text-xs text-ink-faint font-semibold">Resets weekly</span>
      </div>
      <div className="space-y-3">
        {quests.map((q) => {
          const prog = Math.min(questProgress(q, counters), q.goal);
          const done = prog >= q.goal;
          const isClaimed = claimed.includes(q.id);
          const pct = Math.round((prog / q.goal) * 100);
          return (
            <div key={q.id} className="flex items-center gap-3">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-line-soft grid place-items-center text-xl">{q.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[14px] truncate">{q.title}</span>
                  <span className="text-[11px] font-bold text-ink-faint shrink-0">+{q.reward}</span>
                </div>
                <div className="text-xs text-ink-faint mb-1.5">{q.desc}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: done ? '#22C55E' : 'linear-gradient(90deg,#FF5A3C,#FB7E50)' }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-ink-faint shrink-0 w-10 text-right">
                    {prog}/{q.goal}
                  </span>
                </div>
              </div>
              {isClaimed ? (
                <span className="shrink-0 text-green-600 text-sm font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </span>
              ) : (
                <button
                  disabled={!done}
                  onClick={() => {
                    s.claimQuest(q.id, q.reward);
                    sound.coin();
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    done ? 'btn-coral' : 'bg-line-soft text-ink-faint cursor-not-allowed'
                  }`}
                >
                  {done ? 'Claim' : 'Locked'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
