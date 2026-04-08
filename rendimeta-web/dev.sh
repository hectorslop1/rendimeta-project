#!/bin/bash

# =============================================================================
# Rendimeta Web - Script de Desarrollo Automatizado
# =============================================================================
# Este script:
# 1. Detiene procesos existentes del servidor
# 2. Instala dependencias si es necesario
# 3. Inicia el servidor de desarrollo
# 4. Abre automáticamente el navegador
# =============================================================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                                                                   ║${NC}"
echo -e "${MAGENTA}║${NC}  ${CYAN}██████╗ ███████╗███╗   ██╗██████╗ ██╗███╗   ███╗███████╗████████╗ █████╗${NC}  ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}  ${CYAN}██╔══██╗██╔════╝████╗  ██║██╔══██╗██║████╗ ████║██╔════╝╚══██╔══╝██╔══██╗${NC} ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}  ${CYAN}██████╔╝█████╗  ██╔██╗ ██║██║  ██║██║██╔████╔██║█████╗     ██║   ███████║${NC} ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}  ${CYAN}██╔══██╗██╔══╝  ██║╚██╗██║██║  ██║██║██║╚██╔╝██║██╔══╝     ██║   ██╔══██║${NC} ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}  ${CYAN}██║  ██║███████╗██║ ╚████║██████╔╝██║██║ ╚═╝ ██║███████╗   ██║   ██║  ██║${NC} ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║${NC}  ${CYAN}╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝ ╚═╝╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝${NC} ${MAGENTA}║${NC}"
echo -e "${MAGENTA}║                                                                   ║${NC}"
echo -e "${MAGENTA}║${NC}                  ${YELLOW}Una herramienta de RendiChicas${NC}                    ${MAGENTA}║${NC}"
echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Obtener el directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}📂 Directorio de trabajo:${NC} $SCRIPT_DIR"
echo ""

# =============================================================================
# 1. Detener procesos existentes
# =============================================================================
echo -e "${YELLOW}🛑 Verificando procesos existentes...${NC}"

# Buscar procesos de Next.js en el puerto 3000
NEXT_PIDS=$(lsof -ti:3000 2>/dev/null || true)

if [ ! -z "$NEXT_PIDS" ]; then
    echo -e "${YELLOW}   ⚠️  Procesos encontrados en puerto 3000${NC}"
    echo -e "${YELLOW}   🔪 Deteniendo procesos: $NEXT_PIDS${NC}"
    kill -9 $NEXT_PIDS 2>/dev/null || true
    sleep 1
    echo -e "${GREEN}   ✅ Procesos detenidos${NC}"
else
    echo -e "${GREEN}   ✅ No hay procesos corriendo en puerto 3000${NC}"
fi

echo ""

# =============================================================================
# 2. Verificar e instalar dependencias
# =============================================================================
echo -e "${YELLOW}📦 Verificando dependencias...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}   ⚠️  node_modules no encontrado${NC}"
    echo -e "${BLUE}   📥 Instalando dependencias...${NC}"
    npm install
    echo -e "${GREEN}   ✅ Dependencias instaladas${NC}"
else
    # Verificar si package.json cambió
    if [ "package.json" -nt "node_modules" ]; then
        echo -e "${YELLOW}   ⚠️  package.json ha cambiado${NC}"
        echo -e "${BLUE}   📥 Actualizando dependencias...${NC}"
        npm install
        echo -e "${GREEN}   ✅ Dependencias actualizadas${NC}"
    else
        echo -e "${GREEN}   ✅ Dependencias ya instaladas${NC}"
    fi
fi

echo ""

# =============================================================================
# 3. Verificar archivo .env
# =============================================================================
echo -e "${YELLOW}🔐 Verificando configuración...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}   ⚠️  .env no encontrado${NC}"
        echo -e "${BLUE}   📝 Creando .env desde .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}   ✅ Archivo .env creado${NC}"
    else
        echo -e "${YELLOW}   ⚠️  .env no encontrado (continuando sin él)${NC}"
    fi
else
    echo -e "${GREEN}   ✅ Archivo .env encontrado${NC}"
fi

echo ""

# =============================================================================
# 4. Generar Prisma Client
# =============================================================================
echo -e "${YELLOW}🔧 Generando Prisma Client...${NC}"
npx prisma generate > /dev/null 2>&1
echo -e "${GREEN}   ✅ Prisma Client generado${NC}"
echo ""

# =============================================================================
# 5. Limpiar caché de Next.js (opcional)
# =============================================================================
if [ -d ".next" ]; then
    echo -e "${YELLOW}🧹 Limpiando caché de Next.js...${NC}"
    rm -rf .next
    echo -e "${GREEN}   ✅ Caché limpiado${NC}"
    echo ""
fi

# =============================================================================
# 6. Iniciar servidor de desarrollo
# =============================================================================
echo -e "${GREEN}🚀 Iniciando servidor de desarrollo...${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  Servidor:${NC} http://localhost:3000"
echo -e "${CYAN}  Login:${NC}    http://localhost:3000/login"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Usuarios de prueba:${NC}"
echo -e "   ${GREEN}•${NC} admin@sistema.com (Super Admin)"
echo -e "   ${GREEN}•${NC} gerente.regional@sistema.com (Gerente Regional)"
echo -e "   ${GREEN}•${NC} supervisor@sistema.com (Encargado Turno)"
echo -e "   ${GREEN}•${NC} Contraseña: ${CYAN}admin123${NC}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⌨️  Presiona Ctrl+C para detener el servidor${NC}"
echo ""

# Esperar 3 segundos antes de abrir el navegador
sleep 3

# Abrir navegador automáticamente
echo -e "${BLUE}🌐 Abriendo navegador...${NC}"
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:3000/login
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:3000/login
elif command -v start &> /dev/null; then
    # Windows (Git Bash)
    start http://localhost:3000/login
fi

echo ""

# Iniciar servidor (esto bloqueará el script hasta que se detenga con Ctrl+C)
npm run dev

# =============================================================================
# Cleanup al salir (Ctrl+C)
# =============================================================================
trap cleanup EXIT

cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Deteniendo servidor...${NC}"
    # Los procesos se limpiarán automáticamente al salir
    echo -e "${GREEN}✅ Servidor detenido${NC}"
    echo ""
    echo -e "${MAGENTA}👋 ¡Hasta pronto!${NC}"
    echo ""
}
