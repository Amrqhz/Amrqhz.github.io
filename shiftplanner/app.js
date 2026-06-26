/* ===================================================================
   دفتر شیفت —
   Features: calendar, night/holiday auto-tagging, monthly summary,
             financial report, per-pharmacy exports, settings + PWA install
   =================================================================== */

const J = window.JalaliUtil;
const S = window.Store;

let pharmacies = S.loadPharmacies();
let shifts     = S.loadShifts();
let settings   = S.loadSettings();

let viewYear, viewMonth;
let selectedDateKey = null;
let reportPharmacyFilter    = 'all';
let financialPharmacyFilter = 'all';
let deferredInstallPrompt   = null; // PWA beforeinstallprompt event

const todayJ = J.todayJalali();

/* =================== INIT =================== */

function init() {
  viewYear  = todayJ.jy;
  viewMonth = todayJ.jm;

  renderWeekHeader();
  bindNav();
  bindMonthControls();
  bindSheet();
  bindPharmacyForm();
  bindShiftForm();
  bindExport();
  bindReportFilter();
  bindFinancialView();
  bindSettings();
  bindPwaInstall();

  renderCalendar();
  renderPharmacyList();
  renderPharmacySelect();
  registerServiceWorker();
}

/* =================== NAVIGATION =================== */

function bindNav() {
  document.querySelectorAll('.navbtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.navbtn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const target = btn.dataset.view;
      document.querySelectorAll('.view').forEach((v) => v.setAttribute('data-active', 'false'));
      document.getElementById(`view-${target}`).setAttribute('data-active', 'true');
      if (target === 'summary')   renderSummary();
      if (target === 'financial') renderFinancial();
      if (target === 'pharmacies') renderPharmacyList();
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

function renderCalendar() {
  document.getElementById('monthLabel').textContent =
    `${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const firstWeekday = J.jalaliWeekday(viewYear, viewMonth, 1);
  const monthLen     = J.jalaliMonthLength(viewYear, viewMonth);
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
    const dateKey    = J.jalaliKey(c.jy, c.jm, c.jd);
    const dayShifts  = shiftsForDate(dateKey);
    const isToday    = c.jy === todayJ.jy && c.jm === todayJ.jm && c.jd === todayJ.jd;
    const weekdayIdx = J.jalaliWeekday(c.jy, c.jm, c.jd);
    const isFriday   = weekdayIdx === 6;

    const cell = document.createElement('div');
    cell.className = [
      'daycell',
      c.outside  ? 'is-outside'  : '',
      isToday    ? 'is-today'    : '',
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
    const hours   = S.shiftDurationHours(s.start, s.end);
    const special = isSpecialShift(s);
    const row = document.createElement('div');
    row.className = 'existing-shift' + (special ? ' existing-shift--special' : '');
    row.innerHTML = `
      <div class="existing-shift__info">
        <div class="existing-shift__pharm">${escapeHtml(pharmacyName(s.pharmacyId))}</div>
        <div class="existing-shift__time">${s.start} – ${s.end} · ${J.toPersianDigits(hours.toFixed(1))} ساعت</div>
        ${special ? '<div class="existing-shift__badge">🌙 شب / تعطیل</div>' : ''}
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

function bindShiftForm() {
  document.getElementById('shiftForm').addEventListener('submit', (e) => { e.preventDefault(); saveShiftFromForm(); });
  document.getElementById('cancelShiftEdit').addEventListener('click', resetShiftForm);
  // live badge update when times change
  document.getElementById('shiftStart').addEventListener('change', updateShiftTypeBadge);
  document.getElementById('shiftEnd').addEventListener('change', updateShiftTypeBadge);
  document.getElementById('shiftIsHoliday').addEventListener('change', updateShiftTypeBadge);
}

function updateShiftTypeBadge() {
  const start   = document.getElementById('shiftStart').value;
  const end     = document.getElementById('shiftEnd').value;
  const holiday = document.getElementById('shiftIsHoliday').checked;
  const badge   = document.getElementById('shiftTypeBadge');
  const night   = start && end ? S.isNightShift(start, end) : false;
  const special = night || holiday;
  badge.textContent = special ? '🌙 شیفت شب / تعطیل' : '☀️ شیفت عادی';
  badge.className   = 'shift-type-badge' + (special ? ' shift-type-badge--special' : '');
}

function resetShiftForm() {
  document.getElementById('shiftEditId').value         = '';
  document.getElementById('shiftStart').value          = '';
  document.getElementById('shiftEnd').value            = '';
  document.getElementById('shiftNote').value           = '';
  document.getElementById('shiftIsHoliday').checked   = false;
  document.getElementById('saveShiftBtn').textContent  = 'ثبت شیفت';
  document.getElementById('cancelShiftEdit').hidden    = true;
  updateShiftTypeBadge();
}

function loadShiftIntoForm(id) {
  const s = shifts.find((x) => x.id === id);
  if (!s) return;
  document.getElementById('shiftEditId').value       = s.id;
  document.getElementById('shiftPharmacySelect').value = s.pharmacyId;
  document.getElementById('shiftStart').value        = s.start;
  document.getElementById('shiftEnd').value          = s.end;
  document.getElementById('shiftNote').value         = s.note || '';
  document.getElementById('shiftIsHoliday').checked  = !!s.isHoliday;
  document.getElementById('saveShiftBtn').textContent = 'به‌روزرسانی';
  document.getElementById('cancelShiftEdit').hidden  = false;
  updateShiftTypeBadge();
  document.getElementById('shiftPharmacySelect').focus();
}

function saveShiftFromForm() {
  if (pharmacies.length === 0) { showToast('ابتدا یک داروخانه اضافه کنید'); return; }
  const editId     = document.getElementById('shiftEditId').value;
  const pharmacyId = document.getElementById('shiftPharmacySelect').value;
  const start      = document.getElementById('shiftStart').value;
  const end        = document.getElementById('shiftEnd').value;
  const note       = document.getElementById('shiftNote').value.trim();
  const isHoliday  = document.getElementById('shiftIsHoliday').checked;
  if (!start || !end) { showToast('ساعت شروع و پایان را وارد کنید'); return; }

  // Auto-compute isNight from times; also check if the day is Friday
  const isNight   = S.isNightShift(start, end);
  const { jy, jm, jd } = J.parseJalaliKey(selectedDateKey);
  const fridayHol = S.isFridayHoliday(J.jalaliWeekday(jy, jm, jd));

  if (editId) {
    const s = shifts.find((x) => x.id === editId);
    if (s) Object.assign(s, { pharmacyId, start, end, note, isNight, isHoliday: isHoliday || fridayHol });
    showToast('شیفت به‌روزرسانی شد');
  } else {
    shifts.push({ id: S.uid(), dateKey: selectedDateKey, pharmacyId, start, end, note,
                  isNight, isHoliday: isHoliday || fridayHol });
    showToast('شیفت ثبت شد');
  }
  S.saveShifts(shifts);
  resetShiftForm();
  renderExistingShiftsForDay();
  renderCalendar();
}

function deleteShift(id) {
  shifts = shifts.filter((x) => x.id !== id);
  S.saveShifts(shifts);
  renderExistingShiftsForDay();
  renderCalendar();
  showToast('شیفت حذف شد');
}

/* =================== PHARMACIES =================== */

function bindPharmacyForm() {
  document.getElementById('pharmacyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ni = document.getElementById('pharmacyNameInput');
    const ai = document.getElementById('pharmacyAddrInput');
    const name = ni.value.trim();
    if (!name) return;
    pharmacies.push({ id: S.uid(), name, address: ai.value.trim() });
    S.savePharmacies(pharmacies);
    ni.value = ''; ai.value = '';
    renderPharmacyList(); renderPharmacySelect();
    showToast('داروخانه اضافه شد');
  });
}

function renderPharmacyList() {
  const list = document.getElementById('pharmacyList');
  if (pharmacies.length === 0) {
    list.innerHTML = '<li class="pharmacy-empty">هنوز داروخانه‌ای ثبت نشده است.</li>'; return;
  }
  list.innerHTML = '';
  pharmacies.forEach((p) => {
    const cnt = shifts.filter((s) => s.pharmacyId === p.id).length;
    const li  = document.createElement('li');
    li.className = 'pharmacy-item';
    li.innerHTML = `
      <div>
        <div class="pharmacy-item__name">${escapeHtml(p.name)}</div>
        ${p.address ? `<div class="pharmacy-item__addr">${escapeHtml(p.address)}</div>` : ''}
        <div class="pharmacy-item__addr">${J.toPersianDigits(cnt)} شیفت</div>
      </div>
      <button class="pharmacy-item__del" data-id="${p.id}">حذف</button>`;
    list.appendChild(li);
  });
  list.querySelectorAll('.pharmacy-item__del').forEach((b) => b.addEventListener('click', () => deletePharmacy(b.dataset.id)));
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

function renderPharmacySelect() {
  const sel = document.getElementById('shiftPharmacySelect');
  const prev = sel.value;
  sel.innerHTML = pharmacies.map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
  if (prev && pharmacies.some((p) => p.id === prev)) sel.value = prev;
}

/* =================== SHARED FILTER HELPERS =================== */

function bindReportFilter() {
  document.getElementById('reportPharmacyFilter').addEventListener('change', (e) => {
    reportPharmacyFilter = e.target.value; renderSummary();
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

function getMonthShifts(pharmacyFilter) {
  return shifts.filter((s) => {
    const { jy, jm } = J.parseJalaliKey(s.dateKey);
    if (jy !== viewYear || jm !== viewMonth) return false;
    if (pharmacyFilter !== 'all' && s.pharmacyId !== pharmacyFilter) return false;
    return true;
  }).sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.start.localeCompare(b.start));
}

/* =================== MONTHLY SUMMARY VIEW =================== */

function renderSummary() {
  reportPharmacyFilter = renderFilterOptions('reportPharmacyFilter', reportPharmacyFilter);
  const ms = getMonthShifts(reportPharmacyFilter);

  const totalH    = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
  const normalH   = ms.filter((x) => !isSpecialShift(x)).reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
  const specialH  = ms.filter((x) =>  isSpecialShift(x)).reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
  const uniqueDays = new Set(ms.map((x) => x.dateKey)).size;
  const isSingle   = reportPharmacyFilter !== 'all';

  const scopeLbl = isSingle
    ? `${escapeHtml(pharmacyName(reportPharmacyFilter))} — ${J.PERSIAN_MONTHS[viewMonth-1]}`
    : J.PERSIAN_MONTHS[viewMonth-1] + ' ' + J.toPersianDigits(viewYear);

  document.getElementById('statGrid').innerHTML = `
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(ms.length)}</span><span class="statcard__label">تعداد شیفت — ${scopeLbl}</span></div>
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(totalH.toFixed(1))}</span><span class="statcard__label">مجموع ساعت</span></div>
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(normalH.toFixed(1))}</span><span class="statcard__label">ساعت عادی</span></div>
    <div class="statcard statcard--special"><span class="statcard__value">${J.toPersianDigits(specialH.toFixed(1))}</span><span class="statcard__label">ساعت شب/تعطیل</span></div>`;

  // pharmacy breakdown
  const breakdown = {};
  ms.forEach((s) => {
    if (!breakdown[s.pharmacyId]) breakdown[s.pharmacyId] = { n: 0, nH: 0, sN: 0, sH: 0 };
    const h = S.shiftDurationHours(s.start, s.end);
    breakdown[s.pharmacyId].n++;
    if (isSpecialShift(s)) breakdown[s.pharmacyId].sH += h;
    else breakdown[s.pharmacyId].nH += h;
  });
  const breakdownBody = document.querySelector('#pharmacyBreakdownTable tbody');
  const entries = Object.entries(breakdown).sort((a, b) => (b[1].nH + b[1].sH) - (a[1].nH + a[1].sH));
  breakdownBody.innerHTML = entries.length === 0
    ? '<tr class="empty-row"><td colspan="4">شیفتی ثبت نشده</td></tr>'
    : entries.map(([pid, d]) => `<tr>
        <td>${escapeHtml(pharmacyName(pid))}</td>
        <td>${J.toPersianDigits(d.nH.toFixed(1))}</td>
        <td class="cell--special">${J.toPersianDigits(d.sH.toFixed(1))}</td>
        <td>${J.toPersianDigits((d.nH + d.sH).toFixed(1))}</td>
      </tr>`).join('');

  // shift list
  const listBody = document.querySelector('#monthShiftsTable tbody');
  listBody.innerHTML = ms.length === 0
    ? '<tr class="empty-row"><td colspan="8">شیفتی ثبت نشده</td></tr>'
    : ms.map((s) => {
        const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
        const wi = J.jalaliWeekday(jy, jm, jd);
        const h  = S.shiftDurationHours(s.start, s.end);
        const sp = isSpecialShift(s);
        return `<tr class="${sp ? 'row--special' : ''}">
          <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm-1]}</td>
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

/* =================== FINANCIAL VIEW =================== */

function bindFinancialView() {
  document.getElementById('rateNormal').value  = settings.rateNormal  || '';
  document.getElementById('rateSpecial').value = settings.rateSpecial || '';

  document.getElementById('saveRatesBtn').addEventListener('click', () => {
    settings.rateNormal  = parseFloat(document.getElementById('rateNormal').value)  || 0;
    settings.rateSpecial = parseFloat(document.getElementById('rateSpecial').value) || 0;
    S.saveSettings(settings);
    renderFinancial();
    showToast('نرخ‌ها ذخیره شد');
  });

  document.getElementById('financialPharmacyFilter').addEventListener('change', (e) => {
    financialPharmacyFilter = e.target.value; renderFinancial();
  });
}

function calcIncome(shift) {
  const h    = S.shiftDurationHours(shift.start, shift.end);
  const rate = isSpecialShift(shift) ? settings.rateSpecial : settings.rateNormal;
  return h * rate;
}

function formatToman(n) {
  if (n === 0) return '—';
  return J.toPersianDigits(Math.round(n).toLocaleString('en')) + ' تومان';
}

function renderFinancial() {
  financialPharmacyFilter = renderFilterOptions('financialPharmacyFilter', financialPharmacyFilter);
  const ms = getMonthShifts(financialPharmacyFilter);

  const totalIncome  = ms.reduce((s, x) => s + calcIncome(x), 0);
  const normalIncome = ms.filter((x) => !isSpecialShift(x)).reduce((s, x) => s + calcIncome(x), 0);
  const specIncome   = ms.filter((x) =>  isSpecialShift(x)).reduce((s, x) => s + calcIncome(x), 0);
  const totalH       = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);

  document.getElementById('financialStatGrid').innerHTML = `
    <div class="statcard"><span class="statcard__value">${J.toPersianDigits(ms.length)}</span><span class="statcard__label">تعداد شیفت</span></div>
    <div class="statcard"><span class="statcard__value" style="font-size:15px">${formatToman(totalIncome)}</span><span class="statcard__label">درآمد کل ماه</span></div>
    <div class="statcard"><span class="statcard__value" style="font-size:15px">${formatToman(normalIncome)}</span><span class="statcard__label">درآمد شیفت عادی</span></div>
    <div class="statcard statcard--special"><span class="statcard__value" style="font-size:15px">${formatToman(specIncome)}</span><span class="statcard__label">درآمد شب/تعطیل</span></div>`;

  // breakdown by pharmacy
  const breakdown = {};
  ms.forEach((s) => {
    if (!breakdown[s.pharmacyId]) breakdown[s.pharmacyId] = { nH: 0, sH: 0, income: 0 };
    const h = S.shiftDurationHours(s.start, s.end);
    if (isSpecialShift(s)) breakdown[s.pharmacyId].sH += h;
    else breakdown[s.pharmacyId].nH += h;
    breakdown[s.pharmacyId].income += calcIncome(s);
  });
  const bEntries = Object.entries(breakdown).sort((a, b) => b[1].income - a[1].income);
  document.querySelector('#financialBreakdownTable tbody').innerHTML = bEntries.length === 0
    ? '<tr class="empty-row"><td colspan="4">شیفتی ثبت نشده</td></tr>'
    : bEntries.map(([pid, d]) => `<tr>
        <td>${escapeHtml(pharmacyName(pid))}</td>
        <td>${J.toPersianDigits(d.nH.toFixed(1))}</td>
        <td class="cell--special">${J.toPersianDigits(d.sH.toFixed(1))}</td>
        <td class="num">${formatToman(d.income)}</td>
      </tr>`).join('');

  // shift detail list
  document.querySelector('#financialShiftsTable tbody').innerHTML = ms.length === 0
    ? '<tr class="empty-row"><td colspan="8">شیفتی ثبت نشده</td></tr>'
    : ms.map((s) => {
        const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
        const wi      = J.jalaliWeekday(jy, jm, jd);
        const h       = S.shiftDurationHours(s.start, s.end);
        const income  = calcIncome(s);
        const sp      = isSpecialShift(s);
        return `<tr class="${sp ? 'row--special' : ''}">
          <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm-1]}</td>
          <td>${J.PERSIAN_WEEKDAYS[wi]}</td>
          <td>${sp ? '🌙' : '☀️'}</td>
          <td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>
          <td class="num">${s.start}</td>
          <td class="num">${s.end}</td>
          <td class="num">${J.toPersianDigits(h.toFixed(1))}</td>
          <td class="num">${formatToman(income)}</td>
        </tr>`;
      }).join('');
}

/* =================== SETTINGS + PWA INSTALL =================== */

function bindSettings() {
  initThemePicker();
}

/* =================== THEME SYSTEM =================== */

const THEMES = {
  default:  { label: 'پیش‌فرض',       desc: 'طراحی ساده و مینیمال' },
  lavender: { label: 'لاواندر',        desc: 'بنفش آرام‌بخش با گرادیان ملایم' },
  softpink: { label: 'صورتی داروخانه', desc: 'صورتی گرم با تزئینات دارویی' },
  softblue: { label: 'آبی گل‌دار',     desc: 'آبی ملایم با پس‌زمینه گل‌های دست‌کشیده' },
  floral:   { label: '🌸 گل‌های ویژه', desc: 'تصویر گل با جلوه شیشه‌ای glassmorphism' },
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
    const descEl  = document.querySelector('.theme-preview-box__desc');
    if (titleEl) titleEl.textContent = info.label;
    if (descEl)  descEl.textContent  = info.desc;
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

/* =================== EXPORT HELPERS =================== */

function bindExport() {
  document.getElementById('exportMonthBtn').addEventListener('click', () => exportCsv('summary'));
  document.getElementById('exportJsonBtn').addEventListener('click', exportJsonBackup);
  document.getElementById('exportPdfBtn').addEventListener('click', () => exportPdf('summary'));
  document.getElementById('exportFinancialCsvBtn').addEventListener('click', () => exportCsv('financial'));
  document.getElementById('exportFinancialPdfBtn').addEventListener('click', () => exportPdf('financial'));
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
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
  downloadFile('shift-planner-backup.json',
    JSON.stringify({ exportedAt: new Date().toISOString(), pharmacies, shifts, settings }, null, 2),
    'application/json');
  showToast('فایل پشتیبان دانلود شد');
}

/* =================== CSV EXPORT =================== */

function exportCsv(mode) {
  const filter = mode === 'financial' ? financialPharmacyFilter : reportPharmacyFilter;
  const ms = getMonthShifts(filter);
  if (ms.length === 0) { showToast('شیفتی برای خروجی‌گیری وجود ندارد'); return; }

  let header, rows;
  if (mode === 'financial') {
    header = ['تاریخ','روز هفته','نوع شیفت','داروخانه','شروع','پایان','مدت (ساعت)','نرخ (تومان/ساعت)','درآمد (تومان)','یادداشت'];
    rows = ms.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const wi = J.jalaliWeekday(jy, jm, jd);
      const h  = S.shiftDurationHours(s.start, s.end);
      const sp = isSpecialShift(s);
      const rate = sp ? settings.rateSpecial : settings.rateNormal;
      return [
        `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`,
        J.PERSIAN_WEEKDAYS[wi],
        sp ? 'شب/تعطیل' : 'عادی',
        pharmacyName(s.pharmacyId),
        s.start, s.end,
        h.toFixed(2),
        rate,
        Math.round(h * rate),
        s.note || '',
      ];
    });
    const totalInc = ms.reduce((s, x) => s + calcIncome(x), 0);
    rows.push([], ['','','','','','مجموع درآمد:','','', Math.round(totalInc), '']);
  } else {
    header = ['تاریخ','روز هفته','نوع شیفت','داروخانه','شروع','پایان','مدت (ساعت)','یادداشت'];
    rows = ms.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const wi = J.jalaliWeekday(jy, jm, jd);
      const h  = S.shiftDurationHours(s.start, s.end);
      return [
        `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`,
        J.PERSIAN_WEEKDAYS[wi],
        isSpecialShift(s) ? 'شب/تعطیل' : 'عادی',
        pharmacyName(s.pharmacyId),
        s.start, s.end,
        h.toFixed(2),
        s.note || '',
      ];
    });
    const totalH = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
    rows.push([], ['','','','','مجموع ساعت:', totalH.toFixed(2), '', '']);
  }

  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(csvEsc).join(',')).join('\n');
  const scopeSlug = filter === 'all' ? 'all' : slugify(pharmacyName(filter));
  const prefix = mode === 'financial' ? 'financial' : 'shifts';
  downloadFile(`${prefix}-${viewYear}-${String(viewMonth).padStart(2,'0')}-${scopeSlug}.csv`, csv, 'text/csv;charset=utf-8');
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
  const ms = getMonthShifts(filter);
  if (ms.length === 0) { showToast('شیفتی برای خروجی‌گیری وجود ندارد'); return; }

  const isSingle = filter !== 'all';
  const period   = `${J.PERSIAN_MONTHS[viewMonth-1]} ${J.toPersianDigits(viewYear)}`;
  const genAt    = `${J.toPersianDigits(todayJ.jy)}/${J.toPersianDigits(String(todayJ.jm).padStart(2,'0'))}/${J.toPersianDigits(String(todayJ.jd).padStart(2,'0'))}`;

  let html = '';

  if (mode === 'summary') {
    const totalH   = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
    const normalH  = ms.filter((x) => !isSpecialShift(x)).reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
    const specialH = ms.filter((x) =>  isSpecialShift(x)).reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);
    const days     = new Set(ms.map((x) => x.dateKey)).size;

    html += prHead(isSingle ? `گزارش شیفت — ${escapeHtml(pharmacyName(filter))}` : 'گزارش شیفت ماهانه', period, genAt);
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
        ${Object.entries(breakdown).sort((a,b) => (b[1].nH+b[1].sH)-(a[1].nH+a[1].sH)).map(([pid,d]) =>
          `<tr><td>${escapeHtml(pharmacyName(pid))}</td><td>${d.nH.toFixed(1)}</td><td class="pr-special">${d.sH.toFixed(1)}</td><td>${(d.nH+d.sH).toFixed(1)}</td></tr>`).join('')}
        </tbody></table>`;
    }

    const phCol = isSingle ? '' : '<th>داروخانه</th>';
    html += `<p class="pr-section-title">فهرست شیفت‌ها</p>
      <table class="pr-table"><thead><tr><th>تاریخ</th><th>روز</th><th>نوع</th>${phCol}<th>شروع</th><th>پایان</th><th>مدت</th><th>یادداشت</th></tr></thead><tbody>
      ${ms.map((s) => {
        const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
        const wi = J.jalaliWeekday(jy, jm, jd);
        const h  = S.shiftDurationHours(s.start, s.end);
        const sp = isSpecialShift(s);
        const phCell = isSingle ? '' : `<td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>`;
        return `<tr class="${sp ? 'pr-row-special' : ''}"><td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm-1]}</td><td>${J.PERSIAN_WEEKDAYS[wi]}</td><td>${sp ? '🌙' : '☀️'}</td>${phCell}<td>${s.start}</td><td>${s.end}</td><td>${h.toFixed(1)}</td><td>${s.note || '—'}</td></tr>`;
      }).join('')}
      </tbody><tfoot><tr><td colspan="${isSingle ? 5 : 6}">مجموع</td><td>${totalH.toFixed(1)}</td><td></td></tr></tfoot></table>`;

  } else { // financial
    const totalInc  = ms.reduce((s, x) => s + calcIncome(x), 0);
    const normInc   = ms.filter((x) => !isSpecialShift(x)).reduce((s, x) => s + calcIncome(x), 0);
    const specInc   = ms.filter((x) =>  isSpecialShift(x)).reduce((s, x) => s + calcIncome(x), 0);
    const totalH    = ms.reduce((s, x) => s + S.shiftDurationHours(x.start, x.end), 0);

    html += prHead(isSingle ? `گزارش مالی — ${escapeHtml(pharmacyName(filter))}` : 'گزارش مالی ماهانه', period, genAt);
    html += `<div class="pr-rates-note">نرخ عادی: ${settings.rateNormal.toLocaleString()} تومان/ساعت &nbsp;|&nbsp; نرخ شب/تعطیل: ${settings.rateSpecial.toLocaleString()} تومان/ساعت</div>`;
    html += `<div class="pr-stats">
      <div class="pr-stat"><span class="pr-stat__value">${J.toPersianDigits(ms.length)}</span><span class="pr-stat__label">شیفت</span></div>
      <div class="pr-stat"><span class="pr-stat__value" style="font-size:11px">${Math.round(totalInc).toLocaleString()}</span><span class="pr-stat__label">درآمد کل (تومان)</span></div>
      <div class="pr-stat"><span class="pr-stat__value" style="font-size:11px">${Math.round(normInc).toLocaleString()}</span><span class="pr-stat__label">درآمد عادی</span></div>
      <div class="pr-stat pr-stat--special"><span class="pr-stat__value" style="font-size:11px">${Math.round(specInc).toLocaleString()}</span><span class="pr-stat__label">درآمد شب/تعطیل</span></div>
    </div>`;

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
        ${Object.entries(bk).sort((a,b) => b[1].inc-a[1].inc).map(([pid,d]) =>
          `<tr><td>${escapeHtml(pharmacyName(pid))}</td><td>${d.nH.toFixed(1)}</td><td class="pr-special">${d.sH.toFixed(1)}</td><td>${Math.round(d.inc).toLocaleString()}</td></tr>`).join('')}
        </tbody></table>`;
    }

    html += `<p class="pr-section-title">جزئیات شیفت‌ها</p>
      <table class="pr-table"><thead><tr><th>تاریخ</th><th>روز</th><th>نوع</th><th>داروخانه</th><th>شروع</th><th>پایان</th><th>مدت</th><th>درآمد (تومان)</th></tr></thead><tbody>
      ${ms.map((s) => {
        const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
        const wi = J.jalaliWeekday(jy, jm, jd);
        const h  = S.shiftDurationHours(s.start, s.end);
        const sp = isSpecialShift(s);
        const inc = calcIncome(s);
        return `<tr class="${sp ? 'pr-row-special' : ''}"><td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm-1]}</td><td>${J.PERSIAN_WEEKDAYS[wi]}</td><td>${sp ? '🌙' : '☀️'}</td><td>${escapeHtml(pharmacyName(s.pharmacyId))}</td><td>${s.start}</td><td>${s.end}</td><td>${h.toFixed(1)}</td><td>${Math.round(inc).toLocaleString()}</td></tr>`;
      }).join('')}
      </tbody><tfoot><tr><td colspan="6">مجموع</td><td>${totalH.toFixed(1)}</td><td>${Math.round(totalInc).toLocaleString()}</td></tr></tfoot></table>`;
  }

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
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
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

