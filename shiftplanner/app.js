/* ===================================================================
   دفتر شیفت —
   Features: calendar, night/holiday auto-tagging, monthly summary,
             financial report, per-pharmacy exports, settings + PWA install
   =================================================================== */

const J = window.JalaliUtil;
const S = window.Store;

let pharmacies = S.loadPharmacies();
let shifts = S.loadShifts();
let settings = S.loadSettings();
let deputies = S.loadDeputies();
const FALLBACK_RATES = { day: 540000, night: 610000, holiday: 610000 };

function ensureDefaultRates() {
  const d = settings.defaultRates;
  if (d && typeof d === 'object') {
    ['day', 'night', 'holiday'].forEach((k) => { if (!(d[k] > 0)) d[k] = FALLBACK_RATES[k]; });
    return;
  }
  // migrate old global rates so past income stays the same
  settings.defaultRates = {
    day:     settings.rateNormal  > 0 ? settings.rateNormal  : FALLBACK_RATES.day,
    night:   settings.rateSpecial > 0 ? settings.rateSpecial : FALLBACK_RATES.night,
    holiday: settings.rateSpecial > 0 ? settings.rateSpecial : FALLBACK_RATES.holiday,
  };
  S.saveSettings(settings);
}
ensureDefaultRates();
let viewYear, viewMonth;
let selectedDateKey = null;
let reportPharmacyFilter = 'all';
let financialPharmacyFilter = 'all';
let reportDeputyFilter = 'all';
let financialDeputyFilter = 'all';
let deferredInstallPrompt = null; // PWA beforeinstallprompt event
// Independent month state for each report tab (default = current month)
// let summaryYear    = null; // set in init()
// let summaryMonth   = null;
// let financialYear  = null;
// let financialMonth = null;

const todayJ = J.todayJalali();

/* =================== INIT =================== */

function init() {
  viewYear = todayJ.jy;
  viewMonth = todayJ.jm;

  renderWeekHeader();
  bindNav();
  bindMonthControls();
  bindSheet();
  bindPharmacyForm();
  bindDeputyForm();
  bindShiftForm();
  bindExport();
  bindReportFilter();
  bindFinancialView();
  bindSettings();
  bindPwaInstall();
  bindReportMonthPickers();
  bindDeleteMonth();

  renderCalendar();
  renderPharmacyList();
  renderPharmacySelect();
  renderDeputySelect();
  registerServiceWorker();
}
/* =================== NAVIGATION =================== */

function bindNav() {
  const allNavBtns = document.querySelectorAll('.navbtn, .bottom-nav__btn');

  allNavBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.view;

      // Update active state on BOTH top and bottom navs
      document.querySelectorAll('.navbtn').forEach((b) =>
        b.classList.toggle('is-active', b.dataset.view === target));
      document.querySelectorAll('.bottom-nav__btn').forEach((b) =>
        b.classList.toggle('is-active', b.dataset.view === target));

      // Switch view
      document.querySelectorAll('.view').forEach((v) =>
        v.setAttribute('data-active', 'false'));
      document.getElementById(`view-${target}`).setAttribute('data-active', 'true');

      if (target === 'summary')    { updateSummaryMonthLabel(); renderSummary(); }
      if (target === 'financial')  { renderFinancial(); renderTrendChart(); }
      if (target === 'pharmacies') renderPharmacyList();
      if (target === 'deputies') renderDeputyList();
    });
  });
}

/* =================== WEEK HEADER =================== */

function renderWeekHeader() {
  document.getElementById('weekHeader').innerHTML =
    J.PERSIAN_WEEKDAYS_SHORT.map((d) => `<span>${d}</span>`).join('');
}

/* =================== MONTH NAVIGATION =================== */

function bindMonthControls() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    viewMonth--; if (viewMonth < 1) { viewMonth = 12; viewYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    viewMonth++; if (viewMonth > 12) { viewMonth = 1; viewYear++; }
    renderCalendar();
  });
  document.getElementById('gotoToday').addEventListener('click', () => {
    viewYear = todayJ.jy; viewMonth = todayJ.jm;
    renderCalendar();
  });
}

/* =================== CALENDAR =================== */

function shiftsForDate(dateKey) {
  return shifts.filter((s) => s.dateKey === dateKey)
    .sort((a, b) => a.start.localeCompare(b.start));
}

function pharmacyName(id) {
  const p = pharmacies.find((x) => x.id === id);
  return p ? p.name : '—';
}

function isSpecialShift(s) { return s.isNight || s.isHoliday; }
// true if shift has ANY night portion (used for chip colour on calendar)
function hasNightPortion(s) {
  if (s.isHoliday) return false;
  const { nightHours } = S.splitShiftHours(s.start, s.end);
  return nightHours > 0;
}
function hasDayPortion(s) {
  if (s.isHoliday) return false;
  const { dayHours } = S.splitShiftHours(s.start, s.end);
  return dayHours > 0;
}

function renderCalendar() {
  document.getElementById('monthLabel').textContent =
    `${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const firstWeekday = J.jalaliWeekday(viewYear, viewMonth, 1);
  const monthLen = J.jalaliMonthLength(viewYear, viewMonth);
  let prevMonth = viewMonth - 1, prevYear = viewYear;
  if (prevMonth < 1) { prevMonth = 12; prevYear--; }
  const prevMonthLen = J.jalaliMonthLength(prevYear, prevMonth);
  let nextMonth = viewMonth + 1, nextYear = viewYear;
  if (nextMonth > 12) { nextMonth = 1; nextYear++; }

  const cells = [];
  for (let i = 0; i < firstWeekday; i++)
    cells.push({ jy: prevYear, jm: prevMonth, jd: prevMonthLen - firstWeekday + i + 1, outside: true });
  for (let d = 1; d <= monthLen; d++)
    cells.push({ jy: viewYear, jm: viewMonth, jd: d, outside: false });
  let trail = 1;
  while (cells.length % 7 !== 0)
    cells.push({ jy: nextYear, jm: nextMonth, jd: trail++, outside: true });

  cells.forEach((c) => {
    const dateKey = J.jalaliKey(c.jy, c.jm, c.jd);
    const dayShifts = shiftsForDate(dateKey);
    const isToday = c.jy === todayJ.jy && c.jm === todayJ.jm && c.jd === todayJ.jd;
    const weekdayIdx = J.jalaliWeekday(c.jy, c.jm, c.jd);
    const isFriday = weekdayIdx === 6;

    const cell = document.createElement('div');
    cell.className = [
      'daycell',
      c.outside ? 'is-outside' : '',
      isToday ? 'is-today' : '',
      isFriday && !c.outside ? 'is-weekend' : '',
    ].filter(Boolean).join(' ');
    cell.dataset.dateKey = dateKey;

    const num = document.createElement('span');
    num.className = 'daynum';
    num.textContent = J.toPersianDigits(c.jd);
    cell.appendChild(num);

    if (dayShifts.length > 0) {
      const wrap = document.createElement('div');
      wrap.className = 'daycell__ticks';
      dayShifts.slice(0, 2).forEach((s) => {
        const special = isSpecialShift(s);
        const tick = document.createElement('div');
        tick.className = 'shift-tick' + (special ? ' shift-tick--special' : '');
        tick.innerHTML = `<span class="shift-tick__time">${s.start}</span><span class="shift-tick__name">${escapeHtml(pharmacyName(s.pharmacyId))}</span>`;
        wrap.appendChild(tick);
      });
      if (dayShifts.length > 2) {
        const more = document.createElement('div');
        more.className = 'daycell__more';
        more.textContent = `+${J.toPersianDigits(dayShifts.length - 2)}`;
        wrap.appendChild(more);
      }
      cell.appendChild(wrap);
    }

    if (!c.outside) {
      cell.addEventListener('click', () => openDaySheet(c.jy, c.jm, c.jd));
    } else {
      cell.addEventListener('click', () => {
        viewYear = c.jy; viewMonth = c.jm;
        renderCalendar();
        openDaySheet(c.jy, c.jm, c.jd);
      });
    }
    grid.appendChild(cell);
  });
  renderDeputyList();
  renderDeputySelect();

  updateMonthSummaryLine();
}

function escapeHtml(str) {
  const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
}

function updateMonthSummaryLine() {
  const ms = shifts.filter((s) => {
    const { jy, jm } = J.parseJalaliKey(s.dateKey);
    return jy === viewYear && jm === viewMonth;
  });
  const h = ms.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
  document.getElementById('monthSummaryLine').textContent =
    ms.length === 0 ? 'شیفتی برای این ماه ثبت نشده'
      : `${J.toPersianDigits(ms.length)} شیفت · ${J.toPersianDigits(h.toFixed(1))} ساعت`;
}

/* =================== DAY SHEET =================== */

function bindSheet() {
  document.getElementById('closeSheet').addEventListener('click', closeDaySheet);
  document.getElementById('sheetBackdrop').addEventListener('click', closeDaySheet);
}

function openDaySheet(jy, jm, jd) {
  selectedDateKey = J.jalaliKey(jy, jm, jd);
  const wi = J.jalaliWeekday(jy, jm, jd);
  document.getElementById('sheetDateLabel').textContent =
    `${J.PERSIAN_WEEKDAYS[wi]} ${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]} ${J.toPersianDigits(jy)}`;
  resetShiftForm();
  renderExistingShiftsForDay();
  renderPharmacySelect();
  // Pre-check holiday if Friday
  document.getElementById('shiftIsHoliday').checked = (wi === 6);
  updateShiftTypeBadge();
  document.getElementById('sheetBackdrop').classList.add('is-open');
  document.getElementById('daySheet').classList.add('is-open');
  document.getElementById('daySheet').setAttribute('aria-hidden', 'false');
}

function closeDaySheet() {
  document.getElementById('sheetBackdrop').classList.remove('is-open');
  document.getElementById('daySheet').classList.remove('is-open');
  document.getElementById('daySheet').setAttribute('aria-hidden', 'true');
  selectedDateKey = null;
}

function renderExistingShiftsForDay() {
  const wrap = document.getElementById('existingShiftsForDay');
  const list = shiftsForDate(selectedDateKey);
  if (list.length === 0) {
    wrap.innerHTML = '<p class="no-shifts-note">هنوز شیفتی برای این روز ثبت نشده است.</p>';
    return;
  }
  wrap.innerHTML = '';
  list.forEach((s) => {
    const hours = S.shiftDurationHours(s.start, s.end);
    const special = isSpecialShift(s);
    const row = document.createElement('div');
    row.className = 'existing-shift' + (special ? ' existing-shift--special' : '');
    row.innerHTML = `
      <div class="existing-shift__info">
        <div class="existing-shift__pharm">${escapeHtml(pharmacyName(s.pharmacyId))}</div>
        <div class="existing-shift__time">${s.start} – ${s.end} · ${J.toPersianDigits(hours.toFixed(1))} ساعت</div>
        ${special ? '<div class="existing-shift__badge">🌙 شب / تعطیل</div>' : ''}
        ${s.deputyId ? `<div class="existing-shift__note"> قائم مقام: ${escapeHtml(deputyName(s.deputyId))}</div>` : ''}
        ${s.note ? `<div class="existing-shift__note">${escapeHtml(s.note)}</div>` : ''}
      </div>
      <div class="existing-shift__actions">
        <button class="minibtn" data-action="edit" data-id="${s.id}">ویرایش</button>
        <button class="minibtn" data-action="delete" data-id="${s.id}">حذف</button>
      </div>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll('[data-action="edit"]').forEach((b) => b.addEventListener('click', () => loadShiftIntoForm(b.dataset.id)));
  wrap.querySelectorAll('[data-action="delete"]').forEach((b) => b.addEventListener('click', () => deleteShift(b.dataset.id)));
}

/* =================== SHIFT FORM =================== */

/* ============ MULTI-DAY SHIFT ============ */
let multiDaySelected = new Set();   // extra day numbers (besides the day whose sheet is open)
let holidayManual = false;          // true only if the user really touched the holiday checkbox

function multiDayContext() {
  const { jy, jm, jd } = J.parseJalaliKey(selectedDateKey);
  return { jy, jm, baseDay: jd, monthLen: J.jalaliMonthLength(jy, jm) };
}

function renderMultiDayGrid() {
  if (!selectedDateKey) return;
  const { jy, jm, baseDay, monthLen } = multiDayContext();
  const firstWd = J.jalaliWeekday(jy, jm, 1);

  document.getElementById('multiDayWeekHead').innerHTML =
    J.PERSIAN_WEEKDAYS_SHORT.map((d) => `<span>${d}</span>`).join('');

  let html = '';
  for (let i = 0; i < firstWd; i++) html += '<span class="md-empty"></span>';
  for (let d = 1; d <= monthLen; d++) {
    const isBase = d === baseDay;
    const selected = isBase || multiDaySelected.has(d);
    const friday = J.jalaliWeekday(jy, jm, d) === 6;
    html += `<button type="button" class="md-cell${selected ? ' is-selected' : ''}${isBase ? ' is-base' : ''}${friday ? ' is-friday' : ''}" data-day="${d}"${isBase ? ' disabled' : ''}>${J.toPersianDigits(d)}</button>`;
  }
  document.getElementById('multiDayGrid').innerHTML = html;

  document.getElementById('multiDayCount').textContent =
    `${J.toPersianDigits(1 + multiDaySelected.size)} روز انتخاب شده`;
}

function bindMultiDay() {
  const toggle = document.getElementById('multiDayToggle');
  if (!toggle) return;

  const quick = document.getElementById('multiDayQuick');
  quick.innerHTML = J.PERSIAN_WEEKDAYS
    .map((name, i) => `<button type="button" class="md-wd" data-wd="${i}">${name}</button>`).join('');

  toggle.addEventListener('change', () => {
    document.getElementById('multiDayPanel').style.display = toggle.checked ? '' : 'none';
    if (toggle.checked) renderMultiDayGrid();
    else multiDaySelected.clear();
  });

  document.getElementById('multiDayGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('.md-cell[data-day]');
    if (!btn || btn.disabled) return;
    const d = Number(btn.dataset.day);
    if (multiDaySelected.has(d)) multiDaySelected.delete(d); else multiDaySelected.add(d);
    renderMultiDayGrid();
  });

  quick.addEventListener('click', (e) => {
    const btn = e.target.closest('.md-wd');
    if (!btn || !selectedDateKey) return;
    const wd = Number(btn.dataset.wd);
    const { jy, jm, baseDay, monthLen } = multiDayContext();
    const days = [];
    for (let d = 1; d <= monthLen; d++) {
      if (d !== baseDay && J.jalaliWeekday(jy, jm, d) === wd) days.push(d);
    }
    const allOn = days.length > 0 && days.every((d) => multiDaySelected.has(d));
    days.forEach((d) => (allOn ? multiDaySelected.delete(d) : multiDaySelected.add(d)));
    renderMultiDayGrid();
  });

  document.getElementById('multiDayAll').addEventListener('click', () => {
    if (!selectedDateKey) return;
    const { baseDay, monthLen } = multiDayContext();
    for (let d = 1; d <= monthLen; d++) if (d !== baseDay) multiDaySelected.add(d);
    renderMultiDayGrid();
  });

  document.getElementById('multiDayClear').addEventListener('click', () => {
    multiDaySelected.clear();
    renderMultiDayGrid();
  });
}

function resetMultiDay() {
  multiDaySelected.clear();
  const block = document.getElementById('multiDayBlock');
  const toggle = document.getElementById('multiDayToggle');
  const panel = document.getElementById('multiDayPanel');
  if (block) block.style.display = '';
  if (toggle) toggle.checked = false;
  if (panel) panel.style.display = 'none';
}

/* ============ SHIFT FORM ============ */
function bindShiftForm() {
  document.getElementById('shiftForm').addEventListener('submit', (e) => { e.preventDefault(); saveShiftFromForm(); });
  document.getElementById('cancelShiftEdit').addEventListener('click', resetShiftForm);
  document.getElementById('shiftStart').addEventListener('change', () => {
    updateShiftTypeBadge();
    updateDurationSuggestions();
  });
  document.getElementById('shiftEnd').addEventListener('change', () => {
    updateShiftTypeBadge();
    updateDurationPreview();
  });
  document.getElementById('shiftIsHoliday').addEventListener('change', () => {
    holidayManual = true;
    updateShiftTypeBadge();
  });

  document.querySelectorAll('.dur-chip').forEach((chip) => {
    chip.addEventListener('click', () => applyDurationChip(Number(chip.dataset.hours)));
  });

  bindInlinePharmacy();
  bindMultiDay();
}

function resetShiftForm() {
  document.getElementById('shiftEditId').value = '';
  document.getElementById('shiftStart').value = '';
  document.getElementById('shiftEnd').value = '';
  document.getElementById('shiftDeputySelect').value = '';
  document.getElementById('shiftNote').value = '';
  document.getElementById('shiftIsHoliday').checked = false;
  holidayManual = false;

  const suggestEl = document.getElementById('durationSuggestions');
  if (suggestEl) {
    suggestEl.style.display = 'none';
    suggestEl.classList.remove('duration-suggestions--visible');
  }
  document.querySelectorAll('.dur-chip').forEach((c) => c.classList.remove('dur-chip--selected'));
  const previewEl = document.getElementById('durationPreview');
  if (previewEl) previewEl.textContent = '';

  document.getElementById('saveShiftBtn').textContent = 'ثبت شیفت';
  document.getElementById('cancelShiftEdit').hidden = true;
  document.getElementById('shiftCustomRate').value = '';

  closeInlinePharmacy(false);
  resetMultiDay();
  updateShiftTypeBadge();
}

function saveShiftFromForm() {
  const editId     = document.getElementById('shiftEditId').value;
  const pharmacyId = document.getElementById('shiftPharmacySelect').value;
  const start      = document.getElementById('shiftStart').value;
  const end        = document.getElementById('shiftEnd').value;
  const note       = document.getElementById('shiftNote').value.trim();
  const holidayChk = document.getElementById('shiftIsHoliday').checked;
  const deputyId   = document.getElementById('shiftDeputySelect').value || null;

  if (!pharmacyId || pharmacyId === NEW_PHARMACY_VALUE) {
    showToast('داروخانه را انتخاب کنید یا داروخانه جدید اضافه کنید');
    return;
  }
  if (!start || !end) { showToast('ساعت شروع و پایان را وارد کنید'); return; }

  const customRateRaw = S.toLatinDigits(document.getElementById('shiftCustomRate').value).trim();
  const customRate = customRateRaw !== '' ? (parseFloat(customRateRaw) || 0) : null;

  const isNight = S.isNightShift(start, end);
  const base = J.parseJalaliKey(selectedDateKey);

  // Friday is always a holiday. A manual "holiday" tick applies to the base day,
  // and to the extra days only if the user really ticked it themselves.
  const holidayFor = (day, isBase) =>
    S.isFridayHoliday(J.jalaliWeekday(base.jy, base.jm, day)) ||
    (isBase ? holidayChk : (holidayManual && holidayChk));

  if (editId) {
    const s = shifts.find((x) => x.id === editId);
    if (s) Object.assign(s, {
      pharmacyId, start, end, note, isNight,
      isHoliday: holidayFor(base.jd, true), customRate, deputyId,
    });
    showToast('شیفت به‌روزرسانی شد');
  } else {
    const multiOn = !!document.getElementById('multiDayToggle')?.checked;
    const days = [base.jd];
    if (multiOn) multiDaySelected.forEach((d) => { if (d !== base.jd) days.push(d); });
    days.sort((a, b) => a - b);

    let added = 0;
    let skipped = 0;
    days.forEach((day) => {
      const isBase = day === base.jd;
      const dateKey = J.jalaliKey(base.jy, base.jm, day);
      const duplicate = !isBase && shifts.some((x) =>
        x.dateKey === dateKey && x.pharmacyId === pharmacyId && x.start === start && x.end === end);
      if (duplicate) { skipped++; return; }

      shifts.push({
        id: S.uid(), dateKey, pharmacyId, start, end, note, isNight,
        isHoliday: holidayFor(day, isBase), customRate, deputyId,
      });
      added++;
    });

    showToast(added > 1
      ? `${J.toPersianDigits(added)} شیفت ثبت شد${skipped ? ` (${J.toPersianDigits(skipped)} تکراری رد شد)` : ''}`
      : 'شیفت ثبت شد');
  }

  S.saveShifts(shifts);
  resetShiftForm();
  renderExistingShiftsForDay();
  renderCalendar();
}
function updateShiftTypeBadge() {
  const start = document.getElementById('shiftStart').value;
  const end = document.getElementById('shiftEnd').value;
  const holiday = document.getElementById('shiftIsHoliday').checked;
  const badge = document.getElementById('shiftTypeBadge');

  if (holiday) {
    badge.textContent = '🗓️ شیفت تعطیل';
    badge.className = 'shift-type-badge shift-type-badge--holiday';
    return;
  }

  if (!start || !end) {
    badge.textContent = '☀️ شیفت عادی';
    badge.className = 'shift-type-badge';
    return;
  }

  const { dayHours, nightHours } = S.splitShiftHours(start, end);

  if (dayHours > 0 && nightHours > 0) {
    badge.textContent = `☀️ ${dayHours.toFixed(1)}h عادی + 🌙 ${nightHours.toFixed(1)}h شب`;
    badge.className = 'shift-type-badge shift-type-badge--split';
  } else if (nightHours > 0) {
    badge.textContent = '🌙 شیفت شب';
    badge.className = 'shift-type-badge shift-type-badge--special';
  } else {
    badge.textContent = '☀️ شیفت عادی';
    badge.className = 'shift-type-badge';
  }
}

function updateDurationSuggestions() {
  const start = document.getElementById('shiftStart').value;
  const suggestEl = document.getElementById('durationSuggestions');
  if (!start) {
    suggestEl.style.display = 'none';
    return;
  }
  suggestEl.style.display = '';
  suggestEl.classList.add('duration-suggestions--visible');

  // Highlight chips whose suggested end would cross midnight (night shift)
  document.querySelectorAll('.dur-chip').forEach((chip) => {
    const hours = Number(chip.dataset.hours);
    const endVal = addHoursToTime(start, hours);
    const [sh] = start.split(':').map(Number);
    const [eh] = endVal.split(':').map(Number);
    const crossesNight = sh < 22 && eh >= 22 || sh >= 22 || (endVal < start);

    chip.classList.toggle('dur-chip--night', crossesNight);
    chip.title = `پایان: ${endVal}`;
  });

  updateDurationPreview();
}

function applyDurationChip(hours) {
  const start = document.getElementById('shiftStart').value;
  if (!start) return;

  const endVal = addHoursToTime(start, hours);
  document.getElementById('shiftEnd').value = endVal;

  // Highlight the selected chip
  document.querySelectorAll('.dur-chip').forEach((c) => {
    c.classList.toggle('dur-chip--selected', Number(c.dataset.hours) === hours);
  });

  updateDurationPreview();
  updateShiftTypeBadge();
}

function updateDurationPreview() {
  const start = document.getElementById('shiftStart').value;
  const end = document.getElementById('shiftEnd').value;
  const previewEl = document.getElementById('durationPreview');
  if (!previewEl) return;

  if (!start || !end) {
    previewEl.textContent = '';
    return;
  }

  const { dayHours, nightHours } = S.splitShiftHours(start, end);
  const totalH = dayHours + nightHours;


}

/** Add N hours to a HH:MM string, returns HH:MM (wraps past midnight) */
function addHoursToTime(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMin = h * 60 + m + hours * 60;
  const wrappedH = Math.floor(totalMin / 60) % 24;
  const wrappedM = totalMin % 60;
  return `${String(wrappedH).padStart(2, '0')}:${String(wrappedM).padStart(2, '0')}`;
}



function loadShiftIntoForm(id) {
  const s = shifts.find((x) => x.id === id);
  if (!s) return;
  document.getElementById('shiftEditId').value = s.id;
  document.getElementById('shiftPharmacySelect').value = s.pharmacyId;
  document.getElementById('shiftStart').value = s.start;
  document.getElementById('shiftEnd').value = s.end;
  document.getElementById('shiftNote').value = s.note || '';
  document.getElementById('shiftIsHoliday').checked = !!s.isHoliday;
  document.getElementById('shiftDeputySelect').value = s.deputyId || '';
  document.getElementById('saveShiftBtn').textContent = 'به‌روزرسانی';
  document.getElementById('cancelShiftEdit').hidden = false;
  updateShiftTypeBadge();
  document.getElementById('shiftPharmacySelect').focus();
  document.getElementById('shiftCustomRate').value = s.customRate != null ? s.customRate : '';
    document.getElementById('multiDayBlock').style.display = 'none';
  closeInlinePharmacy(false);
}



function deleteShift(id) {
  shifts = shifts.filter((x) => x.id !== id);
  S.saveShifts(shifts);
  renderExistingShiftsForDay();
  renderCalendar();
  showToast('شیفت حذف شد');
}

/* =================== PHARMACIES =================== */

/* ============ RATE HELPERS ============ */
function parseRate(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const n = parseFloat(S.toLatinDigits(el.value).trim());
  return n > 0 ? n : null;
}
function readRateInputs(prefix) {
  return { day: parseRate(prefix + 'Day'), night: parseRate(prefix + 'Night'), holiday: parseRate(prefix + 'Holiday') };
}
function writeRateInputs(prefix, rates) {
  const r = rates || {};
  [['Day', 'day'], ['Night', 'night'], ['Holiday', 'holiday']].forEach(([suffix, key]) => {
    const el = document.getElementById(prefix + suffix);
    if (el) el.value = r[key] > 0 ? r[key] : '';
  });
}
function bindRateInputs(prefix) {
  ['Day', 'Night', 'Holiday'].forEach((s) => bindLatinInput(prefix + s));
}
function refreshRatePlaceholders() {
  const d = settings.defaultRates || FALLBACK_RATES;
  ['newPharmRate', 'editPharmRate', 'inlineRate'].forEach((prefix) => {
    [['Day', 'day'], ['Night', 'night'], ['Holiday', 'holiday']].forEach(([suffix, key]) => {
      const el = document.getElementById(prefix + suffix);
      if (el) el.placeholder = `پیش‌فرض: ${Math.round(d[key]).toLocaleString('en')}`;
    });
  });
}

function renderDefaultRatesCard() {
  const d = settings.defaultRates || FALLBACK_RATES;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('defRateDay', d.day);
  set('defRateNight', d.night);
  set('defRateHoliday', d.holiday);
  refreshRatePlaceholders();
}

function bindDefaultRates() {
  ['defRateDay', 'defRateNight', 'defRateHoliday'].forEach(bindLatinInput);

  document.getElementById('saveDefaultRatesBtn').addEventListener('click', () => {
    const read = (id, fallback) => {
      const n = parseFloat(S.toLatinDigits(document.getElementById(id).value));
      return n > 0 ? n : fallback;
    };
    settings.defaultRates = {
      day:     read('defRateDay',     FALLBACK_RATES.day),
      night:   read('defRateNight',   FALLBACK_RATES.night),
      holiday: read('defRateHoliday', FALLBACK_RATES.holiday),
    };
    S.saveSettings(settings);
    renderDefaultRatesCard();
    renderPharmacyList();
    showToast('نرخ‌های پیش‌فرض ذخیره شد ✓');
  });

  document.getElementById('resetDefaultRatesBtn').addEventListener('click', () => {
    settings.defaultRates = { ...FALLBACK_RATES };
    S.saveSettings(settings);
    renderDefaultRatesCard();
    renderPharmacyList();
    showToast('نرخ‌ها به مقدار اولیه برگشت');
  });

  renderDefaultRatesCard();
}

/* ============ PHARMACY TAB ============ */
function bindPharmacyForm() {
  bindRateInputs('newPharmRate');
  bindRateInputs('editPharmRate');
  bindDefaultRates();

  document.getElementById('pharmacyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ni = document.getElementById('pharmacyNameInput');
    const ai = document.getElementById('pharmacyAddrInput');
    const name = ni.value.trim();
    if (!name) return;
    pharmacies.push({ id: S.uid(), name, address: ai.value.trim(), rates: readRateInputs('newPharmRate') });
    S.savePharmacies(pharmacies);
    ni.value = ''; ai.value = '';
    writeRateInputs('newPharmRate', null);
    renderPharmacyList();
    renderPharmacySelect();
    showToast('داروخانه اضافه شد');
  });
  bindPharmacyEdit();
}

function bindPharmacyEdit() {
  document.getElementById('cancelPharmacyEditBtn').addEventListener('click', closePharmacyEdit);

  document.getElementById('savePharmacyEditBtn').addEventListener('click', () => {
    const id = document.getElementById('editPharmacyId').value;
    const newName = document.getElementById('editPharmacyName').value.trim();
    const newAddr = document.getElementById('editPharmacyAddr').value.trim();
    if (!newName) { showToast('نام داروخانه نمی‌تواند خالی باشد'); return; }

    const p = pharmacies.find((x) => x.id === id);
    if (!p) return;

    p.name = newName;
    p.address = newAddr;
    p.rates = readRateInputs('editPharmRate');
    S.savePharmacies(pharmacies);

    closePharmacyEdit();
    renderPharmacyList();
    renderPharmacySelect();
    renderCalendar();
    showToast('داروخانه ویرایش شد ✓');
  });
}

function openPharmacyEdit(id) {
  const p = pharmacies.find((x) => x.id === id);
  if (!p) return;
  document.getElementById('editPharmacyId').value = p.id;
  document.getElementById('editPharmacyName').value = p.name;
  document.getElementById('editPharmacyAddr').value = p.address || '';
  writeRateInputs('editPharmRate', p.rates);
  refreshRatePlaceholders();

  const form = document.getElementById('pharmacyEditForm');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('editPharmacyName').focus();
}

function closePharmacyEdit() {
  document.getElementById('pharmacyEditForm').style.display = 'none';
  document.getElementById('editPharmacyId').value = '';
  document.getElementById('editPharmacyName').value = '';
  document.getElementById('editPharmacyAddr').value = '';
  writeRateInputs('editPharmRate', null);
}

function pharmacyRatesHtml(p) {
  const d = settings.defaultRates || FALLBACK_RATES;
  const r = p.rates || {};
  const part = (icon, key) => {
    const own = r[key] > 0;
    const v = own ? r[key] : d[key];
    return `${icon} ${J.toPersianDigits(Math.round(v).toLocaleString('en'))}` +
           (own ? '' : '<span class="rate-default-tag"> (پیش‌فرض)</span>');
  };
  return `${part('☀️', 'day')} · ${part('🌙', 'night')} · ${part('🗓️', 'holiday')}`;
}

function renderPharmacyList() {
  const list = document.getElementById('pharmacyList');
  if (pharmacies.length === 0) {
    list.innerHTML = '<li class="pharmacy-empty">هنوز داروخانه‌ای ثبت نشده است.</li>';
    return;
  }
  list.innerHTML = '';
  pharmacies.forEach((p) => {
    const cnt = shifts.filter((s) => s.pharmacyId === p.id).length;
    const li = document.createElement('li');
    li.className = 'pharmacy-item';
    li.innerHTML = `
      <div>
        <div class="pharmacy-item__name">${escapeHtml(p.name)}</div>
        ${p.address ? `<div class="pharmacy-item__addr">${escapeHtml(p.address)}</div>` : ''}
        <div class="pharmacy-item__addr">${J.toPersianDigits(cnt)} شیفت</div>
        <div class="pharmacy-item__rates">${pharmacyRatesHtml(p)}</div>
      </div>
      <div class="pharmacy-item__actions">
        <button class="pharmacy-item__edit" data-id="${p.id}">ویرایش</button>
        <button class="pharmacy-item__del" data-id="${p.id}">حذف</button>
      </div>`;
    list.appendChild(li);
  });
  list.querySelectorAll('.pharmacy-item__del').forEach((b) => b.addEventListener('click', () => deletePharmacy(b.dataset.id)));
  list.querySelectorAll('.pharmacy-item__edit').forEach((b) => b.addEventListener('click', () => openPharmacyEdit(b.dataset.id)));
}

/* ============ PHARMACY DROPDOWN + INLINE "ADD PHARMACY" ============ */
const NEW_PHARMACY_VALUE = '__new__';
let lastPharmacyValue = '';

function renderPharmacySelect() {
  const sel = document.getElementById('shiftPharmacySelect');
  const prev = (sel.value && sel.value !== NEW_PHARMACY_VALUE) ? sel.value : lastPharmacyValue;

  const options = pharmacies.length === 0
    ? '<option value="">— ابتدا یک داروخانه اضافه کنید</option>'
    : pharmacies.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');

  sel.innerHTML = options + `<option value="${NEW_PHARMACY_VALUE}">＋ افزودن داروخانه جدید…</option>`;

  if (prev && pharmacies.some((p) => p.id === prev)) sel.value = prev;
  else sel.value = pharmacies.length ? pharmacies[0].id : '';
  lastPharmacyValue = sel.value;
}

function bindInlinePharmacy() {
  const sel = document.getElementById('shiftPharmacySelect');
  sel.addEventListener('change', () => {
    if (sel.value === NEW_PHARMACY_VALUE) {
      openInlinePharmacy();
    } else {
      lastPharmacyValue = sel.value;
      closeInlinePharmacy(false);
    }
  });

  bindRateInputs('inlineRate');
  document.getElementById('inlinePharmSave').addEventListener('click', saveInlinePharmacy);
  document.getElementById('inlinePharmCancel').addEventListener('click', () => closeInlinePharmacy(true));

  // Enter inside these fields must NOT submit the whole shift form
  ['inlinePharmName', 'inlinePharmAddr', 'inlineRateDay', 'inlineRateNight', 'inlineRateHoliday'].forEach((id) => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); saveInlinePharmacy(); }
    });
  });
}

function openInlinePharmacy() {
  refreshRatePlaceholders();
  document.getElementById('inlinePharmacyForm').style.display = '';
  document.getElementById('inlinePharmName').focus();
}

function closeInlinePharmacy(restoreSelection) {
  const form = document.getElementById('inlinePharmacyForm');
  if (!form) return;
  form.style.display = 'none';
  document.getElementById('inlinePharmName').value = '';
  document.getElementById('inlinePharmAddr').value = '';
  writeRateInputs('inlineRate', null);
  if (restoreSelection) {
    const sel = document.getElementById('shiftPharmacySelect');
    sel.value = pharmacies.some((p) => p.id === lastPharmacyValue) ? lastPharmacyValue : (pharmacies[0] ? pharmacies[0].id : '');
  }
}

function saveInlinePharmacy() {
  const name = document.getElementById('inlinePharmName').value.trim();
  if (!name) { showToast('نام داروخانه را وارد کنید'); return; }

  const pharmacy = {
    id: S.uid(),
    name,
    address: document.getElementById('inlinePharmAddr').value.trim(),
    rates: readRateInputs('inlineRate'),
  };
  pharmacies.push(pharmacy);
  S.savePharmacies(pharmacies);

  renderPharmacyList();
  renderPharmacySelect();
  document.getElementById('shiftPharmacySelect').value = pharmacy.id;
  lastPharmacyValue = pharmacy.id;
  closeInlinePharmacy(false);
  showToast(`داروخانه «${name}» اضافه و انتخاب شد ✓`);
}

function deletePharmacy(id) {
  const used = shifts.filter((s) => s.pharmacyId === id).length;
  if (used > 0 && !confirm(`این داروخانه در ${used} شیفت استفاده شده. حذف شود؟`)) return;
  shifts = shifts.filter((s) => s.pharmacyId !== id);
  pharmacies = pharmacies.filter((p) => p.id !== id);
  S.saveShifts(shifts); S.savePharmacies(pharmacies);
  renderPharmacyList(); renderPharmacySelect(); renderCalendar();
  showToast('داروخانه حذف شد');
}
/* =================== DEPUTIES =================== */

function bindDeputyForm() {
  document.getElementById('deputyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ni = document.getElementById('deputyNameInput');
    const pi = document.getElementById('deputyPhoneInput');
    const name = ni.value.trim();
    if (!name) return;
    deputies.push({ id: S.uid(), name, phone: pi.value.trim() });
    S.saveDeputies(deputies);
    ni.value = ''; pi.value = '';
    renderDeputyList();
    renderDeputySelect();
    renderDeputyFilterOptions();
    showToast('قائم مقام اضافه شد');
  });
}

function renderDeputyList() {
  const list = document.getElementById('deputyList');
  if (!list) return;

  if (deputies.length === 0) {
    list.innerHTML = '<li class="pharmacy-empty">هنوز قائم مقامی ثبت نشده است.</li>';
    document.getElementById('deputyReportSection').style.display = 'none';
    return;
  }

  list.innerHTML = '';
  deputies.forEach((d) => {
    const shiftCount = shifts.filter((s) => s.deputyId === d.id).length;
    const li = document.createElement('li');
    li.className = 'pharmacy-item';
    li.innerHTML = `
      <div>
        <div class="pharmacy-item__name">${escapeHtml(d.name)}</div>
        ${d.phone ? `<div class="pharmacy-item__addr">📞 ${escapeHtml(d.phone)}</div>` : ''}
        <div class="pharmacy-item__addr">${J.toPersianDigits(shiftCount)} شیفت واگذار شده</div>
      </div>
      <div class="pharmacy-item__actions">
        <button class="pharmacy-item__edit deputy-view-btn" data-id="${d.id}">گزارش</button>
        <button class="pharmacy-item__del deputy-del-btn" data-id="${d.id}">حذف</button>
      </div>`;
    list.appendChild(li);
  });

  list.querySelectorAll('.deputy-del-btn').forEach((b) =>
    b.addEventListener('click', () => deleteDeputy(b.dataset.id)));
  list.querySelectorAll('.deputy-view-btn').forEach((b) =>
    b.addEventListener('click', () => renderDeputyReport(b.dataset.id)));
}

function deleteDeputy(id) {
  const used = shifts.filter((s) => s.deputyId === id).length;
  if (used > 0 && !confirm(`این قائم مقام در ${used} شیفت ثبت شده. حذف شود؟`)) return;
  // Clear deputyId from shifts
  shifts.forEach((s) => { if (s.deputyId === id) s.deputyId = null; });
  deputies = deputies.filter((d) => d.id !== id);
  S.saveDeputies(deputies);
  S.saveShifts(shifts);
  renderDeputyList();
  renderDeputySelect();
  renderDeputyFilterOptions();
  showToast('قائم مقام حذف شد');
}

function renderDeputyReport(deputyId) {
  const d = deputies.find((x) => x.id === deputyId);
  if (!d) return;
  const deputyShifts = shifts
    .filter((s) => s.deputyId === deputyId)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.start.localeCompare(b.start));

  const section = document.getElementById('deputyReportSection');
  section.style.display = '';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('deputyReportTitle').textContent = `گزارش — ${d.name}`;

  const totalH = deputyShifts.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
  const totalInc = deputyShifts.reduce((s, x) => s + calcIncome(x), 0);

  document.getElementById('deputyStatGrid').innerHTML = `
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(deputyShifts.length)}</span><span class="statcard__label">تعداد شیفت واگذاری</span></div>
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(totalH.toFixed(1))}</span><span class="statcard__label">مجموع ساعت</span></div>
    <div class="statcard statcard--unpaid"><span class="statcard__value" style="font-size:14px">${formatToman(totalInc)}</span><span class="statcard__label">مبلغ بدهی به قائم مقام</span></div>`;

  const tbody = document.querySelector('#deputyShiftsTable tbody');
  tbody.innerHTML = deputyShifts.length === 0
    ? '<tr class="empty-row"><td colspan="6">شیفتی ثبت نشده</td></tr>'
    : deputyShifts.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const h = S.shiftDurationHours(s.start, s.end);
      const inc = calcIncome(s);
      return `<tr>
          <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]} ${J.toPersianDigits(jy)}</td>
          <td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>
          <td class="num">${s.start}</td>
          <td class="num">${s.end}</td>
          <td class="num">${J.toPersianDigits(h.toFixed(1))}</td>
          <td class="num">${formatToman(inc)}</td>
        </tr>`;
    }).join('');
}


function bindReportMonthPickers() {
  // ── Summary tab ──────────────────────────────────────────
  document.getElementById('summaryPrevMonth').addEventListener('click', () => {
    summaryMonth--;
    if (summaryMonth < 1) { summaryMonth = 12; summaryYear--; }
    updateSummaryMonthLabel();
    renderSummary();
  });
  document.getElementById('summaryNextMonth').addEventListener('click', () => {
    summaryMonth++;
    if (summaryMonth > 12) { summaryMonth = 1; summaryYear++; }
    updateSummaryMonthLabel();
    renderSummary();
  });
  document.getElementById('summaryThisMonth').addEventListener('click', () => {
    summaryYear  = todayJ.jy;
    summaryMonth = todayJ.jm;
    updateSummaryMonthLabel();
    renderSummary();
  });

  // ── Financial tab ─────────────────────────────────────────
  document.getElementById('financialPrevMonth').addEventListener('click', () => {
    financialMonth--;
    if (financialMonth < 1) { financialMonth = 12; financialYear--; }
    updateFinancialMonthLabel();
    renderFinancial();
    renderTrendChart();
  });
  document.getElementById('financialNextMonth').addEventListener('click', () => {
    financialMonth++;
    if (financialMonth > 12) { financialMonth = 1; financialYear++; }
    updateFinancialMonthLabel();
    renderFinancial();
    renderTrendChart();
  });
  document.getElementById('financialThisMonth').addEventListener('click', () => {
    financialYear  = todayJ.jy;
    financialMonth = todayJ.jm;
    updateFinancialMonthLabel();
    renderFinancial();
    renderTrendChart();
  });

  updateSummaryMonthLabel();
  updateFinancialMonthLabel();
}

function updateSummaryMonthLabel() {
  const el = document.getElementById('summaryMonthLabel');
  if (el) el.textContent = `${J.PERSIAN_MONTHS[summaryMonth - 1]} ${J.toPersianDigits(summaryYear)}`;
}

function updateFinancialMonthLabel() {
  const el = document.getElementById('financialMonthLabel');
  if (el) el.textContent = `${J.PERSIAN_MONTHS[financialMonth - 1]} ${J.toPersianDigits(financialYear)}`;
}
/* =================== SHARED FILTER HELPERS =================== */

function bindReportFilter() {
  document.getElementById('reportPharmacyFilter').addEventListener('change', (e) => {
    reportPharmacyFilter = e.target.value; renderSummary();
  });
  document.getElementById('reportDeputyFilter')?.addEventListener('change', (e) => {
    reportDeputyFilter = e.target.value; renderSummary();
  });
}

function renderFilterOptions(selectId, currentFilter) {
  const sel = document.getElementById(selectId);
  const prev = sel.value || currentFilter;
  sel.innerHTML = ['<option value="all">همه داروخانه‌ها</option>']
    .concat(pharmacies.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)).join('');
  sel.value = (prev === 'all' || pharmacies.some((p) => p.id === prev)) ? prev : 'all';
  return sel.value;
}
function renderDeputyFilterOptions() {
  ['reportDeputyFilter', 'financialDeputyFilter'].forEach((selId) => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="all">همه (با و بدون قائم مقام)</option>
      <option value="none">بدون قائم مقام</option>
      ${deputies.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}`;
    if (prev && (prev === 'all' || prev === 'none' || deputies.some((d) => d.id === prev)))
      sel.value = prev;
  });
}

function renderDeputySelect() {
  const sel = document.getElementById('shiftDeputySelect');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = `<option value="">— بدون قائم مقام</option>
    ${deputies.map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('')}`;
  if (prev && deputies.some((d) => d.id === prev)) sel.value = prev;
}
function deputyName(id) {
  if (!id) return '—';
  const d = deputies.find((x) => x.id === id);
  return d ? d.name : '—';
}

function getMonthShifts(pharmacyFilter, deputyFilter = 'all', forYear = null, forMonth = null) {
  const yr = forYear  !== null ? forYear  : viewYear;
  const mo = forMonth !== null ? forMonth : viewMonth;
  return shifts.filter((s) => {
    const { jy, jm } = J.parseJalaliKey(s.dateKey);
    if (jy !== yr || jm !== mo) return false;
    if (pharmacyFilter !== 'all' && s.pharmacyId !== pharmacyFilter) return false;
    if (deputyFilter === 'none' && s.deputyId) return false;
    if (deputyFilter !== 'all' && deputyFilter !== 'none' && s.deputyId !== deputyFilter) return false;
    return true;
  }).sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.start.localeCompare(b.start));
}

/* =================== MONTHLY SUMMARY VIEW =================== */

function renderSummary() {
  renderDeputyFilterOptions();
  reportPharmacyFilter = renderFilterOptions('reportPharmacyFilter', reportPharmacyFilter);
  const ms = getMonthShifts(reportPharmacyFilter, reportDeputyFilter, viewYear, viewMonth);

  const totalH = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);

  // Holiday shifts count entirely as special
  // Non-holiday shifts split into day/night portions
  let normalH = 0;
  let specialH = 0;
  ms.forEach((x) => {
    if (x.isHoliday) {
      specialH += S.shiftDurationHours(x.start, x.end);
    } else {
      const { dayHours, nightHours } = S.splitShiftHours(x.start, x.end);
      normalH += dayHours;
      specialH += nightHours;
    }
  });
  const uniqueDays = new Set(ms.map((x) => x.dateKey)).size;
  const isSingle = reportPharmacyFilter !== 'all';

  const scopeLbl = isSingle
    ? `${escapeHtml(pharmacyName(reportPharmacyFilter))} — ${J.PERSIAN_MONTHS[viewMonth-1]}`
    : J.PERSIAN_MONTHS[viewMonth-1] + ' ' + J.toPersianDigits(viewYear);

  // Separate holiday hours from night hours for display
  let holidayH = 0;
  let nightH = 0;
  let dayH = 0;
  ms.forEach((x) => {
    if (x.isHoliday) {
      holidayH += S.shiftDurationHours(x.start, x.end);
    } else {
      const { dayHours, nightHours } = S.splitShiftHours(x.start, x.end);
      dayH += dayHours;
      nightH += nightHours;
    }
  });

  document.getElementById('statGrid').innerHTML = `
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(ms.length)}</span><span class="statcard__label">تعداد شیفت — ${scopeLbl}</span></div>
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(totalH.toFixed(1))}</span><span class="statcard__label">مجموع ساعت</span></div>
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(dayH.toFixed(1))}</span><span class="statcard__label">☀️ ساعت عادی</span></div>
    <div class="statcard statcard--special"><span class="statcard__value">${J.toPersianDigits(nightH.toFixed(1))}</span><span class="statcard__label">🌙 ساعت شب</span></div>
    <div class="statcard statcard--holiday"><span class="statcard__value">${J.toPersianDigits(holidayH.toFixed(1))}</span><span class="statcard__label">🗓️ ساعت تعطیل</span></div>`;

  // pharmacy breakdown
  const breakdown = {};
  ms.forEach((s) => {
    if (!breakdown[s.pharmacyId]) breakdown[s.pharmacyId] = { dayH: 0, nightH: 0, holidayH: 0 };
    if (s.isHoliday) {
      breakdown[s.pharmacyId].holidayH += S.shiftDurationHours(s.start, s.end);
    } else {
      const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
      breakdown[s.pharmacyId].dayH += dayHours;
      breakdown[s.pharmacyId].nightH += nightHours;
    }
  });
  const breakdownBody = document.querySelector('#pharmacyBreakdownTable tbody');
  const entries = Object.entries(breakdown).sort((a, b) =>
    (b[1].dayH + b[1].nightH + b[1].holidayH) - (a[1].dayH + a[1].nightH + a[1].holidayH));
  breakdownBody.innerHTML = entries.length === 0
    ? '<tr class="empty-row"><td colspan="5">شیفتی ثبت نشده</td></tr>'
    : entries.map(([pid, d]) => `<tr>
        <td>${escapeHtml(pharmacyName(pid))}</td>
        <td>${J.toPersianDigits(d.dayH.toFixed(1))}</td>
        <td class="cell--special">${J.toPersianDigits(d.nightH.toFixed(1))}</td>
        <td class="cell--holiday">${J.toPersianDigits(d.holidayH.toFixed(1))}</td>
        <td>${J.toPersianDigits((d.dayH + d.nightH + d.holidayH).toFixed(1))}</td>
      </tr>`).join('');

  // shift list
  const listBody = document.querySelector('#monthShiftsTable tbody');
  listBody.innerHTML = ms.length === 0
    ? '<tr class="empty-row"><td colspan="8">شیفتی ثبت نشده</td></tr>'
    : ms.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const wi = J.jalaliWeekday(jy, jm, jd);
      const h = S.shiftDurationHours(s.start, s.end);
      const sp = isSpecialShift(s);
      return `<tr class="${sp ? 'row--special' : ''}">
          <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}</td>
          <td>${J.PERSIAN_WEEKDAYS[wi]}</td>
          <td>${sp ? '🌙 شب' : '☀️ عادی'}</td>
          <td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>
          <td class="num">${s.start}</td>
          <td class="num">${s.end}</td>
          <td class="num">${J.toPersianDigits(h.toFixed(1))}</td>
          <td><button class="rowdelete" data-id="${s.id}">حذف</button></td>
        </tr>`;
    }).join('');

  document.querySelector('#monthShiftsTable tbody')
    .querySelectorAll('.rowdelete').forEach((b) => b.addEventListener('click', () => { deleteShift(b.dataset.id); renderSummary(); }));
}

/* ============ MONTH SYNC + NAV ============ */
function setViewMonth(y, m) {
  viewYear = y;
  viewMonth = m;
  refreshMonthViews();
}

function shiftViewMonth(delta) {
  let m = viewMonth + delta;
  let y = viewYear;
  while (m < 1)  { m += 12; y--; }
  while (m > 12) { m -= 12; y++; }
  setViewMonth(y, m);
}

function refreshMonthViews() {
  updateReportMonthLabels();
  renderCalendar();
  const active = document.querySelector('.view[data-active="true"]');
  if (!active) return;
  if (active.id === 'view-summary')   renderSummary();
  if (active.id === 'view-financial') renderFinancial();
}

function updateReportMonthLabels() {
  const text = `${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}`;
  ['summaryMonthLabel', 'financialMonthLabel'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
}

function bindMonthControls() {
  document.getElementById('prevMonth').addEventListener('click', () => shiftViewMonth(-1));
  document.getElementById('nextMonth').addEventListener('click', () => shiftViewMonth(1));
  document.getElementById('gotoToday').addEventListener('click', () => setViewMonth(todayJ.jy, todayJ.jm));
}

function bindReportMonthPickers() {
  ['summary', 'financial'].forEach((p) => {
    document.getElementById(`${p}PrevMonth`).addEventListener('click', () => shiftViewMonth(-1));
    document.getElementById(`${p}NextMonth`).addEventListener('click', () => shiftViewMonth(1));
    document.getElementById(`${p}ThisMonth`).addEventListener('click', () => setViewMonth(todayJ.jy, todayJ.jm));
  });
  updateReportMonthLabels();
}

function switchView(target) {
  document.querySelectorAll('.navbtn, .bottom-nav__btn').forEach((b) =>
    b.classList.toggle('is-active', b.dataset.view === target));
  document.querySelectorAll('.view').forEach((v) =>
    v.setAttribute('data-active', String(v.id === `view-${target}`)));

  updateReportMonthLabels();
  if (target === 'summary')    renderSummary();
  if (target === 'financial')  renderFinancial();
  if (target === 'pharmacies') { renderPharmacyList(); renderDefaultRatesCard(); }
  if (target === 'deputies')   renderDeputyList();
}

function bindNav() {
  document.querySelectorAll('.navbtn, .bottom-nav__btn').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });
}

function openDaySheetForEdit(jy, jm, jd, shiftId) {
  switchView('calendar');
  setViewMonth(jy, jm);
  openDaySheet(jy, jm, jd);
  setTimeout(() => loadShiftIntoForm(shiftId), 60);
}

/* ============ DELETE A WHOLE MONTH ============ */
function bindDeleteMonth() {
  const btn = document.getElementById('deleteMonthBtn');
  if (btn) btn.addEventListener('click', deleteMonthShifts);
}

function deleteMonthShifts() {
  const inMonth = (s) => {
    const { jy, jm } = J.parseJalaliKey(s.dateKey);
    return jy === viewYear && jm === viewMonth;
  };
  const count = shifts.filter(inMonth).length;
  const label = `${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}`;

  if (count === 0) { showToast(`در ${label} شیفتی ثبت نشده است`); return; }

  const ok = confirm(
    `⚠️ ${J.toPersianDigits(count)} شیفت ماه ${label} (همه داروخانه‌ها) حذف می‌شود.\n\n` +
    `این کار قابل بازگشت نیست. ادامه می‌دهید؟`
  );
  if (!ok) return;

  shifts = shifts.filter((s) => !inMonth(s));
  S.saveShifts(shifts);

  // also clear "paid" flags of that month
  const pays = S.loadPayments();
  const prefix = S.paymentKey(viewYear, viewMonth, '');
  Object.keys(pays).forEach((k) => { if (k.startsWith(prefix)) delete pays[k]; });
  S.savePayments(pays);

  refreshMonthViews();
  renderPharmacyList();
  renderDeputyList();
  showToast(`${J.toPersianDigits(count)} شیفت حذف شد`);
}

/** Sanitize an input field — converts Persian/Arabic digits to Latin on every keystroke */
function bindLatinInput(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', () => {
    const pos = el.selectionStart;
    const before = el.value;
    el.value = S.toLatinDigits(before).replace(/[^0-9.\-]/g, '');
    // Restore cursor position as best we can
    try { el.setSelectionRange(pos, pos); } catch (e) { }
  });
}
/* =================== FINANCIAL VIEW =================== */

// function bindFinancialView() {
//   document.getElementById('rateNormal').value = settings.rateNormal || '';
//   document.getElementById('rateSpecial').value = settings.rateSpecial || '';
//   document.getElementById('financialDeputyFilter')?.addEventListener('change', (e) => {
//     financialDeputyFilter = e.target.value; renderFinancial();
//   });
//   document.getElementById('saveRatesBtn').addEventListener('click', () => {
//     settings.rateNormal = parseFloat(S.toLatinDigits(document.getElementById('rateNormal').value)) || 0;
//     settings.rateSpecial = parseFloat(S.toLatinDigits(document.getElementById('rateSpecial').value)) || 0;
//     S.saveSettings(settings);
//     renderFinancial();
//     showToast('نرخ‌ها ذخیره شد');
//   });

//   document.getElementById('financialPharmacyFilter').addEventListener('change', (e) => {
//     financialPharmacyFilter = e.target.value; renderFinancial();
//   });

//   bindBankAccounts();
//   // Accept Persian/Arabic digit input on all number fields
//   bindLatinInput('rateNormal');
//   bindLatinInput('rateSpecial');
//   bindLatinInput('shiftCustomRate');
// }

/* =================== BANK ACCOUNTS =================== */

let activeBankType = 'card'; // 'card' or 'sheba'

function bindBankAccounts() {
  renderBankAccountsList();
  // Accept Persian/Arabic digit input on bank number fields
  bindLatinInput('bankCardNumber');
  bindLatinInput('bankShebaNumber');

  // Toggle add form
  document.getElementById('toggleAddBankBtn').addEventListener('click', () => {
    const form = document.getElementById('bankAddForm');
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? '' : 'none';
    if (isHidden) {
      resetBankForm();
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Type buttons
  document.getElementById('typeBtnCard').addEventListener('click', () => setBankType('card'));
  document.getElementById('typeBtnSheba').addEventListener('click', () => setBankType('sheba'));

  // Card number auto-format as user types
  document.getElementById('bankCardNumber').addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = val.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  });

  // SHEBA number auto-format
  document.getElementById('bankShebaNumber').addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 24);
    // Format in groups: 2 4 4 4 4 4 4 2
    e.target.value = val.replace(/(.{4})/g, '$1 ').trimEnd();
  });

  // Save
  document.getElementById('saveBankBtn').addEventListener('click', saveBankAccount);

  // Cancel
  document.getElementById('cancelBankBtn').addEventListener('click', () => {
    document.getElementById('bankAddForm').style.display = 'none';
    resetBankForm();
  });
}

function setBankType(type) {
  activeBankType = type;
  document.getElementById('typeBtnCard').classList.toggle('is-active', type === 'card');
  document.getElementById('typeBtnSheba').classList.toggle('is-active', type === 'sheba');
  document.getElementById('cardNumberField').style.display = type === 'card' ? '' : 'none';
  document.getElementById('shebaNumberField').style.display = type === 'sheba' ? '' : 'none';
}

function resetBankForm() {
  document.getElementById('bankEditId').value = '';
  document.getElementById('bankOwnerName').value = '';
  document.getElementById('bankName').value = '';
  document.getElementById('bankCardNumber').value = '';
  document.getElementById('bankShebaNumber').value = '';
  setBankType('card');
  document.getElementById('saveBankBtn').textContent = 'ذخیره حساب';
}

function saveBankAccount() {
  const editId = document.getElementById('bankEditId').value;
  const ownerName = document.getElementById('bankOwnerName').value.trim();
  const bankName = document.getElementById('bankName').value.trim();
  const type = activeBankType;

  if (!ownerName) { showToast('نام صاحب حساب را وارد کنید'); return; }
  if (!bankName) { showToast('نام بانک را وارد کنید'); return; }

  let number = '';
  if (type === 'card') {
    const digits = S.toLatinDigits(document.getElementById('bankCardNumber').value).replace(/\D/g, '');
    if (digits.length !== 16) { showToast('شماره کارت باید ۱۶ رقم باشد'); return; }
    number = digits;
  } else {
    const digits = S.toLatinDigits(document.getElementById('bankShebaNumber').value).replace(/\D/g, '');
    if (digits.length !== 24) { showToast('شماره شبا باید ۲۴ رقم بعد از IR باشد'); return; }
    number = digits;
  }

  if (!settings.bankAccounts) settings.bankAccounts = [];

  if (editId) {
    const acc = settings.bankAccounts.find((a) => a.id === editId);
    if (acc) Object.assign(acc, { type, ownerName, bankName, number });
    showToast('حساب ویرایش شد ✓');
  } else {
    settings.bankAccounts.push({ id: S.uid(), type, ownerName, bankName, number });
    showToast('حساب بانکی اضافه شد ✓');
  }

  S.saveSettings(settings);
  document.getElementById('bankAddForm').style.display = 'none';
  resetBankForm();
  renderBankAccountsList();
}

function formatCardDisplay(digits) {
  return digits.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

function formatShebaDisplay(digits) {
  // IR + 24 digits formatted as IR XX XXXX XXXX XXXX XXXX XXXX XX
  const grouped = digits.replace(/(.{4})/g, '$1 ').trimEnd();
  return 'IR' + grouped;
}

function renderBankAccountsList() {
  const container = document.getElementById('bankAccountsList');
  if (!settings.bankAccounts || settings.bankAccounts.length === 0) {
    container.innerHTML = '<p class="bank-empty">حساب بانکی ثبت نشده است</p>';
    return;
  }

  container.innerHTML = settings.bankAccounts.map((acc) => {
    const displayNum = acc.type === 'card'
      ? formatCardDisplay(acc.number)
      : formatShebaDisplay(acc.number);
    const typeLabel = acc.type === 'card' ? '💳 کارت' : '🏦 شبا';

    return `<div class="bank-account-item" data-id="${acc.id}">
      <div class="bank-account-item__type">${typeLabel}</div>
      <div class="bank-account-item__info">
        <span class="bank-account-item__owner">${escapeHtml(acc.ownerName)}</span>
        <span class="bank-account-item__bank">${escapeHtml(acc.bankName)}</span>
        <span class="bank-account-item__number">${displayNum}</span>
      </div>
      <div class="bank-account-item__actions">
        <button class="minibtn bank-edit-btn" data-id="${acc.id}">ویرایش</button>
        <button class="minibtn bank-del-btn"  data-id="${acc.id}">حذف</button>
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.bank-edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => openBankEdit(btn.dataset.id));
  });
  container.querySelectorAll('.bank-del-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteBankAccount(btn.dataset.id));
  });
}

function openBankEdit(id) {
  const acc = (settings.bankAccounts || []).find((a) => a.id === id);
  if (!acc) return;

  document.getElementById('bankEditId').value = acc.id;
  document.getElementById('bankOwnerName').value = acc.ownerName;
  document.getElementById('bankName').value = acc.bankName;
  setBankType(acc.type);

  if (acc.type === 'card') {
    document.getElementById('bankCardNumber').value = formatCardDisplay(acc.number);
  } else {
    // Show without IR prefix, formatted
    const grouped = acc.number.replace(/(.{4})/g, '$1 ').trimEnd();
    document.getElementById('bankShebaNumber').value = grouped;
  }

  document.getElementById('saveBankBtn').textContent = 'به‌روزرسانی حساب';
  const form = document.getElementById('bankAddForm');
  form.style.display = '';
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function deleteBankAccount(id) {
  if (!confirm('این حساب بانکی حذف شود؟')) return;
  settings.bankAccounts = (settings.bankAccounts || []).filter((a) => a.id !== id);
  S.saveSettings(settings);
  renderBankAccountsList();
  showToast('حساب بانکی حذف شد');
}

/** Returns HTML block of bank accounts for PDF reports */
function bankAccountsPdfBlock() {
  const accounts = settings.bankAccounts || [];
  if (accounts.length === 0) return '';

  const rows = accounts.map((acc) => {
    const displayNum = acc.type === 'card'
      ? formatCardDisplay(acc.number)
      : formatShebaDisplay(acc.number);
    const typeLabel = acc.type === 'card' ? 'شماره کارت' : 'شماره شبا';
    return `<tr>
      <td>${escapeHtml(acc.ownerName)}</td>
      <td>${escapeHtml(acc.bankName)}</td>
      <td>${typeLabel}</td>
      <td class="bank-num">${displayNum}</td>
    </tr>`;
  }).join('');

  return `
    <div class="pr-bank-section">
      <p class="pr-section-title">اطلاعات حساب بانکی</p>
      <table class="pr-table pr-bank-table">
        <thead>
          <tr><th>صاحب حساب</th><th>بانک</th><th>نوع</th><th>شماره</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

/**
 * Calculate income for a shift using split day/night logic.
 * - Holiday: entire duration × rateSpecial (or customRate)
 * - Non-holiday: split into day/night, each multiplied by its rate
 * - customRate overrides BOTH rates if set
 */
// function calcIncome(shift) {
//   if (shift.customRate != null) {
//     // Custom rate applies to total hours regardless of day/night split
//     return S.shiftDurationHours(shift.start, shift.end) * shift.customRate;
//   }
//   if (shift.isHoliday) {
//     return S.shiftDurationHours(shift.start, shift.end) * settings.rateSpecial;
//   }
//   const { dayHours, nightHours } = S.splitShiftHours(shift.start, shift.end);
//   return (dayHours * settings.rateNormal) + (nightHours * settings.rateSpecial);
// }

/**
 * Returns a human-readable rate summary for the financial table.
 * For split shifts returns both rates, for holiday/custom returns one.
 */
function effectiveRate(shift) {
  if (shift.customRate != null) return shift.customRate;
  if (shift.isHoliday) return settings.rateSpecial;
  // For split shifts we return rateNormal as the "base" — the table will show split detail
  return settings.rateNormal;
}

function ratesForShift(shift) {
  const def = settings.defaultRates || FALLBACK_RATES;
  const ph  = pharmacies.find((p) => p.id === shift.pharmacyId);
  const own = (ph && ph.rates) || {};
  const pick = (k) => (own[k] > 0 ? own[k] : (def[k] > 0 ? def[k] : FALLBACK_RATES[k]));
  return { day: pick('day'), night: pick('night'), holiday: pick('holiday') };
}

function incomeParts(shift) {
  const hours = S.shiftDurationHours(shift.start, shift.end);
  if (shift.customRate != null) return { normal: hours * shift.customRate, special: 0 };
  const r = ratesForShift(shift);
  if (shift.isHoliday) return { normal: 0, special: hours * r.holiday };
  const { dayHours, nightHours } = S.splitShiftHours(shift.start, shift.end);
  return { normal: dayHours * r.day, special: nightHours * r.night };
}

function calcIncome(shift) {
  const p = incomeParts(shift);
  return p.normal + p.special;
}

function rateSource(shift) {
  if (shift.customRate != null) return 'اختصاصی شیفت';
  const ph = pharmacies.find((p) => p.id === shift.pharmacyId);
  const own = (ph && ph.rates) || {};
  return (own.day > 0 || own.night > 0 || own.holiday > 0) ? 'نرخ داروخانه' : 'پیش‌فرض';
}

function rateLabel(shift) {
  if (shift.customRate != null) return String(Math.round(shift.customRate));
  const r = ratesForShift(shift);
  if (shift.isHoliday) return String(Math.round(r.holiday));
  const { dayHours, nightHours } = S.splitShiftHours(shift.start, shift.end);
  if (dayHours > 0 && nightHours > 0) return `${Math.round(r.day)} / ${Math.round(r.night)}`;
  return String(Math.round(nightHours > 0 ? r.night : r.day));
}

function shiftTypeLabel(s) {
  if (s.isHoliday) return 'تعطیل';
  const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
  if (dayHours > 0 && nightHours > 0) return 'عادی + شب';
  return nightHours > 0 ? 'شب' : 'عادی';
}

function incomeBreakdown(shift) {
  const f = (n) => Math.round(n).toLocaleString('en');
  const hours = S.shiftDurationHours(shift.start, shift.end);
  if (shift.customRate != null) return `${hours.toFixed(1)}h × ${f(shift.customRate)}`;
  const r = ratesForShift(shift);
  if (shift.isHoliday) return `${hours.toFixed(1)}h × ${f(r.holiday)} (تعطیل)`;
  const { dayHours, nightHours } = S.splitShiftHours(shift.start, shift.end);
  const parts = [];
  if (dayHours > 0)   parts.push(`${dayHours.toFixed(1)}h × ${f(r.day)}`);
  if (nightHours > 0) parts.push(`${nightHours.toFixed(1)}h × ${f(r.night)} (شب)`);
  return parts.join(' + ');
}
/**
 * Returns a display string explaining how income was calculated for this shift.
 */
// function incomeBreakdown(shift) {
//   if (shift.customRate != null) {
//     const h = S.shiftDurationHours(shift.start, shift.end);
//     return `${h.toFixed(1)}h × ${shift.customRate.toLocaleString()}`;
//   }
//   if (shift.isHoliday) {
//     const h = S.shiftDurationHours(shift.start, shift.end);
//     return `${h.toFixed(1)}h × ${settings.rateSpecial.toLocaleString()} (تعطیل)`;
//   }
//   const { dayHours, nightHours } = S.splitShiftHours(shift.start, shift.end);
//   const parts = [];
//   if (dayHours > 0) parts.push(`${dayHours.toFixed(1)}h عادی`);
//   if (nightHours > 0) parts.push(`${nightHours.toFixed(1)}h شب`);
//   return parts.join(' + ');
// }

function formatToman(n) {
  if (n === 0) return '—';
  return J.toPersianDigits(Math.round(n).toLocaleString('en')) + ' تومان';
}
function bindFinancialView() {
  document.getElementById('financialDeputyFilter')?.addEventListener('change', (e) => {
    financialDeputyFilter = e.target.value; renderFinancial();
  });
  document.getElementById('financialPharmacyFilter').addEventListener('change', (e) => {
    financialPharmacyFilter = e.target.value; renderFinancial();
  });
  bindBankAccounts();
  bindLatinInput('shiftCustomRate');
}

function renderFinancial() {
  renderDeputyFilterOptions();
  financialPharmacyFilter = renderFilterOptions('financialPharmacyFilter', financialPharmacyFilter);
  const ms = getMonthShifts(financialPharmacyFilter, financialDeputyFilter || 'all');

  const totalIncome  = ms.reduce((s, x) => s + calcIncome(x), 0);
  const normalIncome = ms.reduce((s, x) => s + incomeParts(x).normal, 0);
  const specIncome   = ms.reduce((s, x) => s + incomeParts(x).special, 0);

  // per-pharmacy totals
  const byPharmacy = {};
  ms.forEach((s) => {
    const b = byPharmacy[s.pharmacyId] || (byPharmacy[s.pharmacyId] = { dayH: 0, nightH: 0, holidayH: 0, income: 0 });
    if (s.isHoliday) {
      b.holidayH += S.shiftDurationHours(s.start, s.end);
    } else {
      const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
      b.dayH += dayHours;
      b.nightH += nightHours;
    }
    b.income += calcIncome(s);
  });

  // payments
  const payments = S.loadPayments();
  const isPaidFor = (pid) => !!payments[S.paymentKey(viewYear, viewMonth, pid)];
  const paidIncome = Object.entries(byPharmacy).reduce((sum, [pid, b]) => sum + (isPaidFor(pid) ? b.income : 0), 0);
  const unpaidIncome = totalIncome - paidIncome;

  document.getElementById('financialStatGrid').innerHTML = `
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(ms.length)}</span><span class="statcard__label">تعداد شیفت</span></div>
    <div class="statcard"><span class="statcard__value" style="font-size:15px">${formatToman(totalIncome)}</span><span class="statcard__label">درآمد کل ماه</span></div>
    <div class="statcard"><span class="statcard__value" style="font-size:15px">${formatToman(normalIncome)}</span><span class="statcard__label">درآمد شیفت عادی</span></div>
    <div class="statcard statcard--special"><span class="statcard__value" style="font-size:15px">${formatToman(specIncome)}</span><span class="statcard__label">درآمد شب/تعطیل</span></div>
    <div class="statcard statcard--paid"><span class="statcard__value" style="font-size:15px">${formatToman(paidIncome)}</span><span class="statcard__label">دریافت شده</span></div>
    <div class="statcard statcard--unpaid"><span class="statcard__value" style="font-size:15px">${formatToman(unpaidIncome)}</span><span class="statcard__label">در انتظار دریافت</span></div>`;

  // pharmacy breakdown table
  const bEntries = Object.entries(byPharmacy).sort((a, b) => b[1].income - a[1].income);
  const breakdownTbody = document.querySelector('#financialBreakdownTable tbody');
  breakdownTbody.innerHTML = bEntries.length === 0
    ? '<tr class="empty-row"><td colspan="6">شیفتی ثبت نشده</td></tr>'
    : bEntries.map(([pid, d]) => {
      const paid = isPaidFor(pid);
      return `<tr class="${paid ? 'row--paid' : ''}">
          <td>${escapeHtml(pharmacyName(pid))}</td>
          <td>${J.toPersianDigits(d.dayH.toFixed(1))}</td>
          <td class="cell--special">${J.toPersianDigits(d.nightH.toFixed(1))}</td>
          <td class="cell--holiday">${J.toPersianDigits(d.holidayH.toFixed(1))}</td>
          <td class="num">${formatToman(d.income)}</td>
          <td class="payment-cell">
            <label class="payment-check" title="${paid ? 'پرداخت شده' : 'در انتظار پرداخت'}">
              <input type="checkbox" class="payment-checkbox" data-pid="${pid}" ${paid ? 'checked' : ''}>
              <span class="payment-check__box"></span>
              <span class="payment-check__label">${paid ? 'پرداخت شده' : 'در انتظار'}</span>
            </label>
          </td>
        </tr>`;
    }).join('');

  breakdownTbody.querySelectorAll('.payment-checkbox').forEach((chk) => {
    chk.addEventListener('change', () => {
      const pays = S.loadPayments();
      pays[S.paymentKey(viewYear, viewMonth, chk.dataset.pid)] = chk.checked;
      S.savePayments(pays);
      showToast(chk.checked ? '✅ پرداخت ثبت شد' : 'پرداخت لغو شد');
      renderFinancial();
    });
  });

  // deputy breakdown
  const depMap = {};
  ms.forEach((s) => {
    if (!s.deputyId) return;
    const d = depMap[s.deputyId] || (depMap[s.deputyId] = { count: 0, hours: 0, income: 0 });
    d.count++;
    d.hours += S.shiftDurationHours(s.start, s.end);
    d.income += calcIncome(s);
  });
  const depEntries = Object.entries(depMap).sort((a, b) => b[1].income - a[1].income);
  const depTitleEl = document.getElementById('deputyBreakdownTitle');
  const depWrapEl = document.getElementById('deputyBreakdownWrap');
  if (depTitleEl) depTitleEl.style.display = depEntries.length ? '' : 'none';
  if (depWrapEl) depWrapEl.style.display = depEntries.length ? '' : 'none';
  if (depEntries.length) {
    document.querySelector('#deputyBreakdownTable tbody').innerHTML = depEntries.map(([did, d]) => `<tr>
        <td>${escapeHtml(deputyName(did))}</td>
        <td>${J.toPersianDigits(d.count)}</td>
        <td>${J.toPersianDigits(d.hours.toFixed(1))}</td>
        <td class="num">${formatToman(d.income)}</td>
      </tr>`).join('');
  }

  // shift details
  const tbody = document.querySelector('#financialShiftsTable tbody');
  tbody.innerHTML = ms.length === 0
    ? '<tr class="empty-row"><td colspan="11">شیفتی ثبت نشده</td></tr>'
    : ms.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const wi = J.jalaliWeekday(jy, jm, jd);
      const h = S.shiftDurationHours(s.start, s.end);
      const src = rateSource(s);

      let typeIcon;
      if (s.isHoliday) typeIcon = '🗓️';
      else {
        const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
        typeIcon = (dayHours > 0 && nightHours > 0) ? '☀️🌙' : (nightHours > 0 ? '🌙' : '☀️');
      }
      const srcTag = src === 'اختصاصی شیفت'
        ? '<span class="custom-rate-active">اختصاصی</span>'
        : (src === 'نرخ داروخانه' ? '<span class="rate-src">داروخانه</span>' : '');

      return `<tr class="${isSpecialShift(s) ? 'row--special' : ''}" data-shift-id="${s.id}">
        <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}</td>
        <td>${J.PERSIAN_WEEKDAYS[wi]}</td>
        <td>${s.customRate != null ? '⭐' : typeIcon}</td>
        <td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>
        <td class="num">${s.start}</td>
        <td class="num">${s.end}</td>
        <td class="num">${J.toPersianDigits(h.toFixed(1))}</td>
        <td class="num rate-cell breakdown-cell">${incomeBreakdown(s)} ${srcTag}</td>
        <td class="num">${formatToman(calcIncome(s))}</td>
        <td class="deputy-cell">${s.deputyId ? `<span class="deputy-badge">${escapeHtml(deputyName(s.deputyId))}</span>` : ''}</td>
        <td><button class="rowedit" data-id="${s.id}" data-datekey="${s.dateKey}" type="button">ویرایش</button></td>
      </tr>`;
    }).join('');

  tbody.querySelectorAll('.rowedit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { jy, jm, jd } = J.parseJalaliKey(btn.dataset.datekey);
      openDaySheetForEdit(jy, jm, jd, btn.dataset.id);
    });
  });
}

// function renderFinancial() {
//   renderDeputyFilterOptions();
//   financialPharmacyFilter = renderFilterOptions('financialPharmacyFilter', financialPharmacyFilter);
//   const ms = getMonthShifts(financialPharmacyFilter, financialDeputyFilter || 'all', financialYear, financialMonth);

//   const totalIncome = ms.reduce((s, x) => s + calcIncome(x), 0);
//   const totalH = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);

//   // Split income correctly: holiday → special, others → split by hour
//   let normalIncome = 0;
//   let specIncome = 0;
//   ms.forEach((x) => {
//     if (x.customRate != null) {
//       // Custom rate: count income as normal (it's a user-defined rate)
//       normalIncome += calcIncome(x);
//     } else if (x.isHoliday) {
//       specIncome += calcIncome(x);
//     } else {
//       const { dayHours, nightHours } = S.splitShiftHours(x.start, x.end);
//       normalIncome += dayHours * settings.rateNormal;
//       specIncome += nightHours * settings.rateSpecial;
//     }
//   });
//   // Payment tracking
//   const payments = S.loadPayments();
//   const breakdown2 = {};
//   ms.forEach((s) => {
//     if (!breakdown2[s.pharmacyId]) breakdown2[s.pharmacyId] = 0;
//     breakdown2[s.pharmacyId] += calcIncome(s);
//   });
//   const paidIncome = Object.entries(breakdown2).reduce((sum, [pid, inc]) => {
//     const key = S.paymentKey(financialYear, financialMonth, pid);
//     return sum + (payments[key] ? inc : 0);
//   }, 0);
//   const unpaidIncome = totalIncome - paidIncome;

//   document.getElementById('financialStatGrid').innerHTML = `
//     <div class="statcard"><span class="statcard__value">${J.toPersianDigits(ms.length)}</span><span class="statcard__label">تعداد شیفت</span></div>
//     <div class="statcard"><span class="statcard__value" style="font-size:15px">${formatToman(totalIncome)}</span><span class="statcard__label">درآمد کل ماه</span></div>
//      <div class="statcard"><span class="statcard__value" style="font-size:15px">${formatToman(normalIncome)}</span><span class="statcard__label">درآمد شیفت عادی</span></div>
//     <div class="statcard statcard--special"><span class="statcard__value" style="font-size:15px">${formatToman(specIncome)}</span><span class="statcard__label">درآمد شب/تعطیل</span></div>
    
//     <div class="statcard statcard--paid"><span class="statcard__value" style="font-size:15px">${formatToman(paidIncome)}</span><span class="statcard__label">دریافت شده</span></div>
//     <div class="statcard statcard--unpaid"><span class="statcard__value" style="font-size:15px">${formatToman(unpaidIncome)}</span><span class="statcard__label">در انتظار دریافت</span></div>`;
//   // breakdown by pharmacy
//   const breakdown = {};
//   ms.forEach((s) => {
//     if (!breakdown[s.pharmacyId]) breakdown[s.pharmacyId] = { dayH: 0, nightH: 0, holidayH: 0, income: 0 };
//     if (s.isHoliday) {
//       breakdown[s.pharmacyId].holidayH += S.shiftDurationHours(s.start, s.end);
//     } else {
//       const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
//       breakdown[s.pharmacyId].dayH += dayHours;
//       breakdown[s.pharmacyId].nightH += nightHours;
//     }
//     breakdown[s.pharmacyId].income += calcIncome(s);
//   });
//   const bEntries = Object.entries(breakdown).sort((a, b) => b[1].income - a[1].income);
//   const breakdownTbody = document.querySelector('#financialBreakdownTable tbody');
//   breakdownTbody.innerHTML = bEntries.length === 0
//     ? '<tr class="empty-row"><td colspan="6">شیفتی ثبت نشده</td></tr>'
//     : bEntries.map(([pid, d]) => {
//       const pkey = S.paymentKey(financialYear, financialMonth,pid);
//       const isPaid = !!payments[pkey];
//       return `<tr class="${isPaid ? 'row--paid' : ''}">
//           <td>${escapeHtml(pharmacyName(pid))}</td>
//           <td>${J.toPersianDigits(d.dayH.toFixed(1))}</td>
//           <td class="cell--special">${J.toPersianDigits(d.nightH.toFixed(1))}</td>
//           <td class="cell--holiday">${J.toPersianDigits(d.holidayH.toFixed(1))}</td>
//           <td class="num">${formatToman(d.income)}</td>
//           <td class="payment-cell">
//             <label class="payment-check" title="${isPaid ? 'پرداخت شده' : 'در انتظار پرداخت'}">
//               <input type="checkbox" class="payment-checkbox"
//                      data-pid="${pid}" ${isPaid ? 'checked' : ''}>
//               <span class="payment-check__box"></span>
//               <span class="payment-check__label">${isPaid ? 'پرداخت شده' : 'در انتظار'}</span>
//             </label>
//           </td>
//         </tr>`;
//     }).join('');

//   // Bind payment checkboxes
//   breakdownTbody.querySelectorAll('.payment-checkbox').forEach((chk) => {
//     chk.addEventListener('change', () => {
//       const pkey = S.paymentKey(financialYear, financialMonth, chk.dataset.pid);
//       const pays = S.loadPayments();
//       pays[pkey] = chk.checked;
//       S.savePayments(pays);
//       showToast(chk.checked ? '✅ پرداخت ثبت شد' : 'پرداخت لغو شد');
//       renderFinancial(); // refresh to update totals
//     });
//   });
//   // shift detail list
//   // shift detail list — with rate column, custom rate badge, edit button
//   const tbody = document.querySelector('#financialShiftsTable tbody');
//   if (ms.length === 0) {
//     tbody.innerHTML = '<tr class="empty-row"><td colspan="10">شیفتی ثبت نشده</td></tr>';
//     return;
//   }

//   tbody.innerHTML = ms.map((s) => {
//     const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
//     const wi = J.jalaliWeekday(jy, jm, jd);
//     const h = S.shiftDurationHours(s.start, s.end);
//     const income = calcIncome(s);
//     const sp = isSpecialShift(s);

//     // Shift type icon
//     let typeIcon;
//     if (s.isHoliday) typeIcon = '🗓️';
//     else if (s.customRate != null) typeIcon = '⭐';
//     else {
//       const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
//       if (dayHours > 0 && nightHours > 0) typeIcon = '☀️🌙';
//       else if (nightHours > 0) typeIcon = '🌙';
//       else typeIcon = '☀️';
//     }

//     // Breakdown column
//     const breakdown = incomeBreakdown(s);
//     const hasCustomRate = s.customRate != null;
//     const breakdownDisplay = hasCustomRate
//       ? `${breakdown} <span class="custom-rate-active">اختصاصی</span>`
//       : breakdown;

//     return `<tr class="${sp ? 'row--special' : ''}" data-shift-id="${s.id}">
//       <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}</td>
//       <td>${J.PERSIAN_WEEKDAYS[wi]}</td>
//       <td>${typeIcon}</td>
//       <td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>
//       <td class="num">${s.start}</td>
//       <td class="num">${s.end}</td>
//       <td class="num">${J.toPersianDigits(h.toFixed(1))}</td>
//       <td class="num rate-cell breakdown-cell">${breakdownDisplay}</td>
//       <td class="num">${formatToman(income)}</td>
//      <td class="deputy-cell">${s.deputyId ? `<span class="deputy-badge"> ${escapeHtml(deputyName(s.deputyId))}</span>` : ''}</td>
//       <td><button class="rowedit" data-id="${s.id}" data-datekey="${s.dateKey}" type="button">ویرایش</button></td>
//     </tr>`;
//   }).join('');
//   // Deputy breakdown — show what's owed to each deputy this month
//   const deputyBreakdown = {};
//   ms.forEach((s) => {
//     if (!s.deputyId) return;
//     if (!deputyBreakdown[s.deputyId]) deputyBreakdown[s.deputyId] = { count: 0, hours: 0, income: 0 };
//     deputyBreakdown[s.deputyId].count++;
//     deputyBreakdown[s.deputyId].hours += S.shiftDurationHours(s.start, s.end);
//     deputyBreakdown[s.deputyId].income += calcIncome(s);
//   });
//   const depEntries = Object.entries(deputyBreakdown);
//   const depTitleEl = document.getElementById('deputyBreakdownTitle');
//   const depWrapEl = document.getElementById('deputyBreakdownWrap');
//   if (depTitleEl) depTitleEl.style.display = depEntries.length > 0 ? '' : 'none';
//   if (depWrapEl) depWrapEl.style.display = depEntries.length > 0 ? '' : 'none';
//   if (depEntries.length > 0) {
//     document.querySelector('#deputyBreakdownTable tbody').innerHTML =
//       depEntries.sort((a, b) => b[1].income - a[1].income).map(([did, d]) => `<tr>
//         <td>${escapeHtml(deputyName(did))}</td>
//         <td>${J.toPersianDigits(d.count)}</td>
//         <td>${J.toPersianDigits(d.hours.toFixed(1))}</td>
//         <td class="num">${formatToman(d.income)}</td>
//       </tr>`).join('');
//   }
//   tbody.querySelectorAll('.rowedit').forEach((btn) => {
//     btn.addEventListener('click', () => {
//       const { jy, jm, jd } = J.parseJalaliKey(btn.dataset.datekey);
//       openDaySheetForEdit(jy, jm, jd, btn.dataset.id);
//     });
//   });
// }

/* =================== SETTINGS + PWA INSTALL =================== */
function bindSettings() {
  initThemePicker();
  bindBackupRestore();
  bindProfile();
}
/* =================== PERSONAL PROFILE =================== */

function bindProfile() {
  renderProfileHeader();

  document.getElementById('toggleProfileEditBtn').addEventListener('click', () => {
    const form = document.getElementById('profileEditForm');
    const isOpen = form.style.display !== 'none';
    if (isOpen) {
      form.style.display = 'none';
    } else {
      loadProfileIntoForm();
      form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('cancelProfileBtn').addEventListener('click', () => {
    document.getElementById('profileEditForm').style.display = 'none';
  });
}

function loadProfileIntoForm() {
  const p = settings.profile || {};
  document.getElementById('profileFullName').value = p.fullName || '';
  document.getElementById('profileRole').value = p.role || 'داروساز';
  document.getElementById('profileLicense').value = p.licenseNumber || '';
  document.getElementById('profilePhone').value = p.phone || '';
  document.getElementById('profileEmail').value = p.email || '';
  document.getElementById('profileSignature').value = p.signatureNote || '';
}

function saveProfile() {
  const profile = {
    fullName: document.getElementById('profileFullName').value.trim(),
    role: document.getElementById('profileRole').value,
    licenseNumber: S.toLatinDigits(document.getElementById('profileLicense').value.trim()),
    phone: document.getElementById('profilePhone').value.trim(),
    email: document.getElementById('profileEmail').value.trim(),
    signatureNote: document.getElementById('profileSignature').value.trim(),
  };
  settings.profile = profile;
  S.saveSettings(settings);
  renderProfileHeader();
  document.getElementById('profileEditForm').style.display = 'none';
  showToast('پروفایل ذخیره شد ✓');
}

function renderProfileHeader() {
  const p = settings.profile || {};
  const nameEl = document.getElementById('profileDisplayName');
  const roleEl = document.getElementById('profileDisplayRole');
  const avatarEl = document.getElementById('profileAvatar');

  const name = p.fullName || 'نام شما';
  const role = p.role || 'داروساز';

  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = p.licenseNumber
    ? `${role} — نظام دارویی: ${p.licenseNumber}`
    : role;

  // Show initials in avatar if name is set
  if (avatarEl && p.fullName) {
    const parts = p.fullName.trim().split(/\s+/);
    const initials = parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0][0];
    avatarEl.textContent = initials;
    avatarEl.classList.add('profile-avatar--filled');
  } else if (avatarEl) {
    avatarEl.classList.remove('profile-avatar--filled');
    avatarEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`;
  }
}

/** Returns an HTML block for PDF reports showing the user's profile */
function profilePdfBlock() {
  const p = settings.profile || {};
  if (!p.fullName && !p.licenseNumber && !p.phone) return '';

  const rows = [];
  if (p.fullName) rows.push(`<tr><td>نام:</td><td>${escapeHtml(p.fullName)}</td></tr>`);
  if (p.role) rows.push(`<tr><td>سمت:</td><td>${escapeHtml(p.role)}</td></tr>`);
  if (p.licenseNumber) rows.push(`<tr><td>شماره نظام دارویی:</td><td>${escapeHtml(p.licenseNumber)}</td></tr>`);
  if (p.phone) rows.push(`<tr><td>شماره تماس:</td><td style="direction:ltr;text-align:right">${escapeHtml(p.phone)}</td></tr>`);
  if (p.email) rows.push(`<tr><td>ایمیل:</td><td style="direction:ltr;text-align:right">${escapeHtml(p.email)}</td></tr>`);

  const signature = p.signatureNote
    ? `<div class="pr-signature">
        <div class="pr-signature__line"></div>
        <p class="pr-signature__text">${escapeHtml(p.signatureNote)}</p>
        <p class="pr-signature__name">${escapeHtml(p.fullName || '')}</p>
      </div>`
    : '';

  return `
    <div class="pr-profile-block">
      <table class="pr-profile-table">
        <tbody>${rows.join('')}</tbody>
      </table>
      ${signature}
    </div>`;
}

function bindBackupRestore() {
  // Export button (now in settings)
  document.getElementById('exportJsonBtn')
    .addEventListener('click', exportJsonBackup);

  // Import — trigger file picker on label click (already handled by <label for>)
  const fileInput = document.getElementById('importJsonInput');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset input so same file can be re-imported if needed
    fileInput.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        importJsonBackup(evt.target.result);
      } catch (err) {
        showImportStatus('error', 'خطا در خواندن فایل: ' + err.message);
      }
    };
    reader.onerror = () => showImportStatus('error', 'فایل قابل خواندن نیست');
    reader.readAsText(file, 'UTF-8');
  });
}

function importJsonBackup(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch (e) {
    showImportStatus('error', 'فایل JSON معتبر نیست');
    return;
  }

  // Validate minimum required fields
  if (!data.pharmacies || !data.shifts) {
    showImportStatus('error', 'فایل پشتیبان معتبر نیست — داده‌های لازم یافت نشد');
    return;
  }
  // Merge deputies
  if (Array.isArray(data.deputies)) {
    const existingDepIds = new Set(deputies.map((d) => d.id));
    const newDeputies = data.deputies.filter((d) => !existingDepIds.has(d.id));
    deputies = [...deputies, ...newDeputies];
    S.saveDeputies(deputies);
  }

  const incomingPharmacies = Array.isArray(data.pharmacies) ? data.pharmacies : [];
  const incomingShifts = Array.isArray(data.shifts) ? data.shifts : [];
  const exportDate = data.exportedAt
    ? new Date(data.exportedAt).toLocaleDateString('fa-IR')
    : 'نامشخص';

  // Count what's actually NEW (not already in current data)
  const existingPharmacyIds = new Set(pharmacies.map((p) => p.id));
  const existingShiftIds = new Set(shifts.map((s) => s.id));

  const newPharmacies = incomingPharmacies.filter((p) => !existingPharmacyIds.has(p.id));
  const newShifts = incomingShifts.filter((s) => !existingShiftIds.has(s.id));

  const confirmed = confirm(
    `بارگذاری پشتیبان (ادغام)\n\n` +
    `تاریخ تهیه فایل: ${exportDate}\n\n` +
    `موارد جدیدی که اضافه می‌شوند:\n` +
    `• ${newPharmacies.length} داروخانه جدید\n` +
    `• ${newShifts.length} شیفت جدید\n\n` +
    `(موارد تکراری نادیده گرفته می‌شوند — داده‌های فعلی حذف نمی‌شوند)`
  );
  if (!confirmed) return;

  if (newPharmacies.length === 0 && newShifts.length === 0) {
    showImportStatus('success', '✅ هیچ داده جدیدی یافت نشد — همه موارد قبلاً وجود دارند');
    showToast('داده‌ای برای افزودن وجود ندارد');
    return;
  }

  // Merge pharmacies
  pharmacies = [...pharmacies, ...newPharmacies];
  S.savePharmacies(pharmacies);

  // Merge shifts
  shifts = [...shifts, ...newShifts];
  S.saveShifts(shifts);

  // Merge payments — imported values added, existing ones kept
  if (data.payments && typeof data.payments === 'object') {
    const currentPayments = S.loadPayments();
    const mergedPayments = Object.assign({}, data.payments, currentPayments);
    // currentPayments last so existing paid statuses are never overwritten
    S.savePayments(mergedPayments);
  }

  // Merge settings — only fill in rates if currently zero/unset
  if (data.settings && typeof data.settings === 'object') {
    const inc = data.settings;
    if (!(settings.bankAccounts && settings.bankAccounts.length) && Array.isArray(inc.bankAccounts)) {
      settings.bankAccounts = inc.bankAccounts;
    }
    if (!(settings.profile && settings.profile.fullName) && inc.profile) {
      settings.profile = inc.profile;
    }
    S.saveSettings(settings);
    renderBankAccountsList();
    renderProfileHeader();
  }
  // Refresh all views
  renderCalendar();
  renderPharmacyList();
  renderPharmacySelect();
  updateMonthSummaryLine();
  renderSummary();
  renderFinancial();

  showImportStatus('success',
    `✅ ادغام انجام شد — ${newPharmacies.length} داروخانه و ${newShifts.length} شیفت جدید اضافه شدند`
  );
  showToast(`✅ ${newShifts.length} شیفت و ${newPharmacies.length} داروخانه اضافه شد`);
}

function showImportStatus(type, message) {
  const el = document.getElementById('importStatus');
  if (!el) return;
  el.textContent = message;
  el.className = `import-status import-status--${type}`;
  el.style.display = '';
  // Auto-hide after 6 seconds
  setTimeout(() => { el.style.display = 'none'; }, 6000);
}
/* =================== THEME SYSTEM =================== */

const THEMES = {
  default: { label: 'پیش‌فرض', desc: 'طراحی ساده و مینیمال' },
  lavender: { label: 'لاواندر', desc: 'بنفش آرام‌بخش با گرادیان ملایم' },
  softpink: { label: 'صورتی', desc: 'صورتی گرم با تزئینات دارویی' },
  softblue: { label: 'آبی', desc: 'آبی ملایم با پس‌زمینه گل‌های دست‌کشیده' },
  floral: { label: '🌸 گل‌های ویژه', desc: 'تصویر گل با جلوه شیشه‌ای glassmorphism' },
};

let currentTheme = localStorage.getItem('shiftplanner.theme') || 'default';

function applyTheme(themeKey, save = true) {
  currentTheme = themeKey;
  document.documentElement.setAttribute('data-theme', themeKey);
  if (save) localStorage.setItem('shiftplanner.theme', themeKey);
  updateThemePickerUI();
}

function initThemePicker() {
  applyTheme(currentTheme, false);

  document.querySelectorAll('.theme-card').forEach((card) => {
    card.addEventListener('click', () => {
      const t = card.dataset.theme;
      applyTheme(t);
      showToast(`تم «${THEMES[t]?.label}» اعمال شد`);
    });
  });
}

function updateThemePickerUI() {
  document.querySelectorAll('.theme-card').forEach((card) => {
    card.classList.toggle('is-active', card.dataset.theme === currentTheme);
  });

  const info = THEMES[currentTheme];
  if (info) {
    const titleEl = document.getElementById('themePreviewTitle');
    const descEl = document.querySelector('.theme-preview-box__desc');
    if (titleEl) titleEl.textContent = info.label;
    if (descEl) descEl.textContent = info.desc;
  }
}


function bindPwaInstall() {
  // Capture the install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('pwaInstallItem').style.display = '';
    document.getElementById('pwaInstalledNote').style.display = 'none';
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    document.getElementById('pwaInstallItem').style.display = 'none';
    document.getElementById('pwaInstalledNote').style.display = '';
    showToast('اپلیکیشن با موفقیت نصب شد');
  });

  document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      // Fallback: guide user manually
      showToast('منوی مرورگر را باز کنید و «افزودن به صفحه اصلی» را انتخاب کنید');
      return;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      deferredInstallPrompt = null;
    }
  });

  // If already running as standalone (installed), show installed state
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    document.getElementById('pwaInstallItem').style.display = 'none';
    document.getElementById('pwaInstalledNote').style.display = '';
  }
}

function openDaySheetForEdit(jy, jm, jd, shiftId) {
  document.querySelectorAll('.navbtn').forEach((b) => b.classList.remove('is-active'));
  document.querySelector('[data-view="calendar"]').classList.add('is-active');
  document.querySelectorAll('.view').forEach((v) => v.setAttribute('data-active', 'false'));
  document.getElementById('view-calendar').setAttribute('data-active', 'true');
  viewYear = jy;
  viewMonth = jm;
  renderCalendar();
  openDaySheet(jy, jm, jd);
  setTimeout(() => loadShiftIntoForm(shiftId), 60);
}

/* =================== EXPORT HELPERS =================== */

function bindExport() {
  document.getElementById('exportMonthBtn').addEventListener('click', () => exportCsv('summary'));
  // document.getElementById('exportJsonBtn').addEventListener('click', exportJsonBackup);
  document.getElementById('exportPdfBtn').addEventListener('click', () => exportPdf('summary'));
  document.getElementById('exportFinancialCsvBtn').addEventListener('click', () => exportCsv('financial'));
  document.getElementById('exportFinancialPdfBtn').addEventListener('click', () => exportPdf('financial'));
  document.getElementById('exportSmsBtn').addEventListener('click', exportSms);
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEsc(val) {
  const s = String(val == null ? '' : val);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function slugify(name) {
  return name.trim().replace(/\s+/g, '-').replace(/[\\/:*?"<>|]/g, '').slice(0, 40) || 'pharmacy';
}

function exportJsonBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: 1,
    pharmacies,
    shifts,
    settings,
    deputies,
    payments: S.loadPayments(),
  };
  const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  downloadFile(`daftar-shift-backup-${dateStr}.json`,
    JSON.stringify(backup, null, 2),
    'application/json');
  showToast('فایل پشتیبان دانلود شد ✓');
}


function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (e) { /* ignore */ }
}

function exportSms() {
  const ms = getMonthShifts(financialPharmacyFilter, financialDeputyFilter || 'all');
  if (ms.length === 0) { showToast('شیفتی برای ارسال وجود ندارد'); return; }

  const monthLabel = `${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}`;
  const isSingle = financialPharmacyFilter !== 'all';
  const money = (n) => J.toPersianDigits(Math.round(n).toLocaleString('en')) + ' تومان';
  const hrs = (n) => J.toPersianDigits(n.toFixed(1));
  const lines = [`گزارش شیفت — ${monthLabel}`];

  const byPharmacy = {};
  ms.forEach((s) => { (byPharmacy[s.pharmacyId] = byPharmacy[s.pharmacyId] || []).push(s); });

  Object.entries(byPharmacy).forEach(([pid, list]) => {
    lines.push('', pharmacyName(pid), '──────────');

    list.forEach((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const dayFa = J.PERSIAN_WEEKDAYS[J.jalaliWeekday(jy, jm, jd)];
      const h = S.shiftDurationHours(s.start, s.end);

      const tags = [];
      if (s.isHoliday) tags.push('تعطیل');
      else if (S.splitShiftHours(s.start, s.end).nightHours > 0) tags.push('شب');
      if (s.deputyId) tags.push('قائم مقام: ' + deputyName(s.deputyId));

      lines.push(
        `${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]} (${dayFa}) ${s.start} تا ${s.end} — ${hrs(h)} ساعت` +
        (tags.length ? ` [${tags.join('، ')}]` : '')
      );
    });

    let dayH = 0, nightH = 0, holidayH = 0;
    list.forEach((s) => {
      if (s.isHoliday) holidayH += S.shiftDurationHours(s.start, s.end);
      else {
        const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
        dayH += dayHours; nightH += nightHours;
      }
    });
    const totalH = list.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
    const totalInc = list.reduce((sum, s) => sum + calcIncome(s), 0);

    lines.push('──────────');
    lines.push(`مجموع: ${J.toPersianDigits(list.length)} شیفت | ${hrs(totalH)} ساعت`);
    const parts = [];
    if (dayH > 0)     parts.push(`${hrs(dayH)} عادی`);
    if (nightH > 0)   parts.push(`${hrs(nightH)} شب`);
    if (holidayH > 0) parts.push(`${hrs(holidayH)} تعطیل`);
    if (parts.length) lines.push(parts.join(' | '));
    if (totalInc > 0) lines.push(`درآمد: ${money(totalInc)}`);
  });

  if (!isSingle && Object.keys(byPharmacy).length > 1) {
    const grandH = ms.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
    const grandInc = ms.reduce((sum, s) => sum + calcIncome(s), 0);
    lines.push('', '══════════');
    lines.push(`جمع کل: ${J.toPersianDigits(ms.length)} شیفت | ${hrs(grandH)} ساعت`);
    if (grandInc > 0) lines.push(`درآمد کل: ${money(grandInc)}`);
  }

  const accounts = settings.bankAccounts || [];
  if (accounts.length > 0) {
    lines.push('', '══════════', 'اطلاعات حساب:');
    accounts.forEach((acc) => {
      const num = acc.type === 'card'
        ? acc.number.replace(/(.{4})/g, '$1-').replace(/-$/, '')
        : 'IR' + acc.number.replace(/(.{4})/g, '$1 ').trimEnd();
      lines.push(`${acc.bankName}: ${num}`);
      if (acc.ownerName) lines.push(`به نام: ${acc.ownerName}`);
    });
  }

  lines.push('', 'دفتر شیفت — @amrqhz');
  const body = lines.join('\n');

  // keep a copy in the clipboard as a fallback (desktop / very long messages)
  copyToClipboard(body);

  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  window.location.href = `sms:${isIOS ? '&' : '?'}body=${encodeURIComponent(body)}`;

  showToast('در حال باز کردن پیام‌رسان… اگر باز نشد، متن کپی شده را Paste کنید');
}

/* =================== CSV EXPORT =================== */

function exportCsv(mode) {
  const isFin = mode === 'financial';
  const filter = isFin ? financialPharmacyFilter : reportPharmacyFilter;
  const depFilter = (isFin ? financialDeputyFilter : reportDeputyFilter) || 'all';
  const ms = getMonthShifts(filter, depFilter);
  if (ms.length === 0) { showToast('شیفتی برای خروجی‌گیری وجود ندارد'); return; }

  const dateText = (s) => {
    const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
    return { text: `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`, wd: J.PERSIAN_WEEKDAYS[J.jalaliWeekday(jy, jm, jd)] };
  };

  let header, rows;
  if (isFin) {
    header = ['تاریخ', 'روز هفته', 'نوع شیفت', 'داروخانه', 'قائم مقام', 'شروع', 'پایان', 'مدت (ساعت)',
              'نرخ (تومان/ساعت)', 'منبع نرخ', 'درآمد (تومان)', 'یادداشت'];
    rows = ms.map((s) => {
      const d = dateText(s);
      return [d.text, d.wd, shiftTypeLabel(s), pharmacyName(s.pharmacyId), s.deputyId ? deputyName(s.deputyId) : '',
              s.start, s.end, S.shiftDurationHours(s.start, s.end).toFixed(2),
              rateLabel(s), rateSource(s), Math.round(calcIncome(s)), s.note || ''];
    });
    const totalInc = ms.reduce((sum, s) => sum + calcIncome(s), 0);
    rows.push([], ['', '', '', '', '', '', '', '', '', 'مجموع درآمد:', Math.round(totalInc), '']);
  } else {
    header = ['تاریخ', 'روز هفته', 'نوع شیفت', 'داروخانه', 'قائم مقام', 'شروع', 'پایان', 'مدت (ساعت)', 'یادداشت'];
    rows = ms.map((s) => {
      const d = dateText(s);
      return [d.text, d.wd, shiftTypeLabel(s), pharmacyName(s.pharmacyId), s.deputyId ? deputyName(s.deputyId) : '',
              s.start, s.end, S.shiftDurationHours(s.start, s.end).toFixed(2), s.note || ''];
    });
    const totalH = ms.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
    rows.push([], ['', '', '', '', '', '', 'مجموع ساعت:', totalH.toFixed(2), '']);
  }

  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(csvEsc).join(',')).join('\n');
  const scopeSlug = filter === 'all' ? 'all' : slugify(pharmacyName(filter));
  downloadFile(`${isFin ? 'financial' : 'shifts'}-${viewYear}-${String(viewMonth).padStart(2, '0')}-${scopeSlug}.csv`, csv, 'text/csv;charset=utf-8');
  showToast('فایل CSV دانلود شد');
}

/* =================== PDF EXPORT =================== */

const DEV_CREDIT = `
  <div class="pr-dev">
    <span>طراحی و توسعه: امیرحسین قلی‌زاده</span>
    <span>سوشال مدیا: @amrqhz</span>
    <span>دفتر شیفت — برنامه‌ریز شیفت داروخانه</span>
  </div>`;

function prHead(title, period, genAt) {
  return `<div class="pr-head">
    <div class="pr-head__brand">
      <div class="pr-head__mark">℞</div>
      <div><p class="pr-head__title">${title}</p><p class="pr-head__period">${period}</p></div>
    </div>
    <div class="pr-head__meta">تاریخ تهیه: ${genAt}</div>
  </div>`;
}

function exportPdf(mode) {
  const filter = mode === 'financial' ? financialPharmacyFilter : reportPharmacyFilter;
  const ms = getMonthShifts(filter, (mode === 'financial' ? financialDeputyFilter : reportDeputyFilter) || 'all');
  if (ms.length === 0) { showToast('شیفتی برای خروجی‌گیری وجود ندارد'); return; }

  const isSingle = filter !== 'all';
  const period = `${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}`;
  const genAt = `${J.toPersianDigits(todayJ.jy)}/${J.toPersianDigits(String(todayJ.jm).padStart(2, '0'))}/${J.toPersianDigits(String(todayJ.jd).padStart(2, '0'))}`;

  let html = '';

  if (mode === 'summary') {
    const totalH = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
    const normalH = ms.filter((x) => !isSpecialShift(x)).reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
    const specialH = ms.filter((x) => isSpecialShift(x)).reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
    const days = new Set(ms.map((x) => x.dateKey)).size;

    html += prHead(isSingle ? `گزارش شیفت — ${escapeHtml(pharmacyName(filter))}` : 'گزارش شیفت ماهانه', period, genAt);
    html += profilePdfBlock();
    html += `<div class="pr-stats">
      <div class="pr-stat"><span class="pr-stat__value">${J.toPersianDigits(ms.length)}</span><span class="pr-stat__label">شیفت</span></div>
      <div class="pr-stat"><span class="pr-stat__value">${J.toPersianDigits(totalH.toFixed(1))}</span><span class="pr-stat__label">ساعت کل</span></div>
      <div class="pr-stat"><span class="pr-stat__value">${J.toPersianDigits(normalH.toFixed(1))}</span><span class="pr-stat__label">ساعت عادی</span></div>
      <div class="pr-stat pr-stat--special"><span class="pr-stat__value">${J.toPersianDigits(specialH.toFixed(1))}</span><span class="pr-stat__label">ساعت شب/تعطیل</span></div>
    </div>`;

    if (!isSingle) {
      const breakdown = {};
      ms.forEach((s) => {
        if (!breakdown[s.pharmacyId]) breakdown[s.pharmacyId] = { nH: 0, sH: 0 };
        const h = S.shiftDurationHours(s.start, s.end);
        if (isSpecialShift(s)) breakdown[s.pharmacyId].sH += h;
        else breakdown[s.pharmacyId].nH += h;
      });
      html += `<p class="pr-section-title">تفکیک بر اساس داروخانه</p>
        <table class="pr-table"><thead><tr><th>داروخانه</th><th>ساعت عادی</th><th>ساعت شب/تعطیل</th><th>جمع</th></tr></thead><tbody>
        ${Object.entries(breakdown).sort((a, b) => (b[1].nH + b[1].sH) - (a[1].nH + a[1].sH)).map(([pid, d]) =>
        `<tr><td>${escapeHtml(pharmacyName(pid))}</td><td>${d.nH.toFixed(1)}</td><td class="pr-special">${d.sH.toFixed(1)}</td><td>${(d.nH + d.sH).toFixed(1)}</td></tr>`).join('')}
        </tbody></table>`;
    }

    const phCol = isSingle ? '' : '<th>داروخانه</th>';
    html += `<p class="pr-section-title">فهرست شیفت‌ها</p>
      <table class="pr-table"><thead><tr><th>تاریخ</th><th>روز</th><th>نوع</th>${phCol}<th>شروع</th><th>پایان</th><th>مدت</th><th>یادداشت</th></tr></thead><tbody>
      ${ms.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const wi = J.jalaliWeekday(jy, jm, jd);
      const h = S.shiftDurationHours(s.start, s.end);
      const sp = isSpecialShift(s);
      const phCell = isSingle ? '' : `<td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>`;
      return `<tr class="${sp ? 'pr-row-special' : ''}"><td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}</td><td>${J.PERSIAN_WEEKDAYS[wi]}</td><td>${sp ? '🌙' : '☀️'}</td>${phCell}<td>${s.start}</td><td>${s.end}</td><td>${h.toFixed(1)}</td><td>${s.note || '—'}</td></tr>`;
    }).join('')}
      </tbody><tfoot><tr><td colspan="${isSingle ? 5 : 6}">مجموع</td><td>${totalH.toFixed(1)}</td><td></td></tr></tfoot></table>`;

  } else { // financial
    const totalInc = ms.reduce((s, x) => s + calcIncome(x), 0);
    const normInc  = ms.reduce((s, x) => s + incomeParts(x).normal, 0);
    const specInc  = ms.reduce((s, x) => s + incomeParts(x).special, 0);

    const totalH = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);

    // html += prHead(isSingle ? `گزارش مالی — ${escapeHtml(pharmacyName(filter))}` : 'گزارش مالی ماهانه', period, genAt);
    // html += profilePdfBlock();
    // html += `<div class="pr-rates-note">نرخ عادی: ${settings.rateNormal.toLocaleString()} تومان/ساعت &nbsp;|&nbsp; نرخ شب/تعطیل: ${settings.rateSpecial.toLocaleString()} تومان/ساعت</div>`;
    // html += `<div class="pr-stats">
    //   <div class="pr-stat"><span class="pr-stat__value">${J.toPersianDigits(ms.length)}</span><span class="pr-stat__label">شیفت</span></div>
    //   <div class="pr-stat"><span class="pr-stat__value" style="font-size:11px">${Math.round(totalInc).toLocaleString()}</span><span class="pr-stat__label">درآمد کل (تومان)</span></div>
    //   <div class="pr-stat"><span class="pr-stat__value" style="font-size:11px">${Math.round(normInc).toLocaleString()}</span><span class="pr-stat__label">درآمد عادی</span></div>
    //   <div class="pr-stat pr-stat--special"><span class="pr-stat__value" style="font-size:11px">${Math.round(specInc).toLocaleString()}</span><span class="pr-stat__label">درآمد شب/تعطیل</span></div>
    // </div>`;

    if (!isSingle) {
      const bk = {};
      ms.forEach((s) => {
        if (!bk[s.pharmacyId]) bk[s.pharmacyId] = { nH: 0, sH: 0, inc: 0 };
        const h = S.shiftDurationHours(s.start, s.end);
        if (isSpecialShift(s)) bk[s.pharmacyId].sH += h; else bk[s.pharmacyId].nH += h;
        bk[s.pharmacyId].inc += calcIncome(s);
      });
      html += `<p class="pr-section-title">تفکیک درآمد بر اساس داروخانه</p>
        <table class="pr-table"><thead><tr><th>داروخانه</th><th>ساعت عادی</th><th>ساعت شب/تعطیل</th><th>درآمد (تومان)</th></tr></thead><tbody>
        ${Object.entries(bk).sort((a, b) => b[1].inc - a[1].inc).map(([pid, d]) =>
        `<tr><td>${escapeHtml(pharmacyName(pid))}</td><td>${d.nH.toFixed(1)}</td><td class="pr-special">${d.sH.toFixed(1)}</td><td>${Math.round(d.inc).toLocaleString()}</td></tr>`).join('')}
        </tbody></table>`;
    }

    html += `<p class="pr-section-title">جزئیات شیفت‌ها</p>
      <table class="pr-table"><thead><tr><th>تاریخ</th><th>روز</th><th>نوع</th><th>داروخانه</th><th>شروع</th><th>پایان</th><th>مدت</th><th>درآمد (تومان)</th></tr></thead><tbody>
      ${ms.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const wi = J.jalaliWeekday(jy, jm, jd);
      const h = S.shiftDurationHours(s.start, s.end);
      const sp = isSpecialShift(s);
      const inc = calcIncome(s);
      const breakdown = incomeBreakdown(s);
      let typeIcon;
      if (s.isHoliday) typeIcon = '🗓️';
      else if (s.customRate != null) typeIcon = '⭐';
      else {
        const { dayHours, nightHours } = S.splitShiftHours(s.start, s.end);
        typeIcon = (dayHours > 0 && nightHours > 0) ? '☀️🌙' : (nightHours > 0 ? '🌙' : '☀️');
      }
      return `<tr class="${sp ? 'pr-row-special' : ''}"><td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}</td><td>${J.PERSIAN_WEEKDAYS[wi]}</td><td>${typeIcon}</td><td>${escapeHtml(pharmacyName(s.pharmacyId))}</td><td>${s.start}</td><td>${s.end}</td><td>${h.toFixed(1)}</td><td style="font-size:9px">${breakdown}</td><td>${Math.round(inc).toLocaleString()}</td></tr>`;
    }).join('')}
      </tbody><tfoot><tr><td colspan="6">مجموع</td><td>${totalH.toFixed(1)}</td><td>${Math.round(totalInc).toLocaleString()}</td></tr></tfoot></table>`;
  }

  html += bankAccountsPdfBlock();
  html += DEV_CREDIT;

  document.getElementById('printableReport').innerHTML = html;
  document.title = mode === 'financial' ? `گزارش مالی ${period}` : `گزارش شیفت ${period}`;
  window.print();
  setTimeout(() => { document.title = 'دفتر شیفت'; }, 500);
}

/* =================== TOAST =================== */

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-show'), 2400);
}

/* =================== SERVICE WORKER =================== */

function registerServiceWorker() {
  if ('serviceWorker' in navigator)
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}

/* =================== BOOT =================== */

document.addEventListener('DOMContentLoaded', init);

const shareBtn = document.getElementById('shareBtn');
const successMessage = document.getElementById('successMessage');

shareBtn.addEventListener('click', async () => {
  // Data to share
  const shareData = {
    title: 'My Awesome Project',
    text: 'Check out this cool project I built!',
    url: window.location.href  // Current page URL
  };

  try {
    // Check if Web Share API is supported
    if (navigator.share) {
      await navigator.share(shareData);
      showSuccess();
    } else {
      // Fallback: Copy link to clipboard
      await fallbackCopyLink();
    }
  } catch (err) {
    // User cancelled or error occurred
    if (err.name !== 'AbortError') {
      console.error('Error sharing:', err);
      await fallbackCopyLink();
    }
  }
  document.addEventListener('DOMContentLoaded', init);
});

async function fallbackCopyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showSuccess('Link copied to clipboard');
  } catch (err) {
    console.error('Clipboard failed:', err);
    alert('Could not share or copy. Please copy this link manually:\n' + window.location.href);
  }
}

function showSuccess(message = 'Shared successfully!') {
  successMessage.textContent = message;
  successMessage.style.opacity = '1';

  // Hide message after 3 seconds
  setTimeout(() => {
    successMessage.style.opacity = '0';
  }, 3000);
}

// Bonus: Make it work even better on mobile
console.log('%cShare button ready! 🚀', 'color: #fff; font-size: 14px;');

