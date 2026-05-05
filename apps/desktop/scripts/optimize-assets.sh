#!/usr/bin/env bash
# optimize-assets.sh — run before deploy to compress 3D models and check media sizes
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODELS="$ROOT/public/3d_models"
VIDEOS="$ROOT/public/projects_video"
IMAGES="$ROOT/public/projects"

echo "── 3D Models ─────────────────────────────────────"
for glb in "$MODELS"/**/*.glb; do
  [ -f "$glb" ] || continue
  size=$(du -sh "$glb" | cut -f1)
  echo "  $size  $(basename $glb)"
  # Optimize with Draco compression + dedup + prune
  npx gltf-transform optimize "$glb" "$glb" \
    --compress draco \
    --texture-compress webp \
    2>/dev/null && echo "    → optimized" || echo "    → skipped (already optimized or error)"
done

echo ""
echo "── Video sizes (warn if >3MB) ────────────────────"
for f in "$VIDEOS"/*.webm "$VIDEOS"/*.mp4; do
  [ -f "$f" ] || continue
  bytes=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
  size=$(du -sh "$f" | cut -f1)
  name=$(basename "$f")
  if [ "$bytes" -gt 3145728 ]; then
    echo "  ⚠  $size  $name  (>3MB — consider reducing bitrate)"
  else
    echo "  ✓  $size  $name"
  fi
done

echo ""
echo "── Image sizes (warn if >200KB) ──────────────────"
for f in "$IMAGES"/*.webp "$IMAGES"/*.avif "$IMAGES"/*.jpg "$IMAGES"/*.png; do
  [ -f "$f" ] || continue
  bytes=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
  size=$(du -sh "$f" | cut -f1)
  name=$(basename "$f")
  if [ "$bytes" -gt 204800 ]; then
    echo "  ⚠  $size  $name  (>200KB — consider squoosh or avif)"
  else
    echo "  ✓  $size  $name"
  fi
done

echo ""
echo "Done."
