/* ===================================================================
   App logic
   =================================================================== */

const J = window.JalaliUtil;
const S = window.Store;

let pharmacies = S.loadPharmacies();
let shifts = S.loadShifts();

let viewYear, viewMonth; // currently displayed Jalali year/month
let selectedDateKey = null; // the day currently open in the sheet

const todayJ = J.todayJalali();

function init() {
  viewYear = todayJ.jy;
  viewMonth = todayJ.jm;

  renderWeekHeader();
  bindNav();
  bindMonthControls();
  bindSheet();
  bindPharmacyForm();
  bindShiftForm();
  bindExport();

  renderCalendar();
  renderPharmacyList();
  renderPharmacySelect();
  registerServiceWorker();
}

/* ===================== NAVIGATION BETWEEN VIEWS ===================== */

function bindNav() {
  document.querySelectorAll('.navbtn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.navbtn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const target = btn.dataset.view;
      document.querySelectorAll('.view').forEach((v) => v.setAttribute('data-active', 'false'));
      document.getElementById(`view-${target}`).setAttribute('data-active', 'true');
      if (target === 'summary') renderSummary();
      if (target === 'pharmacies') renderPharmacyList();
    });
  });
}

/* ===================== WEEK HEADER ===================== */

function renderWeekHeader() {
  const el = document.getElementById('weekHeader');
  el.innerHTML = J.PERSIAN_WEEKDAYS_SHORT.map((d) => `<span>${d}</span>`).join('');
}

/* ===================== MONTH NAVIGATION ===================== */

function bindMonthControls() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    viewMonth -= 1;
    if (viewMonth < 1) { viewMonth = 12; viewYear -= 1; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    viewMonth += 1;
    if (viewMonth > 12) { viewMonth = 1; viewYear += 1; }
    renderCalendar();
  });
  document.getElementById('gotoToday').addEventListener('click', () => {
    viewYear = todayJ.jy;
    viewMonth = todayJ.jm;
    renderCalendar();
  });
}

/* ===================== CALENDAR RENDER ===================== */

function shiftsForDate(dateKey) {
  return shifts
    .filter((s) => s.dateKey === dateKey)
    .sort((a, b) => a.start.localeCompare(b.start));
}

function pharmacyName(id) {
  const p = pharmacies.find((x) => x.id === id);
  return p ? p.name : '—';
}

function renderCalendar() {
  const monthLabel = document.getElementById('monthLabel');
  monthLabel.textContent = `${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const firstWeekday = J.jalaliWeekday(viewYear, viewMonth, 1); // 0 = Saturday
  const monthLen = J.jalaliMonthLength(viewYear, viewMonth);

  // previous month info for leading filler cells
  let prevMonth = viewMonth - 1, prevYear = viewYear;
  if (prevMonth < 1) { prevMonth = 12; prevYear -= 1; }
  const prevMonthLen = J.jalaliMonthLength(prevYear, prevMonth);

  const cells = [];

  // leading filler (previous month, dim)
  for (let i = 0; i < firstWeekday; i += 1) {
    const d = prevMonthLen - firstWeekday + i + 1;
    cells.push({ jy: prevYear, jm: prevMonth, jd: d, outside: true });
  }

  // current month
  for (let d = 1; d <= monthLen; d += 1) {
    cells.push({ jy: viewYear, jm: viewMonth, jd: d, outside: false });
  }

  // trailing filler to complete the grid (next month, dim) — fill to multiple of 7
  let nextMonth = viewMonth + 1, nextYear = viewYear;
  if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
  let trail = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ jy: nextYear, jm: nextMonth, jd: trail, outside: true });
    trail += 1;
  }

  cells.forEach((c) => {
    const dateKey = J.jalaliKey(c.jy, c.jm, c.jd);
    const dayShifts = shiftsForDate(dateKey);
    const isToday = c.jy === todayJ.jy && c.jm === todayJ.jm && c.jd === todayJ.jd;

    const cell = document.createElement('div');
    const weekdayIdxForCell = J.jalaliWeekday(c.jy, c.jm, c.jd);
    const isWeekend = weekdayIdxForCell === 6; // Friday
    cell.className = 'daycell' + (c.outside ? ' is-outside' : '') + (isToday ? ' is-today' : '') + (isWeekend ? ' is-weekend' : '');
    cell.setAttribute('role', 'gridcell');
    cell.dataset.dateKey = dateKey;

    const num = document.createElement('span');
    num.className = 'daynum';
    num.textContent = J.toPersianDigits(c.jd);
    cell.appendChild(num);

    if (dayShifts.length > 0) {
      const ticksWrap = document.createElement('div');
      ticksWrap.className = 'daycell__ticks';

      const maxShow = 2;
      dayShifts.slice(0, maxShow).forEach((s) => {
        const tick = document.createElement('div');
        tick.className = 'shift-tick';
        tick.innerHTML = `<span class="shift-tick__time">${s.start}</span><span class="shift-tick__name">${escapeHtml(pharmacyName(s.pharmacyId))}</span>`;
        ticksWrap.appendChild(tick);
      });
      if (dayShifts.length > maxShow) {
        const more = document.createElement('div');
        more.className = 'daycell__more';
        more.textContent = `+${J.toPersianDigits(dayShifts.length - maxShow)} مورد دیگر`;
        ticksWrap.appendChild(more);
      }
      cell.appendChild(ticksWrap);
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
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===================== TOP BAR MONTH SUMMARY LINE ===================== */

function updateMonthSummaryLine() {
  const monthShifts = shifts.filter((s) => {
    const { jy, jm } = J.parseJalaliKey(s.dateKey);
    return jy === viewYear && jm === viewMonth;
  });
  const totalHours = monthShifts.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
  const line = document.getElementById('monthSummaryLine');
  if (monthShifts.length === 0) {
    line.textContent = 'شیفتی برای این ماه ثبت نشده';
  } else {
    line.textContent = `${J.toPersianDigits(monthShifts.length)} شیفت · ${J.toPersianDigits(totalHours.toFixed(1))} ساعت`;
  }
}

/* ===================== DAY SHEET (bottom sheet for a day) ===================== */

function bindSheet() {
  document.getElementById('closeSheet').addEventListener('click', closeDaySheet);
  document.getElementById('sheetBackdrop').addEventListener('click', closeDaySheet);
}

function openDaySheet(jy, jm, jd) {
  selectedDateKey = J.jalaliKey(jy, jm, jd);
  const weekdayIdx = J.jalaliWeekday(jy, jm, jd);
  document.getElementById('sheetDateLabel').textContent =
    `${J.PERSIAN_WEEKDAYS[weekdayIdx]} ${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]} ${J.toPersianDigits(jy)}`;

  resetShiftForm();
  renderExistingShiftsForDay();
  renderPharmacySelect();

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
    const row = document.createElement('div');
    row.className = 'existing-shift';
    row.innerHTML = `
      <div class="existing-shift__info">
        <div class="existing-shift__pharm">${escapeHtml(pharmacyName(s.pharmacyId))}</div>
        <div class="existing-shift__time">${s.start} – ${s.end} · ${J.toPersianDigits(hours.toFixed(1))} ساعت</div>
        ${s.note ? `<div class="existing-shift__note">${escapeHtml(s.note)}</div>` : ''}
      </div>
      <div class="existing-shift__actions">
        <button class="minibtn" data-action="edit" data-id="${s.id}">ویرایش</button>
        <button class="minibtn" data-action="delete" data-id="${s.id}">حذف</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll('[data-action="edit"]').forEach((btn) => {
    btn.addEventListener('click', () => loadShiftIntoForm(btn.dataset.id));
  });
  wrap.querySelectorAll('[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', () => deleteShift(btn.dataset.id));
  });
}

/* ===================== SHIFT FORM (inside sheet) ===================== */

function bindShiftForm() {
  document.getElementById('shiftForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveShiftFromForm();
  });
  document.getElementById('cancelShiftEdit').addEventListener('click', resetShiftForm);
}

function resetShiftForm() {
  document.getElementById('shiftEditId').value = '';
  document.getElementById('shiftStart').value = '';
  document.getElementById('shiftEnd').value = '';
  document.getElementById('shiftNote').value = '';
  document.getElementById('saveShiftBtn').textContent = 'ثبت شیفت';
  document.getElementById('cancelShiftEdit').hidden = true;
}

function loadShiftIntoForm(id) {
  const s = shifts.find((x) => x.id === id);
  if (!s) return;
  document.getElementById('shiftEditId').value = s.id;
  document.getElementById('shiftPharmacySelect').value = s.pharmacyId;
  document.getElementById('shiftStart').value = s.start;
  document.getElementById('shiftEnd').value = s.end;
  document.getElementById('shiftNote').value = s.note || '';
  document.getElementById('saveShiftBtn').textContent = 'به‌روزرسانی شیفت';
  document.getElementById('cancelShiftEdit').hidden = false;
  document.getElementById('shiftPharmacySelect').focus();
}

function saveShiftFromForm() {
  if (pharmacies.length === 0) {
    showToast('ابتدا یک داروخانه اضافه کنید');
    return;
  }
  const editId = document.getElementById('shiftEditId').value;
  const pharmacyId = document.getElementById('shiftPharmacySelect').value;
  const start = document.getElementById('shiftStart').value;
  const end = document.getElementById('shiftEnd').value;
  const note = document.getElementById('shiftNote').value.trim();

  if (!start || !end) {
    showToast('ساعت شروع و پایان را وارد کنید');
    return;
  }

  if (editId) {
    const s = shifts.find((x) => x.id === editId);
    if (s) {
      s.pharmacyId = pharmacyId;
      s.start = start;
      s.end = end;
      s.note = note;
    }
    showToast('شیفت به‌روزرسانی شد');
  } else {
    shifts.push({
      id: S.uid(),
      dateKey: selectedDateKey,
      pharmacyId,
      start,
      end,
      note,
    });
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

/* ===================== PHARMACIES ===================== */

function bindPharmacyForm() {
  document.getElementById('pharmacyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('pharmacyNameInput');
    const addrInput = document.getElementById('pharmacyAddrInput');
    const name = nameInput.value.trim();
    if (!name) return;
    pharmacies.push({ id: S.uid(), name, address: addrInput.value.trim() });
    S.savePharmacies(pharmacies);
    nameInput.value = '';
    addrInput.value = '';
    renderPharmacyList();
    renderPharmacySelect();
    showToast('داروخانه اضافه شد');
  });
}

function renderPharmacyList() {
  const list = document.getElementById('pharmacyList');
  if (pharmacies.length === 0) {
    list.innerHTML = '<li class="pharmacy-empty">هنوز داروخانه‌ای ثبت نشده است.</li>';
    return;
  }
  list.innerHTML = '';
  pharmacies.forEach((p) => {
    const shiftCount = shifts.filter((s) => s.pharmacyId === p.id).length;
    const li = document.createElement('li');
    li.className = 'pharmacy-item';
    li.innerHTML = `
      <div>
        <div class="pharmacy-item__name">${escapeHtml(p.name)}</div>
        ${p.address ? `<div class="pharmacy-item__addr">${escapeHtml(p.address)}</div>` : ''}
        <div class="pharmacy-item__addr">${J.toPersianDigits(shiftCount)} شیفت ثبت شده</div>
      </div>
      <button class="pharmacy-item__del" data-id="${p.id}">حذف</button>
    `;
    list.appendChild(li);
  });
  list.querySelectorAll('.pharmacy-item__del').forEach((btn) => {
    btn.addEventListener('click', () => deletePharmacy(btn.dataset.id));
  });
}

function deletePharmacy(id) {
  const usedCount = shifts.filter((s) => s.pharmacyId === id).length;
  if (usedCount > 0) {
    const ok = confirm(`این داروخانه در ${usedCount} شیفت استفاده شده. در صورت حذف، آن شیفت‌ها هم حذف می‌شوند. ادامه می‌دهید؟`);
    if (!ok) return;
    shifts = shifts.filter((s) => s.pharmacyId !== id);
    S.saveShifts(shifts);
  }
  pharmacies = pharmacies.filter((p) => p.id !== id);
  S.savePharmacies(pharmacies);
  renderPharmacyList();
  renderPharmacySelect();
  renderCalendar();
  showToast('داروخانه حذف شد');
}

function renderPharmacySelect() {
  const select = document.getElementById('shiftPharmacySelect');
  const prevVal = select.value;
  select.innerHTML = pharmacies
    .map((p) => `<option value="${p.id}">${escapeHtml(p.name)}</option>`)
    .join('');
  if (prevVal && pharmacies.some((p) => p.id === prevVal)) select.value = prevVal;
}

/* ===================== SUMMARY VIEW ===================== */

function renderSummary() {
  const monthShifts = shifts
    .filter((s) => {
      const { jy, jm } = J.parseJalaliKey(s.dateKey);
      return jy === viewYear && jm === viewMonth;
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.start.localeCompare(b.start));

  const totalHours = monthShifts.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
  const uniqueDays = new Set(monthShifts.map((s) => s.dateKey)).size;
  const uniquePharmacies = new Set(monthShifts.map((s) => s.pharmacyId)).size;

  const statGrid = document.getElementById('statGrid');
  statGrid.innerHTML = `
    <div class="statcard">
      <span class="statcard__value">${J.toPersianDigits(monthShifts.length)}</span>
      <span class="statcard__label">تعداد شیفت — ${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}</span>
    </div>
    <div class="statcard">
      <span class="statcard__value">${J.toPersianDigits(totalHours.toFixed(1))}</span>
      <span class="statcard__label">مجموع ساعت کارکرد</span>
    </div>
    <div class="statcard">
      <span class="statcard__value">${J.toPersianDigits(uniqueDays)}</span>
      <span class="statcard__label">روز کاری</span>
    </div>
    <div class="statcard">
      <span class="statcard__value">${J.toPersianDigits(uniquePharmacies)}</span>
      <span class="statcard__label">داروخانه فعال</span>
    </div>
  `;

  const breakdown = {};
  monthShifts.forEach((s) => {
    if (!breakdown[s.pharmacyId]) breakdown[s.pharmacyId] = { count: 0, hours: 0 };
    breakdown[s.pharmacyId].count += 1;
    breakdown[s.pharmacyId].hours += S.shiftDurationHours(s.start, s.end);
  });

  const breakdownBody = document.querySelector('#pharmacyBreakdownTable tbody');
  const breakdownEntries = Object.entries(breakdown).sort((a, b) => b[1].hours - a[1].hours);
  if (breakdownEntries.length === 0) {
    breakdownBody.innerHTML = '<tr class="empty-row"><td colspan="3">شیفتی برای این ماه ثبت نشده است.</td></tr>';
  } else {
    breakdownBody.innerHTML = breakdownEntries.map(([pid, data]) => `
      <tr>
        <td>${escapeHtml(pharmacyName(pid))}</td>
        <td class="num">${J.toPersianDigits(data.count)}</td>
        <td class="num">${J.toPersianDigits(data.hours.toFixed(1))}</td>
      </tr>
    `).join('');
  }

  const listBody = document.querySelector('#monthShiftsTable tbody');
  if (monthShifts.length === 0) {
    listBody.innerHTML = '<tr class="empty-row"><td colspan="7">شیفتی برای این ماه ثبت نشده است.</td></tr>';
  } else {
    listBody.innerHTML = monthShifts.map((s) => {
      const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
      const weekdayIdx = J.jalaliWeekday(jy, jm, jd);
      const hours = S.shiftDurationHours(s.start, s.end);
      return `
        <tr>
          <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}</td>
          <td>${J.PERSIAN_WEEKDAYS[weekdayIdx]}</td>
          <td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>
          <td class="num">${s.start}</td>
          <td class="num">${s.end}</td>
          <td class="num">${J.toPersianDigits(hours.toFixed(1))}</td>
          <td><button class="rowdelete" data-id="${s.id}">حذف</button></td>
        </tr>
      `;
    }).join('');
    listBody.querySelectorAll('.rowdelete').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteShift(btn.dataset.id);
        renderSummary();
      });
    });
  }
}

/* ===================== EXPORT ===================== */

function bindExport() {
  document.getElementById('exportMonthBtn').addEventListener('click', exportMonthCsv);
  document.getElementById('exportJsonBtn').addEventListener('click', exportJsonBackup);
  document.getElementById('exportPdfBtn').addEventListener('click', exportMonthPdf);
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvEscape(val) {
  const str = String(val == null ? '' : val);
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function exportMonthCsv() {
  const monthShifts = shifts
    .filter((s) => {
      const { jy, jm } = J.parseJalaliKey(s.dateKey);
      return jy === viewYear && jm === viewMonth;
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.start.localeCompare(b.start));

  if (monthShifts.length === 0) {
    showToast('شیفتی برای خروجی‌گیری وجود ندارد');
    return;
  }

  const header = ['تاریخ (شمسی)', 'روز هفته', 'داروخانه', 'آدرس داروخانه', 'ساعت شروع', 'ساعت پایان', 'مدت (ساعت)', 'یادداشت'];
  const rows = monthShifts.map((s) => {
    const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
    const weekdayIdx = J.jalaliWeekday(jy, jm, jd);
    const p = pharmacies.find((x) => x.id === s.pharmacyId);
    const hours = S.shiftDurationHours(s.start, s.end);
    return [
      jy + '/' + String(jm).padStart(2, '0') + '/' + String(jd).padStart(2, '0'),
      J.PERSIAN_WEEKDAYS[weekdayIdx],
      p ? p.name : '',
      p ? (p.address || '') : '',
      s.start,
      s.end,
      hours.toFixed(2),
      s.note || '',
    ];
  });

  const totalHours = monthShifts.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
  rows.push([]);
  rows.push(['', '', '', '', '', 'مجموع ساعت:', totalHours.toFixed(2), '']);

  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
  const filename = 'shifts-' + viewYear + '-' + String(viewMonth).padStart(2, '0') + '.csv';
  downloadFile(filename, csv, 'text/csv;charset=utf-8');
  showToast('فایل CSV دانلود شد');
}

function exportJsonBackup() {
  const data = {
    exportedAt: new Date().toISOString(),
    pharmacies,
    shifts,
  };
  downloadFile('shift-planner-backup.json', JSON.stringify(data, null, 2), 'application/json');
  showToast('فایل پشتیبان دانلود شد');
}

/* ===================== PDF EXPORT (via browser print, offline-safe) ===================== */

function exportMonthPdf() {
  const monthShifts = shifts
    .filter((s) => {
      const { jy, jm } = J.parseJalaliKey(s.dateKey);
      return jy === viewYear && jm === viewMonth;
    })
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.start.localeCompare(b.start));

  if (monthShifts.length === 0) {
    showToast('شیفتی برای خروجی‌گیری وجود ندارد');
    return;
  }

  const totalHours = monthShifts.reduce((sum, s) => sum + S.shiftDurationHours(s.start, s.end), 0);
  const uniqueDays = new Set(monthShifts.map((s) => s.dateKey)).size;
  const uniquePharmacies = new Set(monthShifts.map((s) => s.pharmacyId)).size;

  const breakdown = {};
  monthShifts.forEach((s) => {
    if (!breakdown[s.pharmacyId]) breakdown[s.pharmacyId] = { count: 0, hours: 0 };
    breakdown[s.pharmacyId].count += 1;
    breakdown[s.pharmacyId].hours += S.shiftDurationHours(s.start, s.end);
  });
  const breakdownEntries = Object.entries(breakdown).sort((a, b) => b[1].hours - a[1].hours);

  const breakdownRows = breakdownEntries.map(([pid, data]) => `
    <tr>
      <td>${escapeHtml(pharmacyName(pid))}</td>
      <td>${J.toPersianDigits(data.count)}</td>
      <td>${J.toPersianDigits(data.hours.toFixed(1))}</td>
    </tr>
  `).join('');

  const shiftRows = monthShifts.map((s) => {
    const { jy, jm, jd } = J.parseJalaliKey(s.dateKey);
    const weekdayIdx = J.jalaliWeekday(jy, jm, jd);
    const hours = S.shiftDurationHours(s.start, s.end);
    return `
      <tr>
        <td>${J.toPersianDigits(jd)} ${J.PERSIAN_MONTHS[jm - 1]}</td>
        <td>${J.PERSIAN_WEEKDAYS[weekdayIdx]}</td>
        <td>${escapeHtml(pharmacyName(s.pharmacyId))}</td>
        <td>${s.start}</td>
        <td>${s.end}</td>
        <td>${J.toPersianDigits(hours.toFixed(1))}</td>
        <td>${s.note ? escapeHtml(s.note) : '—'}</td>
      </tr>
    `;
  }).join('');

  const now = new Date();
  const generatedAt = `${J.toPersianDigits(todayJ.jy)}/${J.toPersianDigits(String(todayJ.jm).padStart(2,'0'))}/${J.toPersianDigits(String(todayJ.jd).padStart(2,'0'))}`;

  const reportHtml = `
    <div class="pr-head">
      <div class="pr-head__brand">
        <div class="pr-head__mark">℞</div>
        <div>
          <p class="pr-head__title">گزارش شیفت ماهانه</p>
          <p class="pr-head__period">${J.PERSIAN_MONTHS[viewMonth - 1]} ${J.toPersianDigits(viewYear)}</p>
        </div>
      </div>
      <div class="pr-head__meta">تاریخ تهیه گزارش: ${generatedAt}</div>
    </div>

    <div class="pr-stats">
      <div class="pr-stat">
        <span class="pr-stat__value">${J.toPersianDigits(monthShifts.length)}</span>
        <span class="pr-stat__label">تعداد شیفت</span>
      </div>
      <div class="pr-stat">
        <span class="pr-stat__value">${J.toPersianDigits(totalHours.toFixed(1))}</span>
        <span class="pr-stat__label">مجموع ساعت کارکرد</span>
      </div>
      <div class="pr-stat">
        <span class="pr-stat__value">${J.toPersianDigits(uniqueDays)}</span>
        <span class="pr-stat__label">روز کاری</span>
      </div>
      <div class="pr-stat">
        <span class="pr-stat__value">${J.toPersianDigits(uniquePharmacies)}</span>
        <span class="pr-stat__label">داروخانه فعال</span>
      </div>
    </div>

    <p class="pr-section-title">تفکیک بر اساس داروخانه</p>
    <table class="pr-table">
      <thead><tr><th>داروخانه</th><th>تعداد شیفت</th><th>مجموع ساعت</th></tr></thead>
      <tbody>${breakdownRows}</tbody>
    </table>

    <p class="pr-section-title">فهرست کامل شیفت‌های ماه</p>
    <table class="pr-table">
      <thead>
        <tr><th>تاریخ</th><th>روز هفته</th><th>داروخانه</th><th>شروع</th><th>پایان</th><th>مدت (ساعت)</th><th>یادداشت</th></tr>
      </thead>
      <tbody>${shiftRows}</tbody>
      <tfoot>
        <tr><td colspan="5">مجموع</td><td>${J.toPersianDigits(totalHours.toFixed(1))}</td><td></td></tr>
      </tfoot>
    </table>

    <div class="pr-foot">
      <span>دفتر شیفت — برنامه‌ریز شیفت داروخانه</span>
      <span>تقویم: شمسی (جلالی)</span>
    </div>
  `;

  const reportEl = document.getElementById('printableReport');
  reportEl.innerHTML = reportHtml;

  document.title = `گزارش شیفت ${J.PERSIAN_MONTHS[viewMonth - 1]} ${viewYear}`;
  window.print();
  setTimeout(() => { document.title = 'دفتر شیفت'; }, 500);
}

/* ===================== TOAST ===================== */

let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-show'), 2200);
}

/* ===================== SERVICE WORKER ===================== */

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((err) => {
        console.warn('SW registration failed', err);
      });
    });
  }
}
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

    function showSuccess(message = '✅ Shared successfully!') {
      successMessage.textContent = message;
      successMessage.style.opacity = '1';
      
      // Hide message after 3 seconds
      setTimeout(() => {
        successMessage.style.opacity = '0';
      }, 3000);
    }

    // Bonus: Make it work even better on mobile
    console.log('%cShare button ready! 🚀', 'color: #fff; font-size: 14px;');

/* ===================== BOOT ===================== */

document.addEventListener('DOMContentLoaded', init);
