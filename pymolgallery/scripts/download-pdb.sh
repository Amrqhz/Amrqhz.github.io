#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/assets/pdb"
mkdir -p "$DEST"

for pdb in 1HVR 5MO4; do
  out="$DEST/${pdb,,}.pdb"
  echo "Downloading $pdb -> $out"
  curl -L --fail --retry 3 "https://files.rcsb.org/download/${pdb}.pdb" -o "$out"
done

echo "Done. Bundled reference structures are in $DEST"
