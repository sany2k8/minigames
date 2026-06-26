import { useEffect, useState } from 'react';

/**
 * Captures the browser's install prompt so the hero can offer "Install Offline
 * App" at the right moment. The event must be intercepted as early as possible,
 * so this module installs its listener on import (see main.tsx).
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(can: boolean) => void>();
const emit = (can: boolean) => listeners.forEach((l) => l(can));

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    emit(true);
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit(false);
  });
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(deferred !== null);
  useEffect(() => {
    listeners.add(setCanInstall);
    return () => {
      listeners.delete(setCanInstall);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    emit(false);
  };

  return { canInstall, promptInstall };
}
