#!/bin/bash

# ============================================
# Rendimeta Monorepo - Test All
# ============================================

set -e

echo "🧪 Ejecutando tests del monorepo Rendimeta..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verificar que estamos en la raíz del monorepo
if [ ! -d "rendimeta-mobile" ] || [ ! -d "rendimeta-web" ]; then
    print_error "Error: Este script debe ejecutarse desde la raíz del monorepo"
    exit 1
fi

FAILED=0

# ============================================
# Tests Flutter (Mobile)
# ============================================
print_step "Ejecutando tests de Flutter (rendimeta-mobile)..."
cd rendimeta-mobile

if command -v flutter &> /dev/null; then
    if flutter test; then
        print_success "Tests de Flutter pasaron correctamente"
    else
        print_error "Tests de Flutter fallaron"
        FAILED=1
    fi
else
    print_error "Flutter no está instalado"
    FAILED=1
fi

cd ..

# ============================================
# Tests Node.js (Web)
# ============================================
print_step "Ejecutando tests de Next.js (rendimeta-web)..."
cd rendimeta-web

if command -v node &> /dev/null; then
    # Lint
    print_step "Ejecutando linter..."
    if npm run lint; then
        print_success "Linter pasó correctamente"
    else
        print_error "Linter encontró errores"
        FAILED=1
    fi
    
    # E2E tests (si existen)
    if [ -d "tests" ] || [ -d "e2e" ]; then
        print_step "Ejecutando tests E2E..."
        if npm run e2e; then
            print_success "Tests E2E pasaron correctamente"
        else
            print_error "Tests E2E fallaron"
            FAILED=1
        fi
    fi
else
    print_error "Node.js no está instalado"
    FAILED=1
fi

cd ..

# ============================================
# Resumen
# ============================================
echo ""
echo "============================================"
if [ $FAILED -eq 0 ]; then
    print_success "¡Todos los tests pasaron correctamente!"
    echo "============================================"
    exit 0
else
    print_error "Algunos tests fallaron"
    echo "============================================"
    exit 1
fi
