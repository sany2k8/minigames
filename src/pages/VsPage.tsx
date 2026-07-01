import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGame } from '../games/registry';
import { GameHost } from '../engine/GameHost';
import { decodeChallenge, shareChallenge } from '../lib/challenge';
import { useApp } from '../store/store';

/**
 * Incoming "challenge a friend" link (/vs/:code). Decodes the seed + target
 * score, lets you play the identical puzzle solo, then shows whether you beat
 * it — with a one-tap "challenge back".
 */
export function VsPage() {
  const { code } = useParams();
  const nav = useNavigate();
  const p1Name = useApp((s) => s.p1Name);
  const challenge = useMemo(() => (code ? decodeChallenge(code) : null), [code]);
  const def = challenge ? getGame(challenge.gameId) : undefined;
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [myScore, setMyScore] = useState<number | null>(null);
  const [shareLabel, setShareLabel] = useState('Challenge them back');

  if (!challenge || !def) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto w-full">
        <div className="card p-12 text-center mt-6">
          <div className="text-5xl mb-3">🔗</div>
          <p className="text-ink-soft text-lg">This challenge link is invalid or expired.</p>
          <button onClick={() => nav('/')} className="btn-coral mx-auto mt-5">Go home</button>
        </div>
      </div>
    );
  }

  if (phase === 'play') {
    return (
      <div className="flex flex-col h-dvh bg-dark-bg text-gray-100">
        <GameHost
          key={def.id}
          def={def}
          mode="solo"
          difficulty="medium"
          fixedSeed={challenge.seed}
          onEnd={(r) => {
            setMyScore(r.score ?? 0);
            setPhase('done');
          }}
        />
      </div>
    );
  }

  const Icon = def.icon;
  const beat = myScore != null && myScore > challenge.score;

  const challengeBack = async () => {
    const res = await shareChallenge({ gameId: def.id, seed: challenge.seed, score: myScore ?? 0, name: p1Name });
    setShareLabel(res === 'copied' ? 'Link copied!' : res === 'shared' ? 'Shared!' : 'Could not share');
    setTimeout(() => setShareLabel('Challenge them back'), 2500);
  };

  return (
    <div className="p-5 md:p-10 max-w-2xl mx-auto w-full animate-fade-in">
      <div className="card overflow-hidden mt-4">
        <div className="h-40 md:h-48 grid place-items-center" style={{ background: `linear-gradient(135deg, ${def.accent}, ${def.accent2})` }}>
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-white/[0.16] border border-white/25 grid place-items-center text-white backdrop-blur-sm scale-[1.6]">
            <Icon />
          </div>
        </div>
        <div className="p-6 md:p-8 text-center">
          {phase === 'intro' ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coral-soft text-coral-ink text-[11.5px] font-bold tracking-[0.08em] mb-3">
                ⚔️ CHALLENGE
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">{challenge.name} challenges you!</h1>
              <p className="text-ink-soft mb-1">Same puzzle. Same seed. Can you beat their score?</p>
              <div className="text-4xl font-bold my-5">
                {challenge.score}
                <span className="block text-sm font-semibold text-ink-faint uppercase tracking-wide mt-1">{def.title} · score to beat</span>
              </div>
              <button className="btn-coral text-lg px-12 mx-auto" onClick={() => setPhase('play')}>
                <span className="material-symbols-outlined">play_arrow</span>
                Accept challenge
              </button>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">{beat ? '🏆' : '😤'}</div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{beat ? 'You won the challenge!' : 'So close!'}</h1>
              <div className="flex items-center justify-center gap-6 my-5">
                <div>
                  <div className="text-3xl font-bold">{myScore}</div>
                  <div className="text-xs text-ink-faint uppercase tracking-wide">You</div>
                </div>
                <div className="text-ink-faint font-bold">vs</div>
                <div>
                  <div className="text-3xl font-bold">{challenge.score}</div>
                  <div className="text-xs text-ink-faint uppercase tracking-wide">{challenge.name}</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="btn-soft" onClick={() => { setMyScore(null); setPhase('play'); }}>Try again</button>
                <button className="btn-coral" onClick={challengeBack}>{shareLabel}</button>
              </div>
              <button onClick={() => nav('/')} className="text-coral font-bold text-sm mt-5 hover:text-coral-ink transition-colors">Back to home</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
