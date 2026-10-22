---
title: Why I started looking at anthelmintics for CML
category: Computational Chemistry
tags: [drug-repurposing, docking, bcr-abl, cml]
date: 2026-10-22
description: A short note on how docking, MD and DFT fit together in my thesis work.
---

## The idea

Drug repurposing starts from a simple question: *can a drug approved for one disease help with another?* For my thesis I asked it about **anthelmintic drugs** and chronic myeloid leukemia (CML).

> Cheaper and faster than starting from scratch, when it works.

## The workflow

1. Molecular docking against the BCR-ABL kinase
2. Molecular dynamics (MD) to check binding stability
3. DFT to look at electronic properties

| Step    | Question it answers        |
| ------- | -------------------------- |
| Docking | Does it fit the pocket?    |
| MD      | Does it stay there?        |
| DFT     | Why does it bind that way? |

## Code looks like this

```python
from rdkit import Chem

mol = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")
print(mol.GetNumAtoms())
```

Inline `code`, [links](https://amrqhz.github.io) and images (`![alt](../img.png)`) all work.
