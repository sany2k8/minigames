import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { initGlobalHaptics, setHapticsEnabled } from './lib/haptics';
import { useApp } from './store/store';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
