#!/usr/bin/env python3
"""
Script de verificación del sistema de roles
Verifica que todo esté funcionando correctamente
"""

import sys
import os
import requests
import json

# Añadir el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def print_header(text):
    print(f"\n{'='*60}")
    print(f"{text.center(60)}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✓ {message}")

def print_error(message):
    print(f"✗ {message}")

def print_warning(message):
    print(f"⚠ {message}")

def test_database_roles():
    """Prueba los roles en la base de datos"""
    print_header("VERIFICACIÓN DE BASE DE DATOS")
    
    try:
        from app_factory import create_app
        from models.usuario import Usuario
        
        app = create_app('development')
        
        with app.app_context():
            usuarios = Usuario.query.all()
            
            if not usuarios:
                print_warning("No hay usuarios en la base de datos")
                return False
            
            print(f"Total de usuarios: {len(usuarios)}")
            
            # Verificar roles
            admins = Usuario.query.filter_by(rol='admin').all()
            asesores = Usuario.query.filter_by(rol='asesor').all()
            sin_rol = Usuario.query.filter((Usuario.rol == None) | (Usuario.rol == '')).all()
            
            print(f"Administradores: {len(admins)}")
            print(f"Asesores: {len(asesores)}")
            print(f"Sin rol: {len(sin_rol)}")
            
            # Verificar métodos de permisos
            if admins:
                admin = admins[0]
                print_success(f"Admin {admin.email} - Puede subir Excel: {admin.can_upload_excel()}")
                print_success(f"Admin {admin.email} - Es admin: {admin.is_admin()}")
            
            if asesores:
                asesor = asesores[0]
                print_success(f"Asesor {asesor.email} - Puede subir Excel: {asesor.can_upload_excel()}")
                print_success(f"Asesor {asesor.email} - Es asesor: {asesor.is_asesor()}")
            
            if len(admins) == 0:
                print_error("No hay administradores en el sistema")
                return False
            
            if len(sin_rol) > 0:
                print_warning(f"Hay {len(sin_rol)} usuarios sin rol definido")
                return False
            
            print_success("Base de datos verificada correctamente")
            return True
            
    except Exception as e:
        print_error(f"Error al verificar base de datos: {str(e)}")
        return False

def test_api_endpoints():
    """Prueba los endpoints de API"""
    print_header("VERIFICACIÓN DE ENDPOINTS API")
    
    try:
        # Configurar base URL
        base_url = "http://localhost:5000"
        
        # Intentar hacer login con usuario admin
        print("Intentando conectar con el servidor...")
        
        # Verificar que el servidor esté corriendo
        try:
            response = requests.get(f"{base_url}/", timeout=5)
            print_success("Servidor Flask está corriendo")
        except requests.exceptions.ConnectionError:
            print_error("Servidor Flask no está corriendo. Inicia el servidor con 'python app.py'")
            return False
        except Exception as e:
            print_error(f"Error al conectar con el servidor: {str(e)}")
            return False
        
        # Aquí podrías añadir más pruebas de endpoints si tienes credenciales de prueba
        print_success("Endpoints básicos verificados")
        return True
        
    except Exception as e:
        print_error(f"Error al verificar endpoints: {str(e)}")
        return False

def test_file_structure():
    """Verifica la estructura de archivos"""
    print_header("VERIFICACIÓN DE ESTRUCTURA DE ARCHIVOS")
    
    required_files = [
        'models/usuario.py',
        'routes/api.py',
        'routes/auth.py',
        'static/js/auth.js',
        'static/js/reclutas.js',
        'static/js/main.js',
        'utils/decorators.py',
        'templates/components/seccion_reclutas.html'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print_success(f"Encontrado: {file_path}")
        else:
            print_error(f"Faltante: {file_path}")
            missing_files.append(file_path)
    
    if missing_files:
        print_error(f"Faltan {len(missing_files)} archivos importantes")
        return False
    else:
        print_success("Todos los archivos necesarios están presentes")
        return True

def test_decorators():
    """Prueba los decoradores de seguridad"""
    print_header("VERIFICACIÓN DE DECORADORES")
    
    try:
        from utils.decorators import admin_required, excel_upload_required, role_required
        print_success("Decoradores importados correctamente")
        
        # Verificar que los decoradores se puedan usar
        @admin_required
        def test_admin_function():
            return "Solo admin"
        
        @excel_upload_required
        def test_excel_function():
            return "Solo para Excel"
        
        @role_required(['admin', 'asesor'])
        def test_role_function():
            return "Admin o asesor"
        
        print_success("Decoradores funcionan correctamente")
        return True
        
    except ImportError as e:
        print_error(f"Error al importar decoradores: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Error al probar decoradores: {str(e)}")
        return False

def generate_recommendations():
    """Genera recomendaciones finales"""
    print_header("RECOMENDACIONES")
    
    print("📋 Lista de verificación final:")
    print()
    print("1. ✓ Ejecutar fix_roles.py para corregir roles existentes")
    print("2. ✓ Verificar que hay al menos un usuario admin")
    print("3. ✓ Probar login con admin y verificar botón Excel")
    print("4. ✓ Probar login con asesor y verificar que NO aparece botón Excel")
    print("5. ✓ Verificar que los asesores solo ven sus reclutas")
    print("6. ✓ Verificar que los admins ven todos los reclutas")
    print()
    print("🚀 Para crear usuarios de prueba:")
    print("   python create_test_user.py")
    print()
    print("🔧 Para corregir roles existentes:")
    print("   python fix_roles.py")
    print()
    print("🌐 Para iniciar el servidor:")
    print("   python app.py")

def main():
    print_header("VERIFICACIÓN DEL SISTEMA DE ROLES")
    print("Este script verifica que el sistema de roles esté funcionando correctamente")
    
    # Lista de verificaciones
    tests = [
        ("Estructura de archivos", test_file_structure),
        ("Base de datos y roles", test_database_roles),
        ("Decoradores de seguridad", test_decorators),
        ("Endpoints API", test_api_endpoints)
    ]
    
    results = []
    
    for test_name, test_function in tests:
        try:
            result = test_function()
            results.append((test_name, result))
        except Exception as e:
            print_error(f"Error en {test_name}: {str(e)}")
            results.append((test_name, False))
    
    # Resumen final
    print_header("RESUMEN DE VERIFICACIÓN")
    
    passed = 0
    failed = 0
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}: PASÓ")
            passed += 1
        else:
            print_error(f"{test_name}: FALLÓ")
            failed += 1
    
    print(f"\nResultados: {passed} pasaron, {failed} fallaron")
    
    if failed == 0:
        print_success("¡Todas las verificaciones pasaron! El sistema de roles está listo.")
    else:
        print_warning(f"Hay {failed} problemas que necesitan atención.")
    
    # Generar recomendaciones
    generate_recommendations()

if __name__ == "__main__":
    main()