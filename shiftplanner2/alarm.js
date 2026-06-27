/* ===================================================================
   Alarm / Notification system — دفتر شیفت
   
   How it works:
   1. User opts in via settings toggle → permission requested
   2. On every shift save/edit/delete → alarms recalculated
   3. On every app open/focus → future alarms rescheduled via SW message
   4. SW fires showNotification() when countdown hits 0
   5. Missed alarms (app was closed) shown as in-panel banner on reopen
   6. Ringtone: Web Audio API chime (no external file)
   =================================================================== */

const ALARM_STORAGE_KEY = 'shiftplanner.alarms.v1';
const ALARM_MINUTES_BEFORE = 30;

/* ---- Public state ---- */
window.AlarmSystem = {
  init,
  rescheduleAll,
  removeAlarmsForShift,
  playChime,
  requestPermission,
};

let _alarmTimeouts = {}; // id → timeoutId (in-page fallback timers)
let _swReady = false;

/* =================== INIT =================== */

function init() {
  // Listen for messages from SW (alarm fired while app backgrounded)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'ALARM_FIRED') {
        markAlarmNotified(event.data.alarmId);
        showInPanelNotification(event.data);
        playChime();
      }
    });

    navigator.serviceWorker.ready.then(() => {
      _swReady = true;
      rescheduleAll();
    });
  }

  // Also reschedule on page focus (catches wake-from-background)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      rescheduleAll();
      showMissedAlarms();
    }
  });

  // Initial render of alarm panel
  renderAlarmPanel();
  showMissedAlarms();
}

/* =================== ALARM STORAGE =================== */

function loadAlarms() {
  try { return JSON.parse(localStorage.getItem(ALARM_STORAGE_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveAlarms(list) {
  localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(list));
}

/** Build alarm fire time (UTC ms) from a Jalali dateKey + HH:MM start */
function buildFireTime(dateKey, start) {
  const { jy, jm, jd } = window.JalaliUtil.parseJalaliKey(dateKey);
  const gDate = window.JalaliUtil.jalaliToDate(jy, jm, jd);
  const [h, m] = start.split(':').map(Number);
  gDate.setHours(h, m, 0, 0);
  return gDate.getTime() - ALARM_MINUTES_BEFORE * 60 * 1000;
}

/** Rebuild alarms from current shifts list */
function rebuildAlarms(shifts, pharmacies, settingsObj) {
  if (!settingsObj.alarmEnabled) {
    saveAlarms([]);
    return;
  }
  const now = Date.now();
  const existing = loadAlarms();
  const existingMap = {};
  existing.forEach((a) => { existingMap[a.shiftId] = a; });

  const alarms = [];
  shifts.forEach((shift) => {
    const fireAt = buildFireTime(shift.dateKey, shift.start);
    const pName = (pharmacies.find((p) => p.id === shift.pharmacyId) || {}).name || '—';

    // Keep notified state if already marked
    const prev = existingMap[shift.id];
    const notified = prev && prev.notified && Math.abs(prev.fireAt - fireAt) < 60000;

    alarms.push({
      id: shift.id + '_alarm',
      shiftId: shift.id,
      dateKey: shift.dateKey,
      start: shift.start,
      pharmacyName: pName,
      fireAt,
      notified: notified || (fireAt < now - 5 * 60 * 1000), // treat very old as notified
    });
  });

  saveAlarms(alarms);
}

function markAlarmNotified(alarmId) {
  const list = loadAlarms();
  const a = list.find((x) => x.id === alarmId);
  if (a) { a.notified = true; saveAlarms(list); }
}

function removeAlarmsForShift(shiftId) {
  const list = loadAlarms().filter((a) => a.shiftId !== shiftId);
  saveAlarms(list);
}

/* =================== RESCHEDULE =================== */

function rescheduleAll() {
  // Clear existing page-level timers
  Object.values(_alarmTimeouts).forEach(clearTimeout);
  _alarmTimeouts = {};

  const alarms = loadAlarms();
  const now = Date.now();
  const future = alarms.filter((a) => !a.notified && a.fireAt > now);

  future.forEach((alarm) => {
    const delay = alarm.fireAt - now;

    // Page-level timer (works when tab is open/focused)
    _alarmTimeouts[alarm.id] = setTimeout(() => {
      onAlarmFired(alarm);
    }, delay);
  });

  // Tell SW to also handle these (fires even when tab is backgrounded)
  sendToSW({ type: 'SCHEDULE_ALARMS', alarms: future });
}

function sendToSW(msg) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(msg);
  }
}

function onAlarmFired(alarm) {
  markAlarmNotified(alarm.id);
  showInPanelNotification(alarm);
  playChime();
  fireSystemNotification(alarm);
  renderAlarmPanel();
}

/* =================== SYSTEM NOTIFICATION =================== */

function requestPermission(callback) {
  if (!('Notification' in window)) {
    callback('unsupported');
    return;
  }
  if (Notification.permission === 'granted') {
    callback('granted');
    return;
  }
  Notification.requestPermission().then((result) => callback(result));
}

function fireSystemNotification(alarm) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const J = window.JalaliUtil;
  const { jy, jm, jd } = J.parseJalaliKey(alarm.dateKey);
  const dateFa = `${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}`;

  const title = `🔔 شیفت ۳۰ دقیقه دیگر شروع می‌شود`;
  const body  = `${alarm.pharmacyName} — ${alarm.start} | ${dateFa}`;

  try {
    if (_swReady && navigator.serviceWorker.controller) {
      // Use SW notification (persists on locked screen)
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
        alarmId: alarm.id,
      });
    } else {
      new Notification(title, { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png', vibrate: [200, 100, 200] });
    }
  } catch(e) {
    // Fallback: in-panel only
  }
}

/* =================== IN-PANEL NOTIFICATION BANNER =================== */

function showInPanelNotification(alarm) {
  const J = window.JalaliUtil;
  const { jy, jm, jd } = J.parseJalaliKey(alarm.dateKey);
  const dateFa = `${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}`;

  const banner = document.createElement('div');
  banner.className = 'alarm-banner alarm-banner--live';
  banner.setAttribute('role', 'alert');
  banner.innerHTML = `
    <div class="alarm-banner__icon">🔔</div>
    <div class="alarm-banner__body">
      <strong>${alarm.pharmacyName}</strong>
      <span>شیفت ${alarm.start} — ${dateFa} — ۳۰ دقیقه دیگر شروع می‌شود</span>
    </div>
    <button class="alarm-banner__close" aria-label="بستن">✕</button>`;

  banner.querySelector('.alarm-banner__close').addEventListener('click', () => {
    banner.classList.add('alarm-banner--exit');
    setTimeout(() => banner.remove(), 350);
  });

  const container = document.getElementById('alarmBannerContainer');
  if (container) {
    container.prepend(banner);
    // Auto-dismiss after 30 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        banner.classList.add('alarm-banner--exit');
        setTimeout(() => banner.remove(), 350);
      }
    }, 30000);
  }
  renderAlarmPanel();
}

/* =================== MISSED ALARMS (show on reopen) =================== */

function showMissedAlarms() {
  const alarms = loadAlarms();
  const now    = Date.now();
  // Missed = fireAt in last 2 hours, not yet notified
  const missed = alarms.filter((a) => !a.notified && a.fireAt <= now && a.fireAt >= now - 2 * 60 * 60 * 1000);
  missed.forEach((a) => {
    markAlarmNotified(a.id);
    showInPanelNotification(a); // show as banner even if late
  });
  renderAlarmPanel();
}

/* =================== ALARM PANEL (settings / upcoming list) =================== */

function renderAlarmPanel() {
  const panel = document.getElementById('alarmUpcomingPanel');
  if (!panel) return;

  const alarms = loadAlarms();
  const now    = Date.now();
  const upcoming = alarms
    .filter((a) => !a.notified && a.fireAt > now)
    .sort((a, b) => a.fireAt - b.fireAt)
    .slice(0, 5);

  if (upcoming.length === 0) {
    panel.innerHTML = '<p class="alarm-panel__empty">آلارمی در پیش رو وجود ندارد</p>';
    return;
  }

  const J = window.JalaliUtil;
  panel.innerHTML = upcoming.map((a) => {
    const { jm, jd } = J.parseJalaliKey(a.dateKey);
    const dateFa     = `${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}`;
    const msLeft     = a.fireAt - now;
    const hLeft      = Math.floor(msLeft / 3600000);
    const mLeft      = Math.floor((msLeft % 3600000) / 60000);
    const timeLeft   = hLeft > 0
      ? `${J.toPersianDigits(hLeft)} ساعت و ${J.toPersianDigits(mLeft)} دقیقه دیگر`
      : `${J.toPersianDigits(mLeft)} دقیقه دیگر`;

    return `<div class="alarm-item">
      <div class="alarm-item__icon">⏰</div>
      <div class="alarm-item__info">
        <span class="alarm-item__pharmacy">${a.pharmacyName}</span>
        <span class="alarm-item__time">${a.start} | ${dateFa}</span>
        <span class="alarm-item__left">${timeLeft}</span>
      </div>
    </div>`;
  }).join('');
}

/* =================== CHIME (Web Audio API) =================== */

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.7);

      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.7);
    });

    // Second ripple (echo)
    setTimeout(() => {
      const osc2  = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.value = 1046.5; // C6
      gain2.gain.setValueAtTime(0.15, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.6);
    }, 620);
  } catch(e) {
    // Audio not available — silent
  }
}

/* =================== EXPORTED REBUILD (called from app.js) =================== */

window.AlarmSystem.rebuildAlarms = rebuildAlarms;