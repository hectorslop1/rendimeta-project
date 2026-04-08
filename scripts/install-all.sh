#!/bin/bash

# ============================================
# Rendimeta Monorepo - Install All
# ============================================

set -e

echo "🚀 Instalando dependencias del monorepo Rendimeta..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir con color
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

# ============================================
# Instalar dependencias de Flutter (Mobile)
# ============================================
print_step "Instalando dependencias de Flutter (rendimeta-mobile)..."
cd rendimeta-mobile

if ! command -v flutter &> /dev/null; then
    print_error "Flutter no está instalado. Por favor instala Flutter SDK primero."
    print_error "Visita: https://flutter.dev/docs/get-started/install"
    exit 1
fi

flutter pub get
if [ $? -eq 0 ]; then
    print_success "Dependencias de Flutter instaladas correctamente"
else
    print_error "Error al instalar dependencias de Flutter"
    exit 1
fi

cd ..

# ============================================
# Instalar dependencias de Node.js (Web)
# ============================================
print_step "Instalando dependencias de Node.js (rendimeta-web)..."
cd rendimeta-web

if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instala Node.js primero."
    print_error "Visita: https://nodejs.org/"
    exit 1
fi

npm install
if [ $? -eq 0 ]; then
    print_success "Dependencias de Node.js instaladas correctamente"
else
    print_error "Error al instalar dependencias de Node.js"
    exit 1
fi

# Generar cliente Prisma
print_step "Generando cliente Prisma..."
npx prisma generate
if [ $? -eq 0 ]; then
    print_success "Cliente Prisma generado correctamente"
else
    print_error "Error al generar cliente Prisma"
fi

cd ..

# ============================================
# Resumen
# ============================================
echo ""
echo "============================================"
print_success "¡Instalación completada!"
echo "============================================"
echo ""
echo "Próximos pasos:"
echo "  1. Configura las variables de entorno (.env)"
echo "  2. Para desarrollo móvil: cd rendimeta-mobile && flutter run"
echo "  3. Para desarrollo web: cd rendimeta-web && npm run dev"
echo "  4. O ejecuta: ./scripts/dev-all.sh para ambos"
echo ""
