/* Mutated-residue display for the docking viewer (licorice + "RES NNN" label).
   Add anywhere after the main docking <script> (order no longer matters much):
     <script src="mutations.js"></script>
   Source of truth = data/receptors.json:  "mutations": [{"resi": 272}, {"resi": 334, "chain": "A"}]
   If a receptor has no such field, FALLBACK below is matched against its key + display name.
   Open the browser console: every step logs a line starting with [mutations]. */
(() => {
  const FALLBACK = [
    [/6HD4/i, [{ resi: 272 }]],
    [/5MO4.*Y253H|Y253H.*5MO4/i, [{ resi: 334 }, { resi: 272 }]]
  ];
  const COLOR = 'magentaCarbon', RADIUS = 0.22, log = (...a) => console.info('[mutations]', ...a);
  let labels = [];
  const clear = () => { labels.forEach(l => { try { viewer.removeLabel(l); } catch (e) {} }); labels = []; };

  function apply(key) {
    clear();
    const info = data[key] || {};
    const hit = FALLBACK.find(([re]) => re.test(key + ' ' + (info.name || '')));
    const list = info.mutations || (hit && hit[1]);
    if (!list) return log(`no mutations configured for "${key}" (name: "${info.name}"). Add "mutations" to its receptors.json entry.`);
    if (!receptorModel) return log('receptorModel not ready');
    list.forEach(m => {
      const sel = { resi: m.resi }; if (m.chain) sel.chain = m.chain;
      let atoms = receptorModel.selectedAtoms(sel).filter(a => a.resn !== 'HOH' && a.resn !== 'WAT');
      const prot = atoms.filter(a => !a.hetflag); if (prot.length) atoms = prot;
      if (!atoms.length) return log(`residue ${m.resi} NOT FOUND in ${key} - check PDB numbering/chain`);
      receptorModel.setStyle(sel, { stick: { radius: RADIUS, colorscheme: COLOR } }, true);   // 3rd arg true = add, keeps the cartoon
      const n = atoms.length, c = atoms.reduce((s, a) => ({ x: s.x + a.x, y: s.y + a.y, z: s.z + a.z }), { x: 0, y: 0, z: 0 });
      const text = `${m.resn || atoms[0].resn} ${m.resi}`;
      labels.push(viewer.addLabel(text, { position: { x: c.x / n, y: c.y / n, z: c.z / n }, fontSize: 13, fontColor: 'white',
        backgroundColor: 'rgba(160,30,120,0.85)', backgroundOpacity: 0.9, borderColor: 'white', borderThickness: 1 }));
      log(`drawn ${text} (${n} atoms) in ${key}`);
    });
    viewer.render();
  }

  function install() {
    if (typeof loadReceptor !== 'function') return log('loadReceptor not found - is this script on the same page as the docking script?');
    const orig = loadReceptor;
    loadReceptor = async function (key) { clear(); await orig(key); try { apply(key); } catch (e) { console.error('[mutations]', e); } };
    log('installed. receptor keys:', Object.keys(data));
  }
  document.readyState === 'complete' ? install() : window.addEventListener('load', install);
})();