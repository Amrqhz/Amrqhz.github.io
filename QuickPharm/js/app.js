import { DRUGS } from "./drugs-data.js";
import { calculateDose, formatAge } from "./calculator.js";
import { ALIASES } from "./aliases.js";
import { COMPOUNDS, CATEGORIES } from "./compounds-data.js";
import { getFormIcon } from "./compound-icons.js";
import { estimateWeightKg } from "./weight-estimate.js";

/* ---------------------------------------------------------- search index */

function normalize(str) {
  return (str || "")
    .toString()
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670]/g, "") // arabic diacritics
    .trim();
}

const SEARCH_INDEX = DRUGS.map((d) => {
  const terms = [d.name, ...(ALIASES[d.name] || [])].filter(Boolean).map(normalize);
  return {
    drug: d,
    terms,
    haystack: normalize(
      [d.name, d.concentration, ...(d.indications || []), ...(ALIASES[d.name] || [])]
        .filter(Boolean)
        .join(" | ")
    ),
  };
});

function search(query) {
  const q = normalize(query);
  if (!q) return [];
  const queryTerms = q.split(/\s+/).filter(Boolean);
  const matches = SEARCH_INDEX.filter((entry) => queryTerms.every((t) => entry.haystack.includes(t)));

  const score = (entry) => {
    if (entry.terms.some((t) => t === q)) return 0;
    if (entry.terms.some((t) => t.startsWith(q))) return 1;
    if (entry.haystack.startsWith(q)) return 2;
    return 3;
  };
  matches.sort((a, b) => score(a) - score(b));

  return matches.slice(0, 30).map((e) => e.drug);
}

/* --------------------------------------------------------------- state */

const state = {
  drug: null,
  indication: null,
  useEstimatedWeight: false,
};

/* ------------------------------------------------------------- els */

const el = {
  search: document.getElementById("drugSearch"),
  clearSearch: document.getElementById("clearSearch"),
  resultsList: document.getElementById("resultsList"),
  emptyHint: document.getElementById("emptyHint"),
  selectedPanel: document.getElementById("selectedPanel"),
  drugForm: document.getElementById("drugForm"),
  drugName: document.getElementById("drugName"),
  drugStrength: document.getElementById("drugStrength"),
  resetDrug: document.getElementById("resetDrug"),
  indicationRow: document.getElementById("indicationRow"),
  indicationChips: document.getElementById("indicationChips"),
  weightInput: document.getElementById("weightInput"),
  weightInputWrap: document.getElementById("weightInputWrap"),
  estimateToggle: document.getElementById("estimateToggle"),
  estimateHint: document.getElementById("estimateHint"),
  ageYearsInput: document.getElementById("ageYearsInput"),
  ageMonthsInput: document.getElementById("ageMonthsInput"),
  resultBlock: document.getElementById("resultBlock"),
  resultBody: document.getElementById("resultBody"),
  promptHint: document.getElementById("promptHint"),
};

/* --------------------------------------------------------- search UI */

el.search.addEventListener("input", () => {
  const q = el.search.value;
  el.clearSearch.hidden = q.length === 0;
  const matches = search(q);
  renderResults(matches, q);
});

el.clearSearch.addEventListener("click", () => {
  el.search.value = "";
  el.clearSearch.hidden = true;
  el.resultsList.hidden = true;
  el.emptyHint.hidden = true;
  el.search.focus();
});

function renderResults(matches, query) {
  el.resultsList.innerHTML = "";
  if (!query) {
    el.resultsList.hidden = true;
    el.emptyHint.hidden = true;
    return;
  }
  if (matches.length === 0) {
    el.resultsList.hidden = true;
    el.emptyHint.hidden = false;
    return;
  }
  el.emptyHint.hidden = true;
  el.resultsList.hidden = false;
  for (const drug of matches) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "result-item";
    btn.innerHTML = `
      <span class="r-name">${escapeHtml(drug.name)}</span>
      <span class="r-meta"><span class="r-strength">${escapeHtml(drug.concentration || "")}</span> · ${escapeHtml(drug.dosageform || "")}</span>
    `;
    btn.addEventListener("click", () => selectDrug(drug));
    li.appendChild(btn);
    el.resultsList.appendChild(li);
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* -------------------------------------------------------- drug select */

function selectDrug(drug) {
  state.drug = drug;
  state.indication = drug.indications && drug.indications.length ? drug.indications[0] : null;

  el.search.value = "";
  el.resultsList.hidden = true;
  el.emptyHint.hidden = true;

  el.drugForm.textContent = drug.dosageform || "";
  el.drugName.textContent = drug.name;
  el.drugStrength.textContent = drug.concentration || "غلظت ثبت‌نشده";

  if (drug.calculationType === "weightBased" && drug.indications && drug.indications.length > 1) {
    el.indicationRow.hidden = false;
    el.indicationChips.innerHTML = "";
    for (const ind of drug.indications) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (ind === state.indication ? " is-active" : "");
      chip.textContent = ind;
      chip.addEventListener("click", () => {
        state.indication = ind;
        [...el.indicationChips.children].forEach((c) => c.classList.toggle("is-active", c === chip));
        computeAndRender();
      });
      el.indicationChips.appendChild(chip);
    }
  } else {
    el.indicationRow.hidden = true;
  }

  el.selectedPanel.hidden = false;
  el.resultBlock.hidden = true;
  el.promptHint.hidden = false;
  el.weightInput.focus();
  computeAndRender();
}

el.resetDrug.addEventListener("click", () => {
  state.drug = null;
  state.indication = null;
  el.selectedPanel.hidden = true;
  el.weightInput.value = "";
  el.ageYearsInput.value = "";
  el.ageMonthsInput.value = "";
  setEstimateMode(false);
  el.search.focus();
});

/* --------------------------------------------------- weight estimation */

function setEstimateMode(on) {
  state.useEstimatedWeight = on;
  el.estimateToggle.classList.toggle("is-active", on);
  el.weightInputWrap.classList.toggle("is-estimated", on);
  el.weightInput.readOnly = on;
  if (on) {
    refreshEstimatedWeight();
  } else {
    el.weightInput.value = "";
    el.estimateHint.hidden = true;
    el.weightInput.focus();
  }
  computeAndRender();
}

function refreshEstimatedWeight() {
  if (!state.useEstimatedWeight) return;
  const ageInYears = getAgeInYears();
  el.estimateHint.hidden = false;

  if (ageInYears === null) {
    el.weightInput.value = "";
    el.estimateHint.textContent = "ابتدا سن کودک را وارد کنید.";
    return;
  }
  const kg = estimateWeightKg(ageInYears);
  if (kg === null) {
    el.weightInput.value = "";
    el.estimateHint.textContent = "برای سنین بالای ۱۲ سال این تخمین معتبر نیست — وزن واقعی را وارد کنید.";
    return;
  }
  el.weightInput.value = kg;
  el.estimateHint.textContent = `وزن تخمینی بر اساس سن، برای کودک سالم با رشد طبیعی: ${formatNumber(kg)} کیلوگرم.`;
}

el.estimateToggle.addEventListener("click", () => setEstimateMode(!state.useEstimatedWeight));

/* ------------------------------------------------------------- compute */

[el.weightInput, el.ageYearsInput, el.ageMonthsInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (state.useEstimatedWeight && (input === el.ageYearsInput || input === el.ageMonthsInput)) {
      refreshEstimatedWeight();
    }
    computeAndRender();
  });
});

function getAgeInYears() {
  const y = parseFloat(el.ageYearsInput.value);
  const m = parseFloat(el.ageMonthsInput.value);
  const years = Number.isFinite(y) ? y : 0;
  const months = Number.isFinite(m) ? m : 0;
  if (!el.ageYearsInput.value && !el.ageMonthsInput.value) return null;
  return years + months / 12;
}

function computeAndRender() {
  if (!state.drug) return;
  const weightKg = parseFloat(el.weightInput.value);
  const ageInYears = getAgeInYears();

  if (!Number.isFinite(weightKg) || weightKg <= 0 || ageInYears === null) {
    el.resultBlock.hidden = true;
    el.promptHint.hidden = false;
    return;
  }

  el.promptHint.hidden = true;
  const result = calculateDose(state.drug, { ageInYears, weightKg, indication: state.indication });
  renderResult(result, state.useEstimatedWeight);
}

function renderResult(result, isEstimatedWeight) {
  el.resultBlock.hidden = false;
  el.resultBody.innerHTML = "";

  if (isEstimatedWeight && (result.kind === "weightBased" || result.kind === "standard")) {
    el.resultBody.appendChild(
      flag("amber", "این محاسبه بر پایه وزن تخمینی (از روی سن) است، نه وزن اندازه‌گیری‌شده — در صورت امکان از وزن واقعی کودک استفاده کنید.")
    );
  }

  if (result.kind === "blocked") {
    el.resultBody.appendChild(flag("brick", result.reason));
    return;
  }

  if (result.kind === "unavailable") {
    el.resultBody.appendChild(flag("amber", result.reason));
    if (result.note) el.resultBody.appendChild(noteBlock(result.note));
    return;
  }

  if (result.kind === "standard") {
    const text = document.createElement("p");
    text.className = "result-text";
    text.textContent = result.text;
    el.resultBody.appendChild(text);
    if (result.note) el.resultBody.appendChild(noteBlock(result.note));
    return;
  }

  if (result.kind === "weightBased") {
    if (result.volumeMl == null) {
      el.resultBody.appendChild(flag("amber", "غلظت فرآورده (ds) ثبت نشده — نمی‌توان حجم را محاسبه کرد."));
      return;
    }

    const headline = document.createElement("div");
    headline.className = "result-headline";
    const value = document.createElement("span");
    value.className = "result-value";
    value.textContent = formatNumber(result.volumeMl);
    const unit = document.createElement("span");
    unit.className = "result-unit";
    unit.textContent = "میلی‌لیتر / دوز";
    headline.append(value, unit);
    el.resultBody.appendChild(headline);

    const sub = document.createElement("p");
    sub.className = "result-sub";
    sub.textContent = `هر ${result.frequency} ساعت یک‌بار — ${formatNumber(result.perDoseMg)} میلی‌گرم در هر دوز`;
    el.resultBody.appendChild(sub);

    const facts = document.createElement("div");
    facts.className = "result-facts";
    facts.appendChild(fact("دفعات در روز", result.timesPerDay ? `${formatNumber(result.timesPerDay)} بار` : "—"));
    facts.appendChild(fact("مجموع روزانه", result.dailyMg ? `${formatNumber(result.dailyMg)} mg` : "—"));
    el.resultBody.appendChild(facts);

    if (result.wasCapped) {
      el.resultBody.appendChild(
        flag("amber", `دوز محاسبه‌شده بر اساس وزن (${formatNumber(result.rawMg)} mg) از سقف مجاز بیشتر بود و در سقف دوز (${formatNumber(result.params.maxDose)} mg) محدود شد.`)
      );
    }

    if (result.indicationNote) el.resultBody.appendChild(noteBlock(result.indicationNote));
    if (result.note) el.resultBody.appendChild(noteBlock(result.note));
  }
}

function fact(label, value) {
  const wrap = document.createElement("div");
  wrap.className = "fact";
  wrap.innerHTML = `<span class="fact-label">${escapeHtml(label)}</span><span class="fact-value">${escapeHtml(value)}</span>`;
  return wrap;
}

function flag(kind, message) {
  const wrap = document.createElement("div");
  wrap.className = `flag ${kind}`;
  wrap.innerHTML = `<span class="flag-dot"></span><span>${escapeHtml(message)}</span>`;
  return wrap;
}

function noteBlock(text) {
  const wrap = document.createElement("div");
  wrap.className = "note-block";
  wrap.textContent = text;
  return wrap;
}

function formatNumber(n) {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/* ----------------------------------------------------------------- nav */

const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

function switchView(target) {
  navButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.nav === target));
  views.forEach((v) => (v.hidden = v.dataset.view !== target));
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.nav));
});

document.getElementById("settingsIconBtn").addEventListener("click", () => switchView("settings"));

/* ------------------------------------------------------------- topbar elevation */

const topbar = document.getElementById("topbar");
function updateTopbarShadow() {
  topbar.classList.toggle("is-scrolled", window.scrollY > 4);
}
window.addEventListener("scroll", updateTopbarShadow, { passive: true });
updateTopbarShadow();

/* ------------------------------------------------------------------ toast */

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

/* ------------------------------------------------------------- PWA install */

let deferredPrompt = null;
const installBtn = document.getElementById("installBtnSettings");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
});

/* -------------------------------------------------------------- share */

const shareBtn = document.getElementById("shareBtn");
shareBtn.addEventListener("click", async () => {
  const shareData = {
    title: "QuickPharm — حافظه دوم داروساز",
    text: "محاسبه‌گر دوز اطفال و مرجع داروهای ترکیبی، آفلاین و قابل نصب.",
    url: window.location.href,
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // user cancelled — no-op
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(shareData.url);
    showToast("لینک کپی شد");
  } catch (err) {
    showToast(shareData.url);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* =========================================================================
   COMPOUNDING ("داروهای ساختنی")
   ========================================================================= */

const compoundIndex = COMPOUNDS.map((c) => ({
  compound: c,
  haystack: normalize(
    [c.nameFa, c.nameEn, ...(c.aliases || []), ...(c.indicationsFa || [])].filter(Boolean).join(" | ")
  ),
}));

const cEl = {
  search: document.getElementById("compoundSearch"),
  clearSearch: document.getElementById("clearCompoundSearch"),
  categoryFilter: document.getElementById("categoryFilter"),
  list: document.getElementById("compoundResultsList"),
  emptyHint: document.getElementById("compoundEmptyHint"),
  searchBlock: document.getElementById("compoundSearchBlock"),
  detail: document.getElementById("compoundDetail"),
  back: document.getElementById("backToCompoundList"),
  icon: document.getElementById("compoundIcon"),
  form: document.getElementById("compoundForm"),
  name: document.getElementById("compoundName"),
  nameEn: document.getElementById("compoundNameEn"),
  indicationsList: document.getElementById("indicationsList"),
  ingredientsTable: document.getElementById("ingredientsTable"),
  methodList: document.getElementById("methodList"),
  usageText: document.getElementById("usageText"),
  storageText: document.getElementById("storageText"),
  cautionsFlags: document.getElementById("cautionsFlags"),
  referenceNote: document.getElementById("referenceNote"),
};

const cState = { activeCategory: null };

// category filter chips ("همه" + each category)
(function buildCategoryChips() {
  const allChip = document.createElement("button");
  allChip.type = "button";
  allChip.className = "chip is-active";
  allChip.textContent = "همه";
  allChip.addEventListener("click", () => setCategory(null, allChip));
  cEl.categoryFilter.appendChild(allChip);

  for (const cat of CATEGORIES) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = cat.label;
    chip.addEventListener("click", () => setCategory(cat.id, chip));
    cEl.categoryFilter.appendChild(chip);
  }
})();

function setCategory(catId, chipEl) {
  cState.activeCategory = catId;
  [...cEl.categoryFilter.children].forEach((c) => c.classList.toggle("is-active", c === chipEl));
  renderCompoundList();
}

function searchCompounds(query) {
  const q = normalize(query);
  let pool = compoundIndex;
  if (cState.activeCategory) {
    pool = pool.filter((e) => e.compound.categories.includes(cState.activeCategory));
  }
  if (!q) return pool.map((e) => e.compound);
  return pool.filter((e) => e.haystack.includes(q)).map((e) => e.compound);
}

cEl.search.addEventListener("input", () => {
  cEl.clearSearch.hidden = cEl.search.value.length === 0;
  renderCompoundList();
});

cEl.clearSearch.addEventListener("click", () => {
  cEl.search.value = "";
  cEl.clearSearch.hidden = true;
  renderCompoundList();
  cEl.search.focus();
});

function renderCompoundList() {
  const matches = searchCompounds(cEl.search.value);
  cEl.list.innerHTML = "";
  if (matches.length === 0) {
    cEl.list.hidden = true;
    cEl.emptyHint.hidden = false;
    return;
  }
  cEl.emptyHint.hidden = true;
  cEl.list.hidden = false;
  for (const c of matches) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "result-item";
    const catLabels = c.categories.map((id) => CATEGORIES.find((x) => x.id === id)?.label).filter(Boolean);
    btn.innerHTML = `
      <span class="result-icon">${getFormIcon(c.form)}</span>
      <span class="result-text">
        <span class="r-name">${escapeHtml(c.nameFa)}</span>
        <span class="r-meta">${escapeHtml(c.form)}${catLabels.map((l) => `<span class="category-tag">${escapeHtml(l)}</span>`).join("")}</span>
      </span>
    `;
    btn.addEventListener("click", () => openCompound(c));
    li.appendChild(btn);
    cEl.list.appendChild(li);
  }
}

function openCompound(c) {
  cEl.searchBlock.hidden = true;
  cEl.detail.hidden = false;

  cEl.icon.innerHTML = getFormIcon(c.form);
  cEl.form.textContent = c.form;
  cEl.name.textContent = c.nameFa;
  cEl.nameEn.textContent = c.nameEn || "";

  cEl.indicationsList.innerHTML = (c.indicationsFa || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("");

  cEl.ingredientsTable.innerHTML = (c.ingredients || [])
    .map(
      (ing) => `<tr>
        <td class="ing-name">${escapeHtml(ing.name)}</td>
        <td class="ing-amount">${escapeHtml(ing.amount)}</td>
        <td class="ing-unit">${escapeHtml(ing.unit || "")}</td>
      </tr>`
    )
    .join("");

  cEl.methodList.innerHTML = (c.method || []).map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  cEl.usageText.textContent = c.usage || "—";
  cEl.storageText.textContent = c.storage || "—";

  cEl.cautionsFlags.innerHTML = "";
  for (const caution of c.cautions || []) {
    cEl.cautionsFlags.appendChild(flag("amber", caution));
  }

  cEl.referenceNote.textContent = c.reference ? `مبنای فرمول: ${c.reference}` : "";

  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

cEl.back.addEventListener("click", () => {
  cEl.detail.hidden = true;
  cEl.searchBlock.hidden = false;
});

renderCompoundList();
