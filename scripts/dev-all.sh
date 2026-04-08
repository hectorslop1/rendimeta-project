#!/bin/bash

# ============================================
# Rendimeta Monorepo - Dev All
# ============================================

echo "🚀 Iniciando entorno de desarrollo Rendimeta..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar que estamos en la raíz del monorepo
if [ ! -d "rendimeta-mobile" ] || [ ! -d "rendimeta-web" ]; then
    echo -e "${RED}✗${NC} Error: Este script debe ejecutarse desde la raíz del monorepo"
    exit 1
fi

print_info "Este script iniciará ambos proyectos en modo desarrollo"
print_warning "La app móvil requiere un emulador/dispositivo conectado"
echo ""

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    print_info "Deteniendo procesos..."
    kill 0
    exit
}

trap cleanup SIGINT SIGTERM

# ============================================
# Iniciar servidor web en background
# ============================================
print_info "Iniciando servidor web (Next.js) en puerto 3000..."
cd rendimeta-web
npm run dev &
WEB_PID=$!
cd ..

sleep 3

# ============================================
# Iniciar app móvil
# ============================================
print_info "Iniciando app móvil (Flutter)..."
echo ""
print_warning "Asegúrate de tener un emulador o dispositivo conectado"
echo ""

cd rendimeta-mobile
flutter run

# Si flutter run termina, matar el proceso web
kill $WEB_PID
