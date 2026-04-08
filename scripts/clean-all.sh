#!/bin/bash

# ============================================
# Rendimeta Monorepo - Clean All
# ============================================

set -e

echo "🧹 Limpiando archivos de build del monorepo Rendimeta..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Verificar que estamos en la raíz del monorepo
if [ ! -d "rendimeta-mobile" ] || [ ! -d "rendimeta-web" ]; then
    echo "Error: Este script debe ejecutarse desde la raíz del monorepo"
    exit 1
fi

# ============================================
# Limpiar Flutter (Mobile)
# ============================================
print_step "Limpiando proyecto Flutter (rendimeta-mobile)..."
cd rendimeta-mobile

if command -v flutter &> /dev/null; then
    flutter clean
    rm -rf .dart_tool
    rm -rf build
    print_success "Proyecto Flutter limpiado"
else
    print_success "Flutter no instalado, saltando limpieza"
fi

cd ..

# ============================================
# Limpiar Node.js (Web)
# ============================================
print_step "Limpiando proyecto Next.js (rendimeta-web)..."
cd rendimeta-web

rm -rf node_modules
rm -rf .next
rm -rf out
rm -rf dist
rm -rf coverage
rm -rf test-results
rm -rf playwright-report
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

print_success "Proyecto Next.js limpiado"

cd ..

# ============================================
# Limpiar archivos generales
# ============================================
print_step "Limpiando archivos temporales..."
find . -name ".DS_Store" -delete
find . -name "*.log" -delete

print_success "Archivos temporales eliminados"

# ============================================
# Resumen
# ============================================
echo ""
echo "============================================"
print_success "¡Limpieza completada!"
echo "============================================"
echo ""
echo "Para reinstalar dependencias ejecuta:"
echo "  ./scripts/install-all.sh"
echo ""
