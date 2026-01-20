#!/bin/bash
# ============================================
# Comandos Rápidos - Sistema de Gestión de Reclutas
# Versión: 1.5.6.2
# ============================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directorio del proyecto (ajustar según instalación)
PROJECT_DIR="/ruta/a/template_app"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE} Sistema de Gestión de Reclutas - Comandos${NC}"
echo -e "${BLUE}============================================${NC}"

show_menu() {
    echo ""
    echo -e "${GREEN}Selecciona una opción:${NC}"
    echo ""
    echo "  1) Ejecutar servidor de desarrollo"
    echo "  2) Ejecutar diagnóstico de BD"
    echo "  3) Exportar datos a CSV"
    echo "  4) Aplicar migraciones (flask db upgrade)"
    echo "  5) Ver estado de migraciones"
    echo "  6) Reiniciar Gunicorn"
    echo "  7) Ver logs de Gunicorn"
    echo "  8) Actualizar desde Git"
    echo "  9) Crear usuario admin"
    echo "  0) Salir"
    echo ""
    read -p "Opción: " option
}

run_dev_server() {
    echo -e "${YELLOW}Iniciando servidor de desarrollo...${NC}"
    cd $PROJECT_DIR
    source .venv/bin/activate
    flask run --host=0.0.0.0 --port=5000
}

run_diagnostic() {
    echo -e "${YELLOW}Ejecutando diagnóstico de BD...${NC}"
    cd $PROJECT_DIR
    source .venv/bin/activate
    python scripts/diagnostico_db.py
}

export_data() {
    echo -e "${YELLOW}Exportando datos a CSV...${NC}"
    cd $PROJECT_DIR
    source .venv/bin/activate
    python scripts/export_data.py
}

run_migrations() {
    echo -e "${YELLOW}Aplicando migraciones...${NC}"
    cd $PROJECT_DIR
    source .venv/bin/activate
    flask db upgrade
}

check_migrations() {
    echo -e "${YELLOW}Estado de migraciones...${NC}"
    cd $PROJECT_DIR
    source .venv/bin/activate
    flask db current
    echo ""
    flask db history
}

restart_gunicorn() {
    echo -e "${YELLOW}Reiniciando Gunicorn...${NC}"
    sudo systemctl restart gunicorn
    sudo systemctl status gunicorn
}

view_logs() {
    echo -e "${YELLOW}Mostrando logs de Gunicorn (Ctrl+C para salir)...${NC}"
    sudo journalctl -u gunicorn -f
}

update_from_git() {
    echo -e "${YELLOW}Actualizando desde Git...${NC}"
    cd $PROJECT_DIR
    git fetch origin
    git pull origin $(git branch --show-current)
    source .venv/bin/activate
    pip install -r requirements.txt
    flask db upgrade
    echo -e "${GREEN}Actualización completada. Reinicia el servidor manualmente.${NC}"
}

create_admin() {
    echo -e "${YELLOW}Creando usuario administrador...${NC}"
    cd $PROJECT_DIR
    source .venv/bin/activate
    flask crear-admin
}

# Loop principal
while true; do
    show_menu
    case $option in
        1) run_dev_server ;;
        2) run_diagnostic ;;
        3) export_data ;;
        4) run_migrations ;;
        5) check_migrations ;;
        6) restart_gunicorn ;;
        7) view_logs ;;
        8) update_from_git ;;
        9) create_admin ;;
        0) echo -e "${GREEN}¡Hasta luego!${NC}"; exit 0 ;;
        *) echo -e "${RED}Opción no válida${NC}" ;;
    esac
    echo ""
    read -p "Presiona Enter para continuar..."
done
