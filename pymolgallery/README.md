# PyMOL Art Gallery

A static, GitHub Pages-compatible molecular visualization style gallery built with vanilla HTML, CSS, and JavaScript.

## Run locally

```bash
cd pymol-art-gallery
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Reference PDB structures

The gallery now supports two reference structures:

- **1HVR** — HIV-1 protease / inhibitor example
- **5MO4** — BCR-ABL T315I reference structure

Use the **REFERENCE PDB** selector above the gallery to switch the live previews. The selected structure is used across the hero, featured cards, comparison viewer, gallery cards, and style modal.

For a fully self-contained GitHub Pages deployment, download both structures:

```bash
./scripts/download-pdb.sh
```

This creates:

```text
assets/pdb/1hvr.pdb
assets/pdb/5mo4.pdb
```

The browser prefers these local assets and falls back to RCSB if a local structure is missing.

## Style sources

Several of the added presets are directly inspired by techniques documented in the PyMOL Wiki Gallery, including:

- black-and-white outline rendering
- carved binding-pocket surfaces
- QuteMol-like sphere/lighting treatment
- wide field-of-view perspective
- ray-normal-based transparency
- stylized protein rendering

The copied snippets are PyMOL commands rather than browser-only approximations. Some styles are intentionally starting points and may need selection/view adjustment for a user's structure.

## Molecular previews

- Browser previews use 3Dmol.js; they do not execute PyMOL.
- The site displays an explicit error state if 3Dmol, WebGL, or the selected PDB cannot load.
- Browser preview appearance is illustrative; the copied PyMOL script is the actual recipe to run in PyMOL.

## Deploy to GitHub Pages

Commit the project directory to a repository and enable GitHub Pages for the branch/root folder. Commit the `assets/pdb/*.pdb` files if you want the deployed gallery to work without a live RCSB request.

## Structure sources

Reference structures are retrieved from the RCSB Protein Data Bank using their public PDB download endpoint.
