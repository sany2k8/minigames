/**
 * Daily Challenge reminder. True web push needs a server + VAPID, which would
 * break the app's offline-only model. Instead we use a local reminder: the
 * Notification Triggers API (`TimestampTrigger`) fires even when the app is
 * closed on supporting browsers (Chromium); elsewhere we fall back to a
 * same-session timer that nudges while the tab is still open.
 */
const TAG = 'daily-challenge';
const HOUR = 19; // 7pm local

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** Next occurrence of the reminder hour (today if still ahead, else tomorrow). */
function nextReminderTs(): number {
  const t = new Date();
  t.setHours(HOUR, 0, 0, 0);
  if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1);
  return t.getTime();
}

async function schedule(): Promise<void> {
  const ts = nextReminderTs();
  const body = 'A fresh puzzle is waiting — keep your streak alive! 🔥';
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const Trigger = (window as unknown as { TimestampTrigger?: new (t: number) => unknown }).TimestampTrigger;
    if (reg && Trigger) {
      // Clear any previously scheduled reminder, then re-arm.
      const existing = await (reg as unknown as {
        getNotifications: (o: unknown) => Promise<Notification[]>;
      }).getNotifications({ tag: TAG, includeTriggered: true }).catch(() => [] as Notification[]);
      existing.forEach((n) => n.close());
      await reg.showNotification('Daily Challenge 🗓️', {
        tag: TAG,
        body,
        badge: 'favicon.svg',
        icon: 'favicon.svg',
        // showTrigger is part of the experimental Notification Triggers API.
        showTrigger: new Trigger(ts),
        data: { url: '#/daily' }
      } as NotificationOptions);
      return;
    }
  } catch {
    /* fall through to the in-session fallback */
  }
  // Fallback: only fires while the page stays open.
  const delay = ts - Date.now();
  if (delay > 0 && delay < 24 * 3600 * 1000) {
    window.setTimeout(() => {
      if (Notification.permission === 'granted') new Notification('Daily Challenge 🗓️', { body });
    }, delay);
  }
}

/** Turn the reminder on (asks permission). Returns whether it's now active. */
export async function enableDailyReminder(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  await schedule();
  return true;
}

/** Re-arm on app start if the user has the reminder enabled. */
export function rescheduleDailyReminder(enabled: boolean): void {
  if (enabled && notificationsSupported() && Notification.permission === 'granted') void schedule();
}
