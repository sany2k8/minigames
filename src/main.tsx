import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { initGlobalHaptics, setHapticsEnabled } from './lib/haptics';
import { levelInfo, useApp } from './store/store';
import { syncProfile, setFavorite, isCloudEnabled } from './lib/cloud';
import './lib/pwa'; // registers the beforeinstallprompt listener early
import './theme/global.css';

// In dev, a service worker left over from a previous production build/preview
// keeps serving its stale cached bundle on the same origin (localhost) — which
// is why fixed code can appear "not applied". Proactively tear it down so the
// dev server always loads the latest source.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length === 0) return;
    regs.forEach((r) => r.unregister());
    if ('caches' in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
  });
}

// Global tap haptics, gated by the persisted setting.
initGlobalHaptics();
setHapticsEnabled(useApp.getState().haptics);
useApp.subscribe((s) => setHapticsEnabled(s.haptics));

// Cloud sync (no-op unless Supabase is configured and a user is signed in).
// The initial back-fill on login lives in <AuthBridge>; here we keep the cloud
// in step with later changes — reward totals (debounced) and favorites (live).
if (isCloudEnabled) {
  const snapshot = () => {
    const s = useApp.getState();
    return {
      displayName: s.p1Name,
      points: s.points,
      level: levelInfo(s.points).level,
      tier: levelInfo(s.points).title,
      gamesWon: s.gamesWon,
      gamesPlayed: s.gamesPlayed
    };
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const pushSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void syncProfile(snapshot()), 1500);
  };

  // Initial sign-in + first sync are handled by <AuthBridge>; here we just keep
  // the cloud profile in step with later reward changes (no-op until authed).
  useApp.subscribe((s, prev) => {
    if (
      s.points !== prev.points ||
      s.gamesWon !== prev.gamesWon ||
      s.gamesPlayed !== prev.gamesPlayed ||
      s.p1Name !== prev.p1Name
    ) {
      pushSoon();
    }

    // Favorites: mirror each add/remove to the cloud as it happens.
    if (s.favorites !== prev.favorites) {
      s.favorites
        .filter((id) => !prev.favorites.includes(id))
        .forEach((id) => void setFavorite(id, true));
      prev.favorites
        .filter((id) => !s.favorites.includes(id))
        .forEach((id) => void setFavorite(id, false));
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
