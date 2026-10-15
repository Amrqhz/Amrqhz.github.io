import { G6PD_ITEMS, G6PD_RISK } from "./g6pd-data.js";

function norm(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670\u200c]/g, "")
    .trim();
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const RANK = { avoid: 0, caution: 1, safe: 2 };

const INDEX = G6PD_ITEMS.map((item) => ({
  item,
  hay: norm([item.nameEn, item.nameFa, item.group, ...(item.aliases || [])].join(" | ")),
}));

/** Used by the dose calculator: returns the strictest matching entry (or null). */
export function findG6pdMatch(drugName) {
  const n = norm(drugName);
  let best = null;
  for (const item of G6PD_ITEMS) {
    if ((item.match || []).some((m) => n.includes(m))) {
      if (!best || RANK[item.risk] < RANK[best.risk]) best = item;
    }
  }
  return best;
}

const INFO_HTML = `
  <p><strong>کمبود G6PD</strong> یک اختلال ارثی وابسته به کروموزوم X است. گلبول قرمز بدون این آنزیم در برابر استرس اکسیداتیو بی‌دفاع می‌ماند و با مواجهه با محرک، دچار <strong>هموليز</strong> می‌شود. مردان شایع‌تر مبتلا می‌شوند؛ زنان ناقل هم گاهی درجاتی از کمبود دارند.</p>
  <h4>محرک‌های اصلی</h4>
  <ul>
    <li>عفونت‌ها (شایع‌ترین محرک)</li>
    <li>داروهای اکسیدان (فهرست پایین)</li>
    <li>باقلا (فاویسم) و تماس با نفتالین</li>
  </ul>
  <h4>علائم هموليز (معمولاً ۱ تا ۴ روز پس از مواجهه)</h4>
  <ul>
    <li>ادرار تیره یا قهوه‌ای، زردی چشم و پوست</li>
    <li>رنگ‌پریدگی، ضعف شدید، تپش قلب، تنگی نفس</li>
    <li>تب، درد کمر یا شکم</li>
    <li>در نوزاد: زردی زودرس یا طول‌کشیده</li>
  </ul>
  <h4>نکات مشاوره‌ای</h4>
  <ul>
    <li>بیمار فهرست داروها و مواد ممنوع را همراه داشته باشد و به هر پزشک و داروساز اطلاع دهد.</li>
    <li>گیاهان دارویی، مکمل‌ها و فرآورده‌های موضعی نوزاد (حنا، کافور، منتول) را هم بپرسید.</li>
    <li>با بروز علائم هموليز، مصرف داروی مشکوک قطع و فوراً به پزشک مراجعه شود.</li>
    <li>سنجش آنزیم در حین هموليز حاد یا بعد از تزریق خون می‌تواند کاذباً طبیعی شود؛ تکرار پس از چند هفته تا ۳ ماه توصیه می‌شود.</li>
  </ul>`;

const DISCLAIMER =
  "این فهرست خلاصه‌ای آموزشی از منابع عمومی است. شدت خطر به نوع واریانت G6PD، دوز و وضعیت بیمار بستگی دارد و فهرست منابع مختلف با هم متفاوت است. برای تصمیم بالینی، منبع مرجع روز (مثل UpToDate یا Lexicomp) را بررسی کنید. «معمولاً ایمن» به معنای ضمانت نیست.";

let ui = null;
const state = { query: "", risk: null, open: new Set() };

function render() {
  const q = norm(state.query);
  const terms = q.split(/\s+/).filter(Boolean);
  let rows = INDEX.filter((r) => (!state.risk || r.item.risk === state.risk) && terms.every((t) => r.hay.includes(t)));
  rows.sort((a, b) => RANK[a.item.risk] - RANK[b.item.risk] || a.item.nameEn.localeCompare(b.item.nameEn));

  ui.list.innerHTML = "";
  ui.empty.hidden = rows.length > 0;
  rows.forEach(({ item }, i) => {
    const open = state.open.has(item.id);
    const li = document.createElement("li");
    li.style.animationDelay = Math.min(i, 8) * 20 + "ms";
    li.innerHTML = `
      <button type="button" class="result-item g6pd-item risk-${item.risk}" aria-expanded="${open}">
        <span class="risk-dot"></span>
        <span class="g6pd-main">
          <span class="r-name">${esc(item.nameFa)}</span>
          <span class="r-meta"><span class="mono">${esc(item.nameEn)}</span> · ${esc(item.group)}</span>
        </span>
        <span class="risk-badge">${G6PD_RISK[item.risk].label}</span>
      </button>
      <div class="g6pd-detail risk-${item.risk}" ${open ? "" : "hidden"}>${esc(item.note)}</div>`;
    li.querySelector("button").addEventListener("click", () => {
      if (state.open.has(item.id)) state.open.delete(item.id);
      else state.open.add(item.id);
      const det = li.querySelector(".g6pd-detail");
      det.hidden = !state.open.has(item.id);
      li.querySelector("button").setAttribute("aria-expanded", String(!det.hidden));
    });
    ui.list.appendChild(li);
  });
}

export function initG6pd() {
  ui = {
    search: document.getElementById("g6pdSearch"),
    clear: document.getElementById("clearG6pdSearch"),
    filter: document.getElementById("g6pdFilter"),
    list: document.getElementById("g6pdList"),
    empty: document.getElementById("g6pdEmpty"),
    infoToggle: document.getElementById("g6pdInfoToggle"),
    info: document.getElementById("g6pdInfo"),
    disclaimer: document.getElementById("g6pdDisclaimer"),
  };
  ui.info.innerHTML = INFO_HTML;
  ui.disclaimer.textContent = DISCLAIMER;

  const filters = [
    { id: null, label: "همه" },
    { id: "avoid", label: "اجتناب" },
    { id: "caution", label: "احتیاط" },
    { id: "safe", label: "معمولاً ایمن" },
  ];
  filters.forEach((f, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (i === 0 ? " is-active" : "");
    b.textContent = f.label;
    b.addEventListener("click", () => {
      state.risk = f.id;
      [...ui.filter.children].forEach((c) => c.classList.toggle("is-active", c === b));
      render();
    });
    ui.filter.appendChild(b);
  });

  ui.search.addEventListener("input", () => {
    state.query = ui.search.value;
    ui.clear.hidden = !ui.search.value;
    render();
  });
  ui.clear.addEventListener("click", () => {
    ui.search.value = "";
    state.query = "";
    ui.clear.hidden = true;
    render();
    ui.search.focus();
  });
  ui.infoToggle.addEventListener("click", () => {
    ui.info.hidden = !ui.info.hidden;
    ui.infoToggle.setAttribute("aria-expanded", String(!ui.info.hidden));
    ui.infoToggle.classList.toggle("is-open", !ui.info.hidden);
  });
  render();
}

/** Called from the calculator ("see in G6PD tab"). */
export function focusG6pd(item) {
  if (!ui) return;
  state.risk = null;
  [...ui.filter.children].forEach((c, i) => c.classList.toggle("is-active", i === 0));
  ui.search.value = item.nameEn;
  state.query = item.nameEn;
  ui.clear.hidden = false;
  state.open.add(item.id);
  render();
}
