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
  shifts:     'shiftplanner.shifts.v1',
  settings:   'shiftplanner.settings.v1',
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadPharmacies() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.pharmacies) || '[]'); }
  catch(e) { return []; }
}
function savePharmacies(list) {
  localStorage.setItem(STORAGE_KEYS.pharmacies, JSON.stringify(list));
}

function loadShifts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.shifts) || '[]'); }
  catch(e) { return []; }
}
function saveShifts(list) {
  localStorage.setItem(STORAGE_KEYS.shifts, JSON.stringify(list));
}

const DEFAULT_SETTINGS = { rateNormal: 0, rateSpecial: 0 };
function loadSettings() {
  try { return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}')); }
  catch(e) { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(obj) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(obj));
}

/** Compute duration in hours (decimal) between HH:MM start and end. Handles overnight. */
function shiftDurationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin   = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60;
  return (endMin - startMin) / 60;
}

/**
 * Determine if a shift qualifies as "night shift".
 * Rule: shift is night if it starts at 20:00 or later,
 *       OR if it is an overnight shift (end <= start clock-time),
 *       OR if it ends at or before 08:00 (e.g. a shift ending at 07:00).
 */
function isNightShift(start, end) {
  const [sh] = start.split(':').map(Number);
  const [eh] = end.split(':').map(Number);
  const [, em] = end.split(':').map(Number);
  const overnight = end <= start; // lexicographic comparison on HH:MM works for this
  if (sh >= 20) return true;
  if (overnight) return true;
  if (eh < 8 || (eh === 8 && em === 0)) return true;
  return false;
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

window.Store = {
  loadPharmacies, savePharmacies,
  loadShifts, saveShifts,
  loadSettings, saveSettings,
  uid,
  shiftDurationHours, formatHours,
  isNightShift, isFridayHoliday,
};
