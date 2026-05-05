#!/bin/bash
set -e

ROOT="$(git rev-parse --show-toplevel)"
ERROR_LIB="$ROOT/apps/desktop/.agent/wiki/error_library.md"

echo ""
echo "🔍 Health Check — actionnew/desktop"
echo "══════════════════════════════════════"

if [ -f "$ERROR_LIB" ]; then
  echo ""
  echo "⚠️  Lecciones aprendidas — verifica que no las estás repitiendo:"
  echo "──────────────────────────────────────────────────────────────────"
  grep "^## ERR-" "$ERROR_LIB" | sed 's/^## /  • /'
  echo "──────────────────────────────────────────────────────────────────"
  echo "  Ver detalles: .agent/wiki/error_library.md"
  echo ""
fi

echo "🎭 Ejecutando tests e2e..."
cd "$ROOT/apps/desktop"
pnpm test:e2e:smoke

echo ""
echo "✅ Health Check completado."
