import { LEARN_CATEGORIES, SKIN_DISEASES, TREATMENT_DISCLAIMER } from "./learn-data.js";

const TOPICS = { skin: SKIN_DISEASES };
const IMG_BASE = { skin: "images/skin" };

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

const $ = (id) => document.getElementById(id);
const state = { cat: null, disease: null };
let ui;
let gallery = []; // current disease images, for the lightbox
let lbIndex = 0;

function show(level) {
  ui.root.hidden = level !== "root";
  ui.cat.hidden = level !== "cat";
  ui.dz.hidden = level !== "dz";
  window.scrollTo({ top: 0, behavior: "auto" });
}

/* ------------------------------------------------------------------ root */

function renderCategories() {
  ui.cats.innerHTML = "";
  LEARN_CATEGORIES.forEach((c, i) => {
    const count = (TOPICS[c.id] || []).length;
    const li = document.createElement("li");
    li.style.animationDelay = i * 40 + "ms";
    li.innerHTML = `
      <button type="button" class="result-item learn-cat ${c.ready ? "" : "is-soon"}" ${c.ready ? "" : "disabled"}>
        <span class="learn-cat-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
        <span class="learn-cat-text">
          <span class="r-name">${esc(c.title)}</span>
          <span class="r-meta">${esc(c.subtitle)}</span>
        </span>
        <span class="risk-badge ${c.ready ? "risk-safe" : "risk-soon"}">${c.ready ? count + " مبحث" : "به‌زودی"}</span>
      </button>`;
    if (c.ready) li.querySelector("button").addEventListener("click", () => openCategory(c.id));
    ui.cats.appendChild(li);
  });
}

/* -------------------------------------------------------------- category */

function openCategory(id) {
  state.cat = id;
  const c = LEARN_CATEGORIES.find((x) => x.id === id);
  ui.catTitle.textContent = c.title;
  ui.catSub.textContent = c.subtitle;
  ui.search.value = "";
  renderTopics();
  show("cat");
}

function renderTopics() {
  const q = norm(ui.search.value);
  const list = (TOPICS[state.cat] || []).filter(
    (d) => !q || norm([d.nameFa, d.nameEn, ...(d.tags || [])].join(" ")).includes(q)
  );
  ui.topics.innerHTML = "";
  ui.empty.hidden = list.length > 0;
  list.forEach((d, i) => {
    const li = document.createElement("li");
    li.style.animationDelay = Math.min(i, 8) * 25 + "ms";
    li.innerHTML = `
      <button type="button" class="result-item topic-item">
        <span class="topic-num mono">${String(i + 1).padStart(2, "0")}</span>
        <span class="topic-text">
          <span class="r-name">${esc(d.nameFa)}</span>
          <span class="r-meta"><span class="mono">${esc(d.nameEn)}</span></span>
          <span class="topic-tags">${(d.tags || []).map((t) => `<span class="category-tag">${esc(t)}</span>`).join("")}</span>
        </span>
        <svg class="topic-arrow" viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
      </button>`;
    li.querySelector("button").addEventListener("click", () => openDisease(d));
    ui.topics.appendChild(li);
  });
}

/* --------------------------------------------------------------- disease */

function item(x) {
  if (typeof x === "string") return `<li>${esc(x)}</li>`;
  return `<li><strong>${esc(x.t)}</strong> ${esc(x.d)}</li>`;
}

function imageList(d) {
  const base = `${IMG_BASE[state.cat] || "images"}/${d.id}/`;
  return (d.images || []).map((im) => ({ src: base + im.file, caption: im.caption || "", credit: im.credit || "" }));
}

function openDisease(d) {
  state.disease = d;
  ui.dzNameFa.textContent = d.nameFa;
  ui.dzNameEn.textContent = d.nameEn;
  ui.dzTags.innerHTML = (d.tags || []).map((t) => `<span class="category-tag solo">${esc(t)}</span>`).join("");

  const sections = [
    { id: "info", label: "اطلاعات کلی" },
    { id: "etio", label: "اتیولوژی" },
    { id: "img", label: "تصاویر" },
    { id: "tx", label: "درمان" },
  ];
  ui.dzNav.innerHTML = "";
  sections.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (i === 0 ? " is-active" : "");
    b.textContent = s.label;
    b.addEventListener("click", () => {
      [...ui.dzNav.children].forEach((c) => c.classList.toggle("is-active", c === b));
      const t = ui.dzBody.querySelector(`[data-sec="${s.id}"]`);
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    ui.dzNav.appendChild(b);
  });

  gallery = imageList(d);
  const tx = d.treatment;
  const commons = `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(d.commonsQuery || d.nameEn)}&ns6=1`;

  ui.dzBody.innerHTML = `
    <section class="lsec" data-sec="info">
      <h3>اطلاعات کلی</h3>
      <p class="doc-text">${esc(d.summary)}</p>
      <h4>ویژگی‌های بالینی</h4>
      <ul class="doc-list">${d.features.map(item).join("")}</ul>
    </section>

    <section class="lsec" data-sec="etio">
      <h3>اتیولوژی و عوامل خطر</h3>
      <ul class="doc-list">${d.etiology.map(item).join("")}</ul>
    </section>

    <section class="lsec" data-sec="img">
      <h3>تصاویر</h3>
      ${
        gallery.length
          ? `<div class="gallery" id="dzGallery">${gallery
              .map(
                (g, i) => `<button type="button" class="g-tile" data-i="${i}" aria-label="${esc(g.caption || "تصویر " + (i + 1))}">
                  <img src="${esc(g.src)}" alt="${esc(g.caption)}" loading="lazy" />
                </button>`
              )
              .join("")}</div>`
          : `<div class="gallery-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <p>تصاویر این مبحث به‌زودی اضافه می‌شود.</p>
            </div>`
      }
      <a class="settings-link" href="${commons}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
        <span>تصاویر بیشتر در Wikimedia Commons (نیاز به اینترنت)</span>
      </a>
    </section>

    <section class="lsec" data-sec="tx">
      <h3>درمان</h3>
      ${tx.steps
        .map(
          (s, i) => `<div class="tx-step">
            <h4><span class="tx-num mono">${i + 1}</span>${esc(s.title)}</h4>
            <ul class="tx-items">${s.items.map(item).join("")}</ul>
          </div>`
        )
        .join("")}

      <div class="tx-box">
        <h4>نکات مشاوره‌ای داروساز</h4>
        <ul class="doc-list">${tx.pearls.map(item).join("")}</ul>
      </div>

      <div class="flag brick tx-refer">
        <span class="flag-dot"></span>
        <div>
          <strong>چه زمانی ارجاع دهیم؟</strong>
          <ul class="doc-list tight">${tx.refer.map(item).join("")}</ul>
        </div>
      </div>

      <p class="reference-note">${esc(TREATMENT_DISCLAIMER)}</p>
    </section>`;

  ui.dzBody.querySelectorAll(".g-tile").forEach((btn) => {
    const img = btn.querySelector("img");
    img.addEventListener("error", () => btn.remove());
    btn.addEventListener("click", () => openLightbox(Number(btn.dataset.i)));
  });

  show("dz");
}

/* -------------------------------------------------------------- lightbox */

function openLightbox(i) {
  if (!gallery.length) return;
  lbIndex = (i + gallery.length) % gallery.length;
  const g = gallery[lbIndex];
  ui.lbImg.src = g.src;
  ui.lbImg.alt = g.caption;
  ui.lbCaption.innerHTML = `${esc(g.caption)}${g.credit ? `<span class="lb-credit">${esc(g.credit)}</span>` : ""}`;
  ui.lb.hidden = false;
  document.body.classList.add("no-scroll");
}
function closeLightbox() {
  ui.lb.hidden = true;
  ui.lbImg.removeAttribute("src");
  document.body.classList.remove("no-scroll");
}

/* ------------------------------------------------------------------ init */

export function initLearn() {
  ui = {
    root: $("learnRoot"),
    cat: $("learnCategory"),
    dz: $("learnDisease"),
    cats: $("learnCategories"),
    catTitle: $("learnCatTitle"),
    catSub: $("learnCatSub"),
    search: $("learnSearch"),
    topics: $("learnTopics"),
    empty: $("learnEmpty"),
    dzNameFa: $("dzNameFa"),
    dzNameEn: $("dzNameEn"),
    dzTags: $("dzTags"),
    dzNav: $("dzNav"),
    dzBody: $("dzBody"),
    lb: $("lightbox"),
    lbImg: $("lbImg"),
    lbCaption: $("lbCaption"),
  };

  renderCategories();
  show("root");

  $("learnBackToRoot").addEventListener("click", () => show("root"));
  $("learnBackToCat").addEventListener("click", () => show("cat"));
  ui.search.addEventListener("input", renderTopics);

  $("lbClose").addEventListener("click", closeLightbox);
  $("lbPrev").addEventListener("click", () => openLightbox(lbIndex - 1));
  $("lbNext").addEventListener("click", () => openLightbox(lbIndex + 1));
  ui.lb.addEventListener("click", (e) => {
    if (e.target === ui.lb) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (ui.lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(lbIndex + 1);
    if (e.key === "ArrowRight") openLightbox(lbIndex - 1);
  });
}
