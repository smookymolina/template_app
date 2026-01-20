#!/usr/bin/env python3
"""
Script de Actualización de Dependencias Seguras
Sistema de Gestión de Reclutas - v1.5.6.2
Enero 2026

Este script actualiza las dependencias con vulnerabilidades conocidas
a versiones seguras, con opciones de backup y rollback.
"""

import subprocess
import sys
import os
from datetime import datetime
from pathlib import Path

# Colores para terminal
class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    NC = '\033[0m'  # No Color

def print_header():
    print(f"""
{Colors.BLUE}╔════════════════════════════════════════════════════════════╗
║  Actualizador de Dependencias Seguras                       ║
║  Sistema de Gestión de Reclutas v1.5.6.2                   ║
╚════════════════════════════════════════════════════════════╝{Colors.NC}
""")

def print_warning():
    print(f"""
{Colors.YELLOW}⚠️  ADVERTENCIA: Este script actualizará las dependencias del proyecto.

    Vulnerabilidades a corregir:
    - 1 CRÍTICA (redis)
    - 11 ALTAS (gunicorn, werkzeug, aiohttp, etc.)
    - 23 MODERADAS (jinja2, flask, etc.)

    Se recomienda:
    1. Hacer backup del requirements.txt actual
    2. Probar en entorno de desarrollo primero
    3. Ejecutar tests después de actualizar
{Colors.NC}""")

def backup_requirements():
    """Crea backup del requirements.txt actual"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    project_root = Path(__file__).parent.parent
    req_file = project_root / 'requirements.txt'
    backup_file = project_root / f'requirements_backup_{timestamp}.txt'

    if req_file.exists():
        import shutil
        shutil.copy(req_file, backup_file)
        print(f"{Colors.GREEN}✓ Backup creado: {backup_file.name}{Colors.NC}")
        return backup_file
    else:
        print(f"{Colors.RED}✗ No se encontró requirements.txt{Colors.NC}")
        return None

def get_current_versions():
    """Obtiene las versiones actuales instaladas"""
    result = subprocess.run(
        [sys.executable, '-m', 'pip', 'freeze'],
        capture_output=True, text=True
    )
    versions = {}
    for line in result.stdout.strip().split('\n'):
        if '==' in line:
            pkg, ver = line.split('==')
            versions[pkg.lower()] = ver
    return versions

def update_critical():
    """Actualiza solo paquetes con vulnerabilidades críticas"""
    print(f"\n{Colors.RED}🔴 Actualizando paquetes CRÍTICOS...{Colors.NC}")
    packages = ['redis>=5.2.0']
    return update_packages(packages)

def update_high():
    """Actualiza paquetes con vulnerabilidades altas"""
    print(f"\n{Colors.YELLOW}🟠 Actualizando paquetes de severidad ALTA...{Colors.NC}")
    packages = [
        'gunicorn>=22.0.0',
        'Werkzeug>=3.0.6',
        'aiohttp>=3.11.0'
    ]
    return update_packages(packages)

def update_moderate():
    """Actualiza paquetes con vulnerabilidades moderadas"""
    print(f"\n{Colors.CYAN}🔵 Actualizando paquetes de severidad MODERADA...{Colors.NC}")
    packages = [
        'Jinja2>=3.1.4',
        'Flask>=3.0.0',
        'cryptography>=43.0.1'
    ]
    return update_packages(packages)

def update_packages(packages):
    """Actualiza una lista de paquetes"""
    success = True
    for pkg in packages:
        print(f"  → Instalando {pkg}...", end=' ')
        result = subprocess.run(
            [sys.executable, '-m', 'pip', 'install', pkg, '-q'],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print(f"{Colors.GREEN}✓{Colors.NC}")
        else:
            print(f"{Colors.RED}✗{Colors.NC}")
            print(f"    Error: {result.stderr[:100]}")
            success = False
    return success

def run_tests():
    """Ejecuta tests para verificar compatibilidad"""
    print(f"\n{Colors.BLUE}🧪 Ejecutando tests...{Colors.NC}")
    result = subprocess.run(
        [sys.executable, '-m', 'pytest', '-x', '-q'],
        capture_output=True, text=True,
        cwd=Path(__file__).parent.parent
    )
    if result.returncode == 0:
        print(f"{Colors.GREEN}✓ Tests pasaron correctamente{Colors.NC}")
        return True
    else:
        print(f"{Colors.RED}✗ Algunos tests fallaron:{Colors.NC}")
        print(result.stdout[-500:] if len(result.stdout) > 500 else result.stdout)
        return False

def update_requirements_file():
    """Actualiza el archivo requirements.txt con versiones seguras"""
    project_root = Path(__file__).parent.parent
    secure_req = Path(__file__).parent / 'requirements-secure.txt'
    target_req = project_root / 'requirements.txt'

    if secure_req.exists():
        import shutil
        shutil.copy(secure_req, target_req)
        print(f"{Colors.GREEN}✓ requirements.txt actualizado con versiones seguras{Colors.NC}")
        return True
    return False

def show_menu():
    print(f"""
{Colors.CYAN}Opciones disponibles:{Colors.NC}

  1) Actualizar SOLO paquetes críticos (redis)
  2) Actualizar críticos + altos (gunicorn, werkzeug, aiohttp)
  3) Actualizar TODOS los paquetes vulnerables
  4) Ver versiones actuales vs recomendadas
  5) Ejecutar tests de compatibilidad
  6) Reemplazar requirements.txt con versión segura
  0) Salir
""")

def show_version_comparison():
    """Muestra comparación de versiones"""
    current = get_current_versions()

    vulnerables = {
        'redis': ('5.0.8', '>=5.2.0', 'CRÍTICA'),
        'gunicorn': ('21.2.0', '>=22.0.0', 'ALTA'),
        'werkzeug': ('2.3.7', '>=3.0.6', 'ALTA'),
        'aiohttp': ('3.10.5', '>=3.11.0', 'ALTA'),
        'jinja2': ('3.1.2', '>=3.1.4', 'MODERADA'),
        'flask': ('2.3.3', '>=3.0.0', 'MODERADA'),
    }

    print(f"\n{Colors.BLUE}Comparación de versiones:{Colors.NC}\n")
    print(f"{'Paquete':<15} {'Actual':<12} {'Recomendada':<12} {'Severidad':<10}")
    print("-" * 50)

    for pkg, (expected, recommended, severity) in vulnerables.items():
        actual = current.get(pkg, 'No instalado')

        if severity == 'CRÍTICA':
            color = Colors.RED
        elif severity == 'ALTA':
            color = Colors.YELLOW
        else:
            color = Colors.CYAN

        print(f"{pkg:<15} {actual:<12} {recommended:<12} {color}{severity}{Colors.NC}")

def main():
    print_header()
    print_warning()

    # Verificar entorno virtual
    if not hasattr(sys, 'prefix') or sys.prefix == sys.base_prefix:
        print(f"{Colors.YELLOW}⚠️  No se detectó entorno virtual activo.{Colors.NC}")
        print("   Se recomienda activar el entorno virtual antes de continuar.")
        response = input("\n¿Desea continuar de todos modos? (s/N): ")
        if response.lower() != 's':
            print("Operación cancelada.")
            return

    while True:
        show_menu()
        option = input("Seleccione una opción: ").strip()

        if option == '1':
            backup_requirements()
            update_critical()

        elif option == '2':
            backup_requirements()
            update_critical()
            update_high()

        elif option == '3':
            backup_requirements()
            update_critical()
            update_high()
            update_moderate()
            print(f"\n{Colors.GREEN}✓ Todas las actualizaciones completadas{Colors.NC}")
            print(f"{Colors.YELLOW}  Ejecute los tests para verificar compatibilidad{Colors.NC}")

        elif option == '4':
            show_version_comparison()

        elif option == '5':
            run_tests()

        elif option == '6':
            backup_requirements()
            update_requirements_file()

        elif option == '0':
            print(f"\n{Colors.GREEN}¡Hasta luego!{Colors.NC}")
            break

        else:
            print(f"{Colors.RED}Opción no válida{Colors.NC}")

        input("\nPresione Enter para continuar...")

if __name__ == '__main__':
    main()
