/* Service worker — caches app shell for offline use */

const CACHE_NAME = 'shift-planner-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './alarm.js',
  './storage.js',
  './jalali.js',
  './manifest.json',
  './icons/192.png',
  './icons/512.png',
  './icons/192.png',
  './icons/512.png',
  './fonts/Vazirmatn-Regular.woff2',
  './fonts/Vazirmatn-Bold.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

/* ===================== ALARM SCHEDULING ===================== */

const _swTimers = {};

self.addEventListener('message', (event) => {
  const msg = event.data;
  if (!msg) return;

  if (msg.type === 'SCHEDULE_ALARMS') {
    scheduleAlarms(msg.alarms || []);
  }
  if (msg.type === 'SHOW_NOTIFICATION') {
    showAlarmNotification(msg.title, msg.body, msg.alarmId);
  }
  if (msg.type === 'CANCEL_ALL_ALARMS') {
    Object.values(_swTimers).forEach(clearTimeout);
    Object.keys(_swTimers).forEach((k) => delete _swTimers[k]);
  }
});

function scheduleAlarms(alarms) {
  Object.values(_swTimers).forEach(clearTimeout);
  Object.keys(_swTimers).forEach((k) => delete _swTimers[k]);

  const now = Date.now();
  alarms.forEach((alarm) => {
    const delay = alarm.fireAt - now;
    if (delay <= 0) return;

    _swTimers[alarm.id] = setTimeout(async () => {
      delete _swTimers[alarm.id];
      await showAlarmNotification(
        '🔔 شیفت ۳۰ دقیقه دیگر شروع می‌شود',
        `${alarm.pharmacyName} — ${alarm.start}`,
        alarm.id
      );
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      clients.forEach((client) => {
        client.postMessage({ type: 'ALARM_FIRED', ...alarm });
      });
    }, delay);
  });
}

async function showAlarmNotification(title, body, alarmId) {
  try {
    await self.registration.showNotification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: alarmId,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [{ action: 'open', title: 'باز کردن اپ' }],
    });
  } catch(e) {}
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) clients[0].focus();
      else self.clients.openWindow('./');
    })
  );
});

