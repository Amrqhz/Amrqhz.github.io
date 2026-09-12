# Thesis Defense Deck — Praziquantel & BCR-ABL

## How to run
Open `index.html` in a browser (Chrome/Edge recommended). Because the 3D
viewer fetches local PDB files with `fetch()`, most browsers block that over
`file://`. Easiest fix — serve the folder locally:

```bash
cd deck
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`.

## Required files (drop them in, then reload)

```
deck/
├── index.html
├── receptors/
│   ├── 5MO4.pdb
│   ├── 6HD4.pdb
│   ├── Y253H_5MO4.pdb        (your modelled double mutant)
│   └── Y253H_6HD4.pdb        (your modelled single mutant)
└── ligands/                  (optional — see below)
```

If a receptor file is missing, that slide shows a clear "file not found"
message instead of failing silently.

### Ligand 2D structures (optional)
The ligand-library slide currently draws small decorative glyphs instead of
real 2D structures (to avoid guessing wrong PubChem CIDs / reproducing
copyrighted structure images). If you want real 2D drawings, drop PNGs named
after each compound's `id` (see `LIGANDS` array in `index.html`, e.g.
`ligands/PZQ.png`, `ligands/MEB.png`...) and I can wire the `<img>` tags in
one follow-up — or just tell me and I'll do it now.

## What's wired to real thesis data
- Table 3-1 (ligand library), Table 3-5 (grid box centres), Table 3-6 (full
  8-site docking matrix), Table 3-1/3-4 (validation RMSD), Table 4-1/4-2
  (selection criteria + the mutant-vs-wild-type comparison), Table 3-7
  (ADMET) are all real numbers taken directly from your PDF.
- The 3D viewer classifies each HETATM group as "allosteric" or "catalytic"
  automatically, using the real grid-box XYZ coordinates from Table 3-5 —
  so it works correctly regardless of the ligand's PDB residue code.
- The Y253H mutation highlight targets residue 272 (the PDB numbering you
  gave for position 253) in both `Y253H_6HD4.pdb` and `Y253H_5MO4.pdb`.

## What's still placeholder (clearly flagged in the deck itself)
Chapter 3 §3.5 (MD) and §3.6 (DFT) were empty headers in your draft PDF —
the RMSD/RMSF/Rg curves, MM/GBSA value, and HOMO/LUMO/μ/η/S/ω numbers are
illustrative placeholders, each with a visible "illustrative — pending
final data" tag. Send me the real numbers (or the raw `.xvg`/Gaussian
output) whenever they're ready and I'll drop them straight into the same
charts.

## Navigation
- Arrow keys, swipe (touch), mouse wheel, on-screen arrows, or the dot
  strip bottom-right.
- `F` toggles fullscreen (best for actual presentation).
- Language toggle (top corner) switches the whole deck between English and
  Persian (Vazirmatn), including RTL layout — pick it once on the title
  slide, it stays applied everywhere.
