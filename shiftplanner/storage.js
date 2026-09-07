/* ===================================================================
   Storage layer — localStorage backed, with import/export helpers.
   Data model:
     pharmacies: [{ id, name, address }]
     shifts: [{ id, dateKey: 'jy-jm-jd', pharmacyId, start: 'HH:MM', end: 'HH:MM',
                 note, isNight: bool, isHoliday: bool }]
     settings: { rateNormal: number, rateSpecial: number }
   =================================================================== */

const STORAGE_KEYS = {
  pharmacies: 'shiftplanner.pharmacies.v1',
  shifts: 'shiftplanner.shifts.v1',
  settings: 'shiftplanner.settings.v1',
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
/** Convert Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Latin (0-9) */
function toLatinDigits(str) {
  return String(str)
    .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06F0)
    .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660);
}

function loadPharmacies() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.pharmacies) || '[]'); }
  catch (e) { return []; }
}
function savePharmacies(list) {
  localStorage.setItem(STORAGE_KEYS.pharmacies, JSON.stringify(list));
}

function loadShifts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.shifts) || '[]'); }
  catch (e) { return []; }
}
function saveShifts(list) {
  localStorage.setItem(STORAGE_KEYS.shifts, JSON.stringify(list));
}

const DEFAULT_SETTINGS = {
  rateNormal: 0,
  rateSpecial: 0,
  bankAccounts: [],
  profile: {
    fullName:      '',
    licenseNumber: '',
    phone:         '',
    role:          'داروساز',
    email:         '',
    signatureNote: '',
  },
};

function loadSettings() {
  try { return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}')); }
  catch (e) { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(obj) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(obj));
}

/** Compute duration in hours (decimal) between HH:MM start and end. Handles overnight. */
function shiftDurationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;
  return (endMin - startMin) / 60;
}

/**
 * A shift is "night" only if it has NO day portion at all:
 * purely within 22:00–08:00. Used only for the calendar chip colour.
 * Income calculation uses splitShiftHours() instead.
 */
function isNightShift(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin   = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // overnight

  const NIGHT_START = 22 * 60; // 22:00
  const NIGHT_END   = 32 * 60; // 08:00 next day = 24+8 = 32*60
  const DAY_START   =  8 * 60; // 08:00
  const DAY_END     = 22 * 60; // 22:00

  // Normalise endMin into the overnight window if needed
  const normEnd = endMin <= startMin ? endMin + 24 * 60 : endMin;

  // Check if shift has ANY day portion (08:00–22:00)
  // Day portion exists if shift overlaps [8*60, 22*60]
  const hasDayPortion =
    startMin < DAY_END && normEnd > DAY_START;

  return !hasDayPortion;
}

/**
 * Split a non-holiday shift into day and night minute counts.
 * Day   = 08:00–22:00
 * Night = 22:00–08:00 (next day)
 * Returns { dayMinutes, nightMinutes }
 */
function splitShiftHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin   = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // handle overnight

  const DAY_START   =  8 * 60; //  8:00  = 480
  const DAY_END     = 22 * 60; // 22:00  = 1320
  const NIGHT_END   = 32 * 60; // 08:00 next day = 1920

  let dayMinutes   = 0;
  let nightMinutes = 0;

  // Walk through each minute block:
  // Segment 1: 00:00–08:00  (night, early)
  // Segment 2: 08:00–22:00  (day)
  // Segment 3: 22:00–24:00  (night, late)
  // Segment 4: 24:00–32:00  (night, next day early = 00:00–08:00)

  const segments = [
    { from:  0,   to: DAY_START, isDay: false },
    { from: DAY_START, to: DAY_END,   isDay: true  },
    { from: DAY_END,   to: 24 * 60,   isDay: false },
    { from: 24 * 60,   to: NIGHT_END, isDay: false },
  ];

  segments.forEach(({ from, to, isDay }) => {
    const overlapStart = Math.max(startMin, from);
    const overlapEnd   = Math.min(endMin,   to);
    if (overlapEnd > overlapStart) {
      const mins = overlapEnd - overlapStart;
      if (isDay) dayMinutes   += mins;
      else        nightMinutes += mins;
    }
  });

  return {
    dayHours:   dayMinutes   / 60,
    nightHours: nightMinutes / 60,
  };
}

/**
 * Determine if a given Jalali weekday index is a holiday.
 * weekdayIdx: 0=Saturday … 5=Thursday, 6=Friday
 * Friday (idx 6) is always a holiday in Iranian calendar.
 */
function isFridayHoliday(weekdayIdx) {
  return weekdayIdx === 6;
}

function formatHours(hoursDecimal) {
  const h = Math.floor(hoursDecimal);
  const m = Math.round((hoursDecimal - h) * 60);
  if (m === 0) return `${h} ساعت`;
  return `${h} ساعت و ${m} دقیقه`;
}

const PAYMENT_STORAGE_KEY = 'shiftplanner.payments.v1';

function loadPayments() {
  try { return JSON.parse(localStorage.getItem(PAYMENT_STORAGE_KEY) || '{}'); }
  catch (e) { return {}; }
}

function savePayments(obj) {
  localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(obj));
}

function paymentKey(jy, jm, pharmacyId) {
  return `${jy}-${String(jm).padStart(2, '0')}_${pharmacyId}`;
}

window.Store = {
  loadPharmacies, savePharmacies,
  loadShifts, saveShifts,
  loadSettings, saveSettings,
  loadPayments, savePayments, paymentKey,   // ← add these three
  uid,
  shiftDurationHours, formatHours,
  isNightShift, isFridayHoliday,
  splitShiftHours, toLatinDigits,     
};