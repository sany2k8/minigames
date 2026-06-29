import { useState } from 'react';
import { useAuth } from '../lib/auth';

type Mode = 'signin' | 'signup';

/** Email/password sign in + sign up modal (Pulse light theme). */
export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setError(null);
    setInfo(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email || !password) {
      setError('Enter an email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const res =
      mode === 'signup'
        ? await signUp(email.trim(), password, name.trim() || undefined)
        : await signIn(email.trim(), password);
    setBusy(false);

    if (!res.ok) {
      setError(res.message ?? 'Something went wrong.');
      return;
    }
    if (res.message) {
      // e.g. "check your email to confirm" — stay open so the user sees it.
      setInfo(res.message);
      return;
    }
    onClose();
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-[400px] p-6 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg text-ink-faint hover:bg-line-soft"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="w-12 h-12 rounded-[14px] grid place-items-center text-white mb-4 shadow-[0_8px_18px_rgba(255,90,60,0.3)]" style={{ background: 'linear-gradient(135deg,#FF5A3C,#FB7E50)' }}>
          <span className="material-symbols-outlined">{mode === 'signup' ? 'person_add' : 'login'}</span>
        </div>

        <h2 className="text-[22px] font-bold tracking-tight">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h2>
        <p className="text-[13.5px] text-ink-soft mt-1 mb-5">
          {mode === 'signup'
            ? 'Save your progress and climb the global leaderboard.'
            : 'Sign in to sync your scores across devices.'}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <Field label="Display name (optional)">
              <input
                className="auth-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How you appear on leaderboards"
                autoComplete="nickname"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Password">
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </Field>

          {error && <p className="text-[13px] font-semibold text-[#DC2626] bg-[#FEF2F2] rounded-lg px-3 py-2">{error}</p>}
          {info && <p className="text-[13px] font-semibold text-[#0F766E] bg-[#F0FDFA] rounded-lg px-3 py-2">{info}</p>}

          <button type="submit" disabled={busy} className="btn-coral w-full mt-1 disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="text-center text-[13px] text-ink-faint mt-4">
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('signin')} className="font-bold text-coral">Sign in</button>
            </>
          ) : (
            <>New here?{' '}
              <button onClick={() => switchMode('signup')} className="font-bold text-coral">Create an account</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-bold text-ink-soft">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
