/* ===================================================================
   Storage layer — localStorage backed, with import/export helpers.
   Data model:
     pharmacies: [{ id, name, address }]
     shifts: [{ id, dateKey: 'jy-jm-jd', pharmacyId, start: 'HH:MM', end: 'HH:MM', note }]
   =================================================================== */

const STORAGE_KEYS = {
  pharmacies: 'shiftplanner.pharmacies.v1',
  shifts: 'shiftplanner.shifts.v1',
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadPharmacies() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pharmacies);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load pharmacies', e);
    return [];
  }
}

function savePharmacies(list) {
  localStorage.setItem(STORAGE_KEYS.pharmacies, JSON.stringify(list));
}

function loadShifts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.shifts);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load shifts', e);
    return [];
  }
}

function saveShifts(list) {
  localStorage.setItem(STORAGE_KEYS.shifts, JSON.stringify(list));
}

/** Compute duration in hours (decimal) between HH:MM start and end. Handles overnight shifts. */
function shiftDurationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // overnight shift
  return (endMin - startMin) / 60;
}

function formatHours(hoursDecimal) {
  const h = Math.floor(hoursDecimal);
  const m = Math.round((hoursDecimal - h) * 60);
  if (m === 0) return `${h} ساعت`;
  return `${h} ساعت و ${m} دقیقه`;
}

window.Store = {
  loadPharmacies,
  savePharmacies,
  loadShifts,
  saveShifts,
  uid,
  shiftDurationHours,
  formatHours,
};
