// Custom Service Worker for habit-tracker.
// Extends ngsw-worker.js (Angular SW) with a push handler that consults
// IndexedDB locally BEFORE showing the notification.
//
// Privacy invariant: the server never knows the habit name/state. The push
// payload only carries { type: 'reminder', habitId }. The SW reads IndexedDB
// to fetch the habit name + emoji + today's marked state, and decides:
//   - habit already marked today → dismiss silently
//   - habit unmarked → show notification "<emoji> <name>" "¿Hecho hoy?"
//   - habit removed (no longer in IDB) → dismiss silently

importScripts('./ngsw-worker.js');

const DB_NAME = 'habit-tracker';
const STORE_NAME = 'habits';

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try { payload = event.data.json(); }
  catch { return; }

  if (!payload || payload.type !== 'reminder' || !payload.habitId) return;

  event.waitUntil(handleReminder(payload.habitId));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(focusOrOpen());
});

async function handleReminder(habitId) {
  const habit = await readHabit(habitId);
  if (!habit) return; // user deleted the habit — silent dismiss

  const today = todayISO();
  if (Array.isArray(habit.marks) && habit.marks.includes(today)) {
    return; // already marked today — silent dismiss
  }

  const emoji = habit.emoji || '🔔';
  const name = habit.name || 'Hábito';

  await self.registration.showNotification(`${emoji}  ${name}`, {
    body: '¿Hecho hoy?',
    icon: '/habit-tracker/icons/icon-192x192.png',
    badge: '/habit-tracker/icons/icon-72x72.png',
    tag: `habit-${habitId}`,
    renotify: false,
    requireInteraction: false,
    data: { habitId },
  });
}

function readHabit(habitId) {
  return new Promise((resolve) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      const db = open.result;
      try {
        const req = db.transaction(STORE_NAME, 'readonly')
          .objectStore(STORE_NAME)
          .get(habitId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };
  });
}

async function focusOrOpen() {
  const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of allClients) {
    if (client.url.includes('/habit-tracker/')) {
      return client.focus();
    }
  }
  return self.clients.openWindow('/habit-tracker/');
}

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
