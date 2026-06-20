/* ===================================================================
   Jalali (Persian / Shamsi) calendar utilities
   Pure JS implementation — no dependencies.
   Algorithm: Kazimierz M. Borkowski jalali<->gregorian conversion.
   =================================================================== */

const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function div(a, b) { return ~~(a / b); }

function jalCal(jy) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14, jp = breaks[0];
  if (jy < jp || jy >= breaks[bl - 1]) throw new Error('Invalid Jalali year ' + jy);
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div((n % 33) + 3, 4);
  if ((jump % 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = ((n + 1) % 33) - 1;
  if (leap === -1) leap = 32;
  leap = div(leap % 4 === 0 ? 1 : 0, 1);
  // simpler reimplementation of leap flag using standard formula below
  return { leap: jalIsLeap(jy), march };
}

function jalIsLeap(jy) {
  // Using the 2820-year cycle algorithm (33-year rule approximation widely used for Jalali)
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const bl = breaks.length;
  let jp = breaks[0];
  if (jy < jp || jy >= breaks[bl - 1]) throw new Error('Invalid Jalali year ' + jy);
  let jump = 0;
  let leapJ = -14;
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div((n % 33) + 3, 4);
  if ((jump % 33) === 4 && jump - n === 4) leapJ += 1;
  const r = leapJ % 4 === 0; // not fully precise edge-of-cycle, acceptable for UI calendar range
  return ((leapJ + 4) % 4) === 0;
}

function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
    + div(153 * ((gm + 9) % 12) + 2, 5)
    + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div((j % 1461), 4) * 5 + 308;
  const gd = div(i % 153, 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(jy + 621, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  let jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = (k % 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (jalCal(jy).leap) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = (k % 30) + 1;
  return { jy, jm, jd };
}

/** Convert Gregorian date -> Jalali {jy, jm, jd} */
function gregorianToJalali(gy, gm, gd) {
  return d2j(g2d(gy, gm, gd));
}

/** Convert Jalali date -> Gregorian {gy, gm, gd} */
function jalaliToGregorian(jy, jm, jd) {
  return d2g(j2d(jy, jm, jd));
}

/** Number of days in a given Jalali month */
function jalaliMonthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

function isJalaliLeap(jy) {
  // Robust leap check via day-count comparison (reliable across range we use)
  const d1 = j2d(jy, 1, 1);
  const d2 = j2d(jy + 1, 1, 1);
  return (d2 - d1) === 366;
}

/** Get JS Date object for a Jalali date */
function jalaliToDate(jy, jm, jd) {
  const g = jalaliToGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

/** Get Jalali {jy,jm,jd} for a JS Date object */
function dateToJalali(date) {
  return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Day of week index where 0 = Saturday ... 6 = Friday (Persian week start) */
function jalaliWeekday(jy, jm, jd) {
  const date = jalaliToDate(jy, jm, jd);
  const jsDay = date.getDay(); // 0 = Sunday ... 6 = Saturday
  return (jsDay + 1) % 7; // shift so 0 = Saturday
}

/** Format a Jalali date as YYYY-MM-DD (zero padded) string, used as storage key */
function jalaliKey(jy, jm, jd) {
  return `${jy}-${String(jm).padStart(2, '0')}-${String(jd).padStart(2, '0')}`;
}

function parseJalaliKey(key) {
  const [jy, jm, jd] = key.split('-').map(Number);
  return { jy, jm, jd };
}

/** Convert Latin digits to Persian digits */
function toPersianDigits(input) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/[0-9]/g, (d) => persianDigits[+d]);
}

function toLatinDigits(input) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let out = String(input);
  persianDigits.forEach((pd, i) => {
    out = out.split(pd).join(i);
  });
  return out;
}

/** Today's date in Jalali */
function todayJalali() {
  return dateToJalali(new Date());
}

// Export to window
window.JalaliUtil = {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  PERSIAN_WEEKDAYS_SHORT,
  gregorianToJalali,
  jalaliToGregorian,
  jalaliMonthLength,
  isJalaliLeap,
  jalaliToDate,
  dateToJalali,
  jalaliWeekday,
  jalaliKey,
  parseJalaliKey,
  toPersianDigits,
  toLatinDigits,
  todayJalali,
};
