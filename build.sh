#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

echo "→ Generating slides..."
node generate-deck.js

echo "→ Unpacking..."
python3 /Users/furkan/.grok/skills/pptx/scripts/office/unpack.py zerosix-pitch-sans-site.pptx unpacked

echo "→ Adding animations..."
python3 scripts/add_animations.py

echo "✓ Done: zerosix-pitch-sans-site.pptx"