/* Thesis showcase add-on: MD + PLIP residue map + DFT + footer + title background.
   Usage: <script src="showcase.js"></script> just before </body>. Title section HTML is untouched. */
(async () => {
const $ = (s, r = document) => r.querySelector(s);
const jget = u => fetch(u).then(r => r.ok ? r.json() : null).catch(() => null);
const N = { pzq: 'Praziquantel', asc: 'Asciminib' };
const C = { pzq: ['#1f1f1f', '#8c8c8c', '#585858', '#b8b8b8'], asc: ['#d9480f', '#f59f64', '#a63a0c', '#fbc99e'] };
const [Dp, Da, Ra, DF] = await Promise.all(['md_praziquantel', 'md_asciminib', 'plip_asciminib', 'dft_praziquantel'].map(n => jget(`data/${n}.json`)));
const D = { pzq: Dp, asc: Da };
// PLIP per-residue energies (kcal/mol), praziquantel
const R = { pzq: [['LEU363', -0.43], ['ALA363', -0.99], ['LEU448', -1.17], ['ILE451', -0.17], ['VAL487', -3.25], ['PHE512', -0.21], ['ILE521', 0.08]], asc: Ra };
[Dp, Da].forEach(d => d && (d.x = d.rmsd.map((_, i) => i * d.dt)));
// Asciminib control as static plot images (used until data/md_asciminib.json exists); order matches CH below
const IMG = ['protein_backbone_rmsd', 'per_residue_rmsf', 'protein_backbone_Rg', ['hbnum_intermolecular', 'hbnum_intramolecular'], 'protein_sasa', 'binding_free_energy'];
const imgOK = await new Promise(r => { const i = new Image(); i.onload = () => r(1); i.onerror = () => r(0); i.src = 'data/asciminib/protein_backbone_rmsd.jpeg'; });
const pzqOK = await new Promise(r => { const i = new Image(); i.onload = () => r(1); i.onerror = () => r(0); i.src = 'data/praziquantel/protein_backbone_rmsd.jpeg'; });
const ascAv = !!(Da || imgOK);

/* ---------- CSS ---------- */
const st = document.createElement('style');
st.textContent = `
#title{position:relative;isolation:isolate}
#title::before,#title::after{content:"";position:absolute;z-index:-1;pointer-events:none;left:50%;width:100vw;transform:translateX(-50%);top:-40px;bottom:-30px}
#title::before{background-image:radial-gradient(circle,rgba(40,40,40,.4) 1.4px,transparent 1.9px);background-size:20px 20px;filter:blur(.7px);
-webkit-mask-image:radial-gradient(ellipse 62% 72% at 50% 45%,#000 15%,transparent 76%);mask-image:radial-gradient(ellipse 62% 72% at 50% 45%,#000 15%,transparent 76%);animation:dotdrift 45s linear infinite}
#title::after{background:radial-gradient(420px 300px at 22% 32%,rgba(110,140,255,.2),transparent 70%),radial-gradient(380px 280px at 78% 62%,rgba(255,165,115,.18),transparent 70%);filter:blur(42px)}
[data-theme=dark] #title::before{background-image:radial-gradient(circle,rgba(255,255,255,.32) 1.4px,transparent 1.9px)}
@keyframes dotdrift{to{background-position:20px 20px}}
@media(prefers-reduced-motion:reduce){#title::before{animation:none}}
.mdx-bar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1rem}
.mdx-tabs{display:flex;gap:.5rem;flex-wrap:wrap}
.mdx-tabs button,.mdx-mini button{background:var(--bg-secondary);color:var(--text-primary);border:1.5px solid var(--border-color);padding:.5rem 1rem;border-radius:999px;font-size:13px;font-weight:600}
.mdx-tabs button:hover,.mdx-mini button:hover{transform:none;box-shadow:none;background:var(--accent)}
.mdx-tabs button.on,.mdx-mini button.on{background:#383838;color:#fff}
.mdx-tabs button:disabled{opacity:.45;cursor:not-allowed}
.mdx-sm{font-size:.85rem;color:var(--text-secondary);display:flex;gap:.6rem;align-items:center}
.mdx-meta{display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.2rem}
.mdx-meta span{font-size:.78rem;padding:.25rem .7rem;border-radius:999px;background:var(--bg-secondary);color:var(--text-secondary);border:1px dashed var(--border-color)}
.mdx-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.8rem;margin-bottom:1.5rem}
.mdx-sum div{background:var(--bg-secondary);border-radius:10px;padding:.8rem 1rem;border:1px solid rgba(128,128,128,.25)}
.mdx-sum small{display:block;color:var(--text-secondary);font-size:.72rem;margin-bottom:.2rem}
.mdx-sum b{font-size:1.05rem;font-variant-numeric:tabular-nums;display:block}
.mdx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:1.2rem}
.mdx-card{background:var(--bg-card);border:1px solid rgba(128,128,128,.3);border-radius:12px;padding:1rem}
.mdx-card h3{font-size:1rem;display:flex;justify-content:space-between;align-items:center;gap:.5rem;margin-bottom:.5rem;font-family:"DM Serif Text",serif;font-weight:400}
.mdx-mini{display:flex;gap:.3rem}.mdx-mini button{padding:.2rem .6rem;font-size:11px}
.mdx-card canvas{width:100%;height:260px;display:block;cursor:crosshair}
.mdx-st{display:flex;flex-wrap:wrap;gap:.3rem 1rem;font-size:.74rem;color:var(--text-secondary);margin-top:.5rem;font-variant-numeric:tabular-nums}
.mdx-st i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:.3rem}
.mdx-card img{width:100%;border-radius:8px;display:block}.mdx-cap{font-size:.74rem;color:var(--text-secondary);margin:.7rem 0 .3rem}
.mdx-grid.one{grid-template-columns:1fr}
.cv-sbs{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}.cv-sbs figure{margin:0}.cv-sbs figcaption{font-size:.78rem;color:var(--text-secondary);margin-bottom:.3rem}
.cv-sw{position:relative;line-height:0;overflow:hidden;border-radius:8px}.cv-sw img.t{position:absolute;inset:0;height:100%}
.cv-sw i{position:absolute;top:0;bottom:0;width:2px;background:#d9480f;transform:translateX(-1px);pointer-events:none}
.cv-rng{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}
.mdx-hint{font-size:.72rem;color:var(--text-secondary);margin-top:.4rem;text-align:right}
.mdx-h{font-family:"DM Serif Text",serif;font-weight:400;font-size:1.4rem;margin:2.5rem 0 1rem;text-align:center}
.mdx-int{display:grid;grid-template-columns:minmax(300px,1.1fr) minmax(280px,1fr);gap:1.5rem;align-items:start}
@media(max-width:820px){.mdx-int,.mdx-grid{grid-template-columns:1fr}}
.mdx-svg{width:100%;background:var(--bg-secondary);border-radius:12px;border:1px solid rgba(128,128,128,.3)}
.mdx-svg g.n{cursor:pointer;transition:opacity .2s}.mdx-svg.act g.n:not(.on){opacity:.3}
.mdx-svg g.n.on circle{stroke:#d9480f;stroke-width:3}
.mdx-svg text{font-family:inherit;pointer-events:none}
.mdx-row{display:grid;grid-template-columns:62px 1fr 64px;gap:.6rem;align-items:center;padding:.4rem .5rem;border-radius:8px;cursor:pointer;font-size:.85rem}
.mdx-row.on{background:var(--bg-secondary)}.mdx-row b{font-variant-numeric:tabular-nums;text-align:right}
.mdx-bw{height:10px;background:rgba(128,128,128,.15);border-radius:5px;position:relative}.mdx-bw i{position:absolute;top:0;bottom:0;border-radius:5px}
.mdx-det{margin-top:1rem;padding:1rem;border-radius:10px;background:var(--bg-secondary);border-left:4px solid #383838;font-size:.88rem;line-height:1.6;min-height:112px}
.mdx-det h4{font-family:"DM Serif Text",serif;font-weight:400;font-size:1.15rem}
.mdx-pend{padding:2rem;text-align:center;color:var(--text-secondary);border:1px dashed var(--border-color);border-radius:12px}
.dft-ph{height:220px;border:1px dashed var(--border-color);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--text-secondary);font-size:.9rem;text-align:center;padding:1rem}
.site-ft{margin-top:5rem;padding:3rem 1rem 1.5rem;border-top:1px dashed var(--border-color);text-align:center;color:var(--text-secondary);font-size:.88rem;line-height:1.7}
.site-ft .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2rem;max-width:900px;margin:0 auto 2rem;text-align:left}
.site-ft h5{color:var(--text-primary);font-family:"DM Serif Text",serif;font-weight:400;font-size:1.05rem;margin-bottom:.4rem}
.site-ft a{color:var(--text-primary);text-underline-offset:3px}.site-ft .t{font-family:"DM Serif Text",serif;font-style:italic;font-size:1.4rem;color:var(--text-primary);margin-bottom:.5rem}`;
document.head.appendChild(st);

/* ---------- helpers ---------- */
const mean = a => a.reduce((s, v) => s + v, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(v => (v - m) ** 2))); };
const tail = a => a.slice(-200);
const fx = v => Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : Math.abs(v) >= 1 ? v.toFixed(2) : v.toFixed(3);
const sm = (a, w) => { if (w < 2) return a; const p = [0]; a.forEach((v, i) => p.push(p[i] + v)); const h = w >> 1; return a.map((_, i) => { const l = Math.max(0, i - h), r = Math.min(a.length, i + h + 1); return (p[r] - p[l]) / (r - l); }); };
const nt = (a, b, n = 5) => { const s = (b - a) / n, p = 10 ** Math.floor(Math.log10(s)), f = s / p, k = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p, o = []; for (let v = Math.ceil(a / k) * k; v <= b + 1e-9; v += k) o.push(+v.toPrecision(6)); return o; };

/* ---------- canvas chart: hover tooltip, drag to zoom, double-click reset ---------- */
function Chart(cv, cfg) {
  const ctx = cv.getContext('2d'), M = { l: 54, r: 12, t: 10, b: 34 };
  let S = [], dom = null, hv = null, dr = null, V = {};
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '#888';
  const xOf = e => e.clientX - cv.getBoundingClientRect().left;
  const dx = px => V.x0 + (px - M.l) / (cv.clientWidth - M.l - M.r) * (V.x1 - V.x0);
  function draw() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = devicePixelRatio || 1;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!S.length) return;
    let x0 = Math.min(...S.map(s => s.x[0])), x1 = Math.max(...S.map(s => s.x[s.x.length - 1]));
    if (dom) [x0, x1] = dom;
    let y0 = 1e9, y1 = -1e9;
    S.forEach(s => s.x.forEach((x, i) => { if (x >= x0 && x <= x1) { y0 = Math.min(y0, s.y[i]); y1 = Math.max(y1, s.y[i]); } }));
    const pd = (y1 - y0) * .07 || 1; y0 -= pd; y1 += pd; V = { x0, x1, y0, y1 };
    const px = v => M.l + (v - x0) / (x1 - x0) * (W - M.l - M.r), py = v => H - M.b - (v - y0) / (y1 - y0) * (H - M.t - M.b);
    ctx.font = '11px system-ui'; ctx.fillStyle = css('--text-secondary'); ctx.strokeStyle = 'rgba(128,128,128,.2)'; ctx.lineWidth = 1;
    nt(y0, y1).forEach(v => { ctx.beginPath(); ctx.moveTo(M.l, py(v)); ctx.lineTo(W - M.r, py(v)); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fx(v), M.l - 6, py(v) + 4); });
    nt(x0, x1, 6).forEach(v => { ctx.textAlign = 'center'; ctx.fillText(v, px(v), H - M.b + 15); });
    ctx.fillText(cfg.xl, (M.l + W - M.r) / 2, H - 4);
    ctx.save(); ctx.translate(12, (M.t + H - M.b) / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(cfg.yl, 0, 0); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(M.l, M.t, W - M.l - M.r, H - M.t - M.b); ctx.clip();
    S.forEach(s => { ctx.beginPath(); ctx.strokeStyle = s.c; ctx.lineWidth = 1.4; s.x.forEach((x, i) => i ? ctx.lineTo(px(x), py(s.y[i])) : ctx.moveTo(px(x), py(s.y[i]))); ctx.stroke(); });
    ctx.restore();
    if (dr) { ctx.fillStyle = 'rgba(120,120,120,.18)'; ctx.fillRect(Math.min(dr.a, dr.b), M.t, Math.abs(dr.b - dr.a), H - M.t - M.b); }
    else if (hv != null && hv >= M.l && hv <= W - M.r) {
      const xv = dx(hv); ctx.strokeStyle = 'rgba(128,128,128,.6)'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(hv, M.t); ctx.lineTo(hv, H - M.b); ctx.stroke(); ctx.setLineDash([]);
      const rows = S.map(s => { let i = 0, lo = 0, hi = s.x.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; s.x[m] < xv ? lo = m + 1 : hi = m; } i = lo; return [s, i]; });
      const w = 150, bh = 18 + rows.length * 15, bx = hv > W / 2 ? hv - w - 10 : hv + 10;
      ctx.fillStyle = 'rgba(30,30,30,.92)'; ctx.beginPath(); ctx.roundRect(bx, M.t + 4, w, bh, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(cfg.xl.split(' ')[0] + ' ' + fx(rows[0][0].x[rows[0][1]]), bx + 8, M.t + 18);
      rows.forEach(([s, i], k) => { ctx.fillStyle = s.c === '#1f1f1f' ? '#ddd' : s.c; ctx.fillRect(bx + 8, M.t + 26 + k * 15, 7, 7); ctx.fillStyle = '#fff'; ctx.fillText(`${s.n}: ${fx(s.y[i])}`, bx + 20, M.t + 33 + k * 15); ctx.beginPath(); ctx.fillStyle = s.c; ctx.arc(px(s.x[i]), py(s.y[i]), 3.5, 0, 7); ctx.fill(); });
    }
  }
  cv.onmousemove = e => { hv = xOf(e); if (dr) dr.b = hv; draw(); };
  cv.onmouseleave = () => { hv = null; dr = null; draw(); };
  cv.onmousedown = e => dr = { a: xOf(e), b: xOf(e) };
  cv.onmouseup = () => { if (dr && Math.abs(dr.b - dr.a) > 8) { const a = dx(dr.a), b = dx(dr.b); dom = [Math.min(a, b), Math.max(a, b)]; } dr = null; draw(); };
  cv.ondblclick = () => { dom = null; draw(); };
  new ResizeObserver(draw).observe(cv);
  return { set(s) { S = s; draw(); } };
}

/* ---------- MD section ---------- */
const CH = [
  { t: 'RMSD · backbone & ligand', xl: 'Time (ns)', yl: 'RMSD (nm)', s: d => [['Backbone', d.rmsd], ['Ligand', d.lig]] },
  { t: 'RMSF · per residue', xl: 'Residue', yl: 'RMSF (nm)', rmsf: 1, s: d => [['RMSF', d.rmsf.y]] },
  { t: 'Radius of gyration', xl: 'Time (ns)', yl: 'Rg (nm)', s: d => [['Rg', d.rg[0]], ['Rg X', d.rg[1]], ['Rg Y', d.rg[2]], ['Rg Z', d.rg[3]]] },
  { t: 'Hydrogen bonds', xl: 'Time (ns)', yl: 'H-bonds', modes: [['Protein–ligand', d => [['P–L', d.hbInter]]], ['Intra-protein', d => [['Intra', d.hbIntra]]]] },
  { t: 'SASA', xl: 'Time (ns)', yl: 'Area (nm²)', s: d => [['SASA', d.sasa]] },
  { t: 'Binding free energy · LIE', xl: 'Time (ns)', yl: 'ΔG bind (kJ/mol)', s: d => [['ΔG', d.lie]] }
];
let mode = ascAv ? 'cmp' : 'pzq', W = 1, cs = 'sw', sw = 50;
const cmpView = f => { const P = `data/praziquantel/${f}.jpeg`, A = `data/asciminib/${f}.jpeg`;
  return cs === 'sbs' ? `<div class="cv-sbs"><figure><figcaption>Praziquantel</figcaption><img src="${P}"></figure><figure><figcaption>Asciminib</figcaption><img src="${A}"></figure></div>`
  : cs === 'sw' ? `<div class="cv-sw"><img src="${A}" style="width:100%"><img class="t" src="${P}" style="clip-path:inset(0 ${100 - sw}% 0 0)"><i style="left:${sw}%"></i><input class="cv-rng" type="range" min="0" max="100" value="${sw}"></div><div class="mdx-cap" style="display:flex;justify-content:space-between"><span>◀ Praziquantel</span><span>Asciminib ▶</span></div>`
  : ''; };
const keys = () => mode === 'cmp' ? (Da ? ['pzq', 'asc'] : ['pzq']) : mode === 'asc' && !Da ? [] : [mode];
const card = $('#md .section-card');
if (!Dp) card.insertAdjacentHTML('beforeend', '<p class="mdx-pend">data/md_praziquantel.json not found.</p>');
else {
  card.innerHTML = `<h2 class="section-title">MD RESULT</h2>
  <div class="mdx-bar"><div class="mdx-tabs" id="tabs"></div><label class="mdx-sm">Smoothing <input type="range" id="sm" min="1" max="100" value="1"><span id="smv">off</span></label></div>
  <div class="mdx-bar" id="cbar" style="display:none"><div class="mdx-tabs" id="cs"><button data-k="sbs">Side by side</button><button data-k="sw">Swipe</button></div><span class="mdx-hint" id="cnote"></span></div>
  <div class="mdx-meta"><span>100 ns production run</span><span>10,001 frames · 10 ps</span><span>Test ligand: Praziquantel</span><span>Positive control: Asciminib</span></div>
  <div class="mdx-sum" id="sum"></div><div class="mdx-grid" id="grid"></div>
  <p class="mdx-hint">Hover for values · drag to zoom · double-click to reset</p>
  <h3 class="mdx-h">Binding-site residue contributions</h3><div id="int"></div>`;
  const tabs = [['cmp', 'Compare'], ['pzq', 'Praziquantel'], ['asc', 'Asciminib · control']];
  $('#tabs').innerHTML = tabs.map(([k, n]) => `<button data-k="${k}" ${k !== 'pzq' && !ascAv ? 'disabled title="Data pending"' : ''}>${n}${k !== 'pzq' && !ascAv ? ' · pending' : ''}</button>`).join('');
  const cards = CH.map(def => {
    const el = document.createElement('div'); el.className = 'mdx-card';
    el.innerHTML = `<h3>${def.t}${def.modes ? `<span class="mdx-mini">${def.modes.map((m, i) => `<button data-i="${i}">${m[0]}</button>`).join('')}</span>` : ''}</h3><canvas></canvas><div class="mdx-st"></div><div class="mdx-im"></div>`;
    $('#grid').appendChild(el);
    const c = { def, el, m: 0, i: CH.indexOf(def), im: $('.mdx-im', el), ch: Chart($('canvas', el), def), st: $('.mdx-st', el) };
    el.querySelectorAll('.mdx-mini button').forEach(b => b.onclick = () => { c.m = +b.dataset.i; upd(); });
    return c;
  });
  function upd() {
    const cmpImg = mode === 'cmp' && !Da && imgOK && pzqOK;
    $('#cbar').style.display = cmpImg ? '' : 'none'; $('#grid').classList.toggle('one', !!cmpImg);
    document.querySelectorAll('#cs button').forEach(b => b.classList.toggle('on', b.dataset.k === cs));
    $('#cnote').textContent = cs === 'sbs' ? '' : 'Axis ranges differ between the two plots — read the tick labels on each side.';
    $('#smv').textContent = W < 2 ? 'off' : (W * D.pzq.dt).toFixed(1) + ' ns';
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.k === mode));
    cards.forEach(c => {
      c.el.querySelectorAll('.mdx-mini button').forEach((b, i) => b.classList.toggle('on', i === c.m));
      const f = c.def.modes ? c.def.modes[c.m][1] : c.def.s, S = [];
      keys().forEach(k => { const d = D[k]; f(d).forEach(([n, y], i) => S.push({ n: (keys().length > 1 ? N[k].slice(0, 3) + ' · ' : '') + n, x: c.def.rmsf ? d.rmsf.res : d.x, y: c.def.rmsf ? y : sm(y, W), r: y, c: C[k][i % 4] })); });
      c.ch.set(S);
      c.st.innerHTML = S.map(s => `<span><i style="background:${s.c}"></i>${s.n} <b>${fx(mean(s.r))} ± ${fx(sd(s.r))}</b>${c.def.rmsf ? ` · peak ${fx(Math.max(...s.r))} @ ${s.x[s.r.indexOf(Math.max(...s.r))]}` : ` · last 20 ns ${fx(mean(tail(s.r)))}`}</span>`).join('');
      const ni = !Da && imgOK && mode !== 'pzq', f2 = IMG[c.i];
      $('canvas', c.el).style.display = c.st.style.display = keys().length && !cmpImg ? '' : 'none';
      c.im.innerHTML = cmpImg ? cmpView(Array.isArray(f2) ? f2[c.m] : f2) : ni ? `<div class="mdx-cap">Asciminib (static plot image)</div><img src="data/asciminib/${Array.isArray(f2) ? f2[c.m] : f2}.jpeg" alt="Asciminib ${c.def.t}">` : '';
    });
    const tiles = [['Backbone RMSD · last 20 ns', d => fx(mean(tail(d.rmsd))) + ' nm'], ['Ligand RMSD · mean', d => fx(mean(d.lig)) + ' nm'], ['Rg · mean', d => fx(mean(d.rg[0])) + ' nm'],
      ['SASA · mean', d => fx(mean(d.sasa)) + ' nm²'], ['ΔG LIE · mean', d => fx(mean(d.lie)) + ' kJ/mol'], ['Protein–ligand H-bond occupancy', d => d.occ + ' %']];
    $('#sum').innerHTML = !keys().length ? '<div><small>Asciminib</small><b>Plots only</b></div>' : tiles.map(([l, f]) => `<div><small>${l}</small>${keys().map(k => `<b style="color:${C[k][0]}">${f(D[k])}</b>`).join('')}</div>`).join('');
  }
  $('#tabs').onclick = e => { const b = e.target.closest('button'); if (b && !b.disabled) { mode = b.dataset.k; upd(); } };
  $('#cs').onclick = e => { const b = e.target.closest('button'); if (b) { cs = b.dataset.k; upd(); } };
  $('#grid').oninput = e => { if (!e.target.classList.contains('cv-rng')) return; sw = +e.target.value; document.querySelectorAll('.cv-sw').forEach(w => { w.querySelector('.t').style.clipPath = `inset(0 ${100 - sw}% 0 0)`; w.querySelector('i').style.left = sw + '%'; w.querySelector('input').value = sw; }); };
  $('#sm').oninput = e => { W = +e.target.value; upd(); };
  upd();

  /* ---------- interactive residue map (PLIP export) ---------- */
  const nm = r => r[0] + r.slice(1, 3).toLowerCase() + r.slice(3);
  let rk = 'pzq', pin = null;
  function renderInt() {
    const box = $('#int'), rs = R[rk] && [...R[rk]].sort((a, b) => a[1] - b[1]);
    const sw = `<div class="mdx-tabs" style="justify-content:center;margin-bottom:1rem">${['pzq', 'asc'].map(k => `<button data-k="${k}" class="${k === rk ? 'on' : ''}" ${!R[k] ? 'disabled' : ''}>${N[k]}${!R[k] ? ' · pending' : ''}</button>`).join('')}</div>`;
    if (!rs) { box.innerHTML = sw; return; }
    const mx = Math.max(...rs.map(r => Math.abs(r[1]))), tot = rs.reduce((s, r) => s + r[1], 0), fav = rs.filter(r => r[1] < 0).reduce((s, r) => s + r[1], 0);
    const cx = 250, cy = 230, RR = 165, n = rs.length;
    const P = rs.map((r, i) => { const a = (-90 + i * 360 / n) * Math.PI / 180, t = Math.sqrt(Math.abs(r[1]) / mx), g = Math.round(228 - 195 * t); return { r, x: cx + RR * Math.cos(a), y: cy + RR * Math.sin(a), rad: 17 + 9 * t, t, fill: r[1] > 0 ? '#f1b5ab' : `rgb(${g},${g},${g})`, tx: r[1] > 0 || t < .5 ? '#222' : '#fff' }; });
    box.innerHTML = sw + `<div class="mdx-int"><div>
      <svg class="mdx-svg" viewBox="0 0 500 460" id="svg">${P.map(p => `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${p.r[1] > 0 ? '#c0392b' : '#383838'}" stroke-width="${1 + 2.2 * p.t}" stroke-dasharray="2 6" stroke-linecap="round"/>`).join('')}
      ${P.map((p, i) => `<g class="n" data-i="${i}"><circle cx="${p.x}" cy="${p.y}" r="${p.rad}" fill="${p.fill}" stroke="#383838" stroke-width="1"/><text x="${p.x}" y="${p.y - 1}" text-anchor="middle" font-size="9" font-weight="700" fill="${p.tx}">${p.r[0].slice(0, 3)}</text><text x="${p.x}" y="${p.y + 10}" text-anchor="middle" font-size="9" fill="${p.tx}">${p.r[0].slice(3)}</text></g>`).join('')}
      <circle cx="${cx}" cy="${cy}" r="42" fill="#f2b179" stroke="#b9772f" stroke-width="2"/><text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="15" font-weight="700" fill="#4a2a07">${N[rk].slice(0, 3).toUpperCase()}</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="#4a2a07">Σ ${tot.toFixed(2)}</text></svg>
      ${rk === 'pzq' ? `<p class="mdx-hint"><a href="#" id="plipimg">Show original PLIP 2D image</a> · dotted lines = hydrophobic contacts, thickness ∝ |ΔE|, red = unfavourable</p>` : ''}</div>
      <div><div id="rows">${rs.map((r, i) => `<div class="mdx-row" data-i="${i}"><span>${nm(r[0])}</span><div class="mdx-bw"><i style="${r[1] < 0 ? 'right:50%' : 'left:50%'};width:${Math.abs(r[1]) / mx * 50}%;background:${r[1] < 0 ? '#383838' : '#c0392b'}"></i></div><b>${r[1] > 0 ? '+' : ''}${r[1].toFixed(2)}</b></div>`).join('')}</div>
      <div class="mdx-det" id="det"></div></div></div>`;
    const det = (i) => { const el = $('#det'); if (i == null) { el.innerHTML = `<h4>Hover or click a residue</h4>Net sum of listed residues <b>${tot.toFixed(2)} kcal/mol</b> (${(tot * 4.184).toFixed(1)} kJ/mol) across ${n} residues; ${rs.filter(r => r[1] < 0).length} favourable, ${rs.filter(r => r[1] > 0).length} unfavourable.`; return; }
      const [r, e] = rs[i]; el.innerHTML = `<h4>${nm(r)}</h4><b>${e > 0 ? '+' : ''}${e.toFixed(2)} kcal/mol</b> (${(e * 4.184).toFixed(1)} kJ/mol)<br>Rank ${i + 1} of ${n} · hydrophobic contact (PLIP)${e < 0 ? `<br>${(e / fav * 100).toFixed(0)}% of the total favourable contribution${e <= -1 ? ' · <b>hot spot</b>' : ''}` : '<br>Slightly unfavourable contribution'}`; };
    const act = i => { $('#svg').classList.toggle('act', i != null); box.querySelectorAll('g.n,.mdx-row').forEach(el => el.classList.toggle('on', +el.dataset.i === i)); det(i); };
    box.querySelectorAll('g.n,.mdx-row').forEach(el => { const i = +el.dataset.i; el.onmouseenter = () => act(i); el.onmouseleave = () => act(pin); el.onclick = () => { pin = pin === i ? null : i; act(pin); }; });
    act(pin);
    const im = $('#plipimg'); if (im) im.onclick = e => { e.preventDefault(); const s = $('#svg'); s.outerHTML = `<img id="svg" class="mdx-svg" src="data/COMPLEX_INTERACTIONS.png" alt="PLIP interactions">`; im.remove(); };
  }
  $('#int').onclick = e => { const b = e.target.closest('.mdx-tabs button'); if (b && !b.disabled) { rk = b.dataset.k; pin = null; renderInt(); } };
  renderInt();
}

/* ---------- DFT section ---------- */
{
  const { homo: h, lumo: l, dipole: dp } = DF || {}, ok = h != null && l != null;
  const IP = ok ? -h : null, EA = ok ? -l : null, chi = ok ? (IP + EA) / 2 : null, eta = ok ? (IP - EA) / 2 : null;
  const f = (v, u, p = 3) => v == null ? '—' : v.toFixed(p) + ' ' + u;
  const rows = [['HOMO Energy', f(h, 'eV')], ['LUMO Energy', f(l, 'eV')], ['Energy Gap (ΔE)', f(ok ? l - h : null, 'eV')], ['Dipole Moment', f(dp, 'Debye')], ['Ionization Potential (IP)', f(IP, 'eV')], ['Electron Affinity (EA)', f(EA, 'eV')], ['Electronegativity (χ)', f(chi, 'eV')], ['Chemical Hardness (η)', f(eta, 'eV')], ['Chemical Softness (S)', f(ok ? 1 / (2 * eta) : null, 'eV⁻¹')]];
  $('#dft .section-card').innerHTML = `<h2 class="section-title">DFT ANALYSIS</h2><div class="dft-grid"><div class="dft-card"><h3 class="chart-title">Molecular Properties</h3><ul class="property-list">${rows.map(r => `<li><span>${r[0]}</span><span>${r[1]}</span></li>`).join('')}</ul></div>
  <div class="dft-card"><h3 class="chart-title">Molecular Orbital Visualization</h3><div class="dft-ph">HOMO / LUMO visualization will be displayed here</div><h3 class="chart-title" style="margin-top:1.5rem">Electrostatic Potential Map</h3><div class="dft-ph">MEP map will be displayed here</div></div></div>`;
}

/* ---------- footer ---------- */
const bl = $('.bottom-logo'), ft = document.createElement('footer'); ft.className = 'site-ft';
ft.innerHTML = `<div class="g"><div><h5>Amir Hossein Gholizadeh</h5>PharmD student &amp; researcher<br>School of Pharmacy, Ardabil University of Medical Sciences<br>Computational biology · drug discovery · medicinal chemistry</div>
<div><h5>Thesis</h5>Repurposing anthelmintic drugs as inhibitors of mutant BCR-ABL kinase in CML<br>Supervisor: Dr. Nima Razzaghi-Asl</div>
<div><h5>Find me</h5><a href="https://github.com/amrqhz" target="_blank" rel="noopener">github.com/amrqhz</a><br><a href="https://amrqhz.github.io" target="_blank" rel="noopener">amrqhz.github.io</a></div></div>
<div class="t">trust the process</div>© 2026 Amir Hossein Gholizadeh`;
bl ? bl.replaceWith(ft) : document.querySelector('.container').appendChild(ft);
})();