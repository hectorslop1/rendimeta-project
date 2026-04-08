#!/bin/bash

# =============================================================================
# Rendimeta - Script de Desarrollo Principal
# =============================================================================
# Selector para iniciar app web o móvil
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
clear
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
echo -e "${CYAN}Selector de Aplicación${NC}"
echo ""

# Obtener directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Menú de selección
echo -e "${YELLOW}¿Qué aplicación deseas iniciar?${NC}"
echo ""
echo -e "  ${GREEN}1)${NC} 🌐 App Web (Next.js)"
echo -e "  ${GREEN}2)${NC} 📱 App Móvil (Flutter)"
echo -e "  ${GREEN}3)${NC} 🚀 Ambas aplicaciones"
echo -e "  ${RED}0)${NC} ❌ Salir"
echo ""
echo -n -e "${CYAN}Selecciona una opción [1-3]:${NC} "
read -r option

case $option in
    1)
        echo ""
        echo -e "${BLUE}🌐 Iniciando App Web...${NC}"
        echo ""
        cd "$SCRIPT_DIR/rendimeta-web"
        ./dev.sh
        ;;
    2)
        echo ""
        echo -e "${BLUE}📱 Iniciando App Móvil...${NC}"
        echo ""
        cd "$SCRIPT_DIR/rendimeta-mobile"
        
        # Verificar si Flutter está instalado
        if ! command -v flutter &> /dev/null; then
            echo -e "${RED}❌ Error: Flutter no está instalado${NC}"
            echo -e "${YELLOW}   Instala Flutter desde: https://flutter.dev/docs/get-started/install${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}📦 Obteniendo dependencias...${NC}"
        flutter pub get
        
        echo ""
        echo -e "${GREEN}🚀 Iniciando app móvil...${NC}"
        echo -e "${YELLOW}💡 Asegúrate de tener un emulador/dispositivo conectado${NC}"
        echo ""
        
        flutter run
        ;;
    3)
        echo ""
        echo -e "${BLUE}🚀 Iniciando ambas aplicaciones...${NC}"
        echo ""
        
        # Iniciar app web en background
        echo -e "${CYAN}[1/2]${NC} Iniciando App Web..."
        cd "$SCRIPT_DIR/rendimeta-web"
        ./dev.sh &
        WEB_PID=$!
        
        sleep 3
        
        # Iniciar app móvil
        echo ""
        echo -e "${CYAN}[2/2]${NC} Iniciando App Móvil..."
        cd "$SCRIPT_DIR/rendimeta-mobile"
        
        if ! command -v flutter &> /dev/null; then
            echo -e "${RED}❌ Error: Flutter no está instalado${NC}"
            echo -e "${YELLOW}   Deteniendo app web...${NC}"
            kill $WEB_PID 2>/dev/null || true
            exit 1
        fi
        
        flutter pub get
        flutter run
        
        # Al salir de Flutter, matar proceso web
        kill $WEB_PID 2>/dev/null || true
        ;;
    0)
        echo ""
        echo -e "${MAGENTA}👋 ¡Hasta pronto!${NC}"
        echo ""
        exit 0
        ;;
    *)
        echo ""
        echo -e "${RED}❌ Opción inválida${NC}"
        echo ""
        exit 1
        ;;
esac
