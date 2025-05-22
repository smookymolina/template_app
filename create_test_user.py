#!/usr/bin/env python3
"""
Script para crear usuario de prueba con rol asesor
Ejecutar desde la raíz del proyecto: python create_test_user.py
"""

import sys
import os

# Añadir el directorio actual al path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    try:
        print("🔄 Iniciando creación de usuarios de prueba...")
        
        # Importar módulos necesarios
        from app_factory import create_app
        from models.usuario import Usuario
        from models import db
        
        print("✓ Módulos importados correctamente")
        
        # Crear aplicación
        app = create_app('development')
        print("✓ Aplicación Flask creada")
        
        with app.app_context():
            print("✓ Contexto de aplicación iniciado")
            
            # === CREAR USUARIO GERENTE ===
            print("\n--- Creando usuario gerente ---")
            existing_gerente = Usuario.query.filter_by(email='gerente@test.com').first()
            
            if existing_gerente:
                print("✓ El usuario gerente@test.com ya existe")
                print(f"  - Rol actual: {existing_gerente.rol}")
                print(f"  - Nombre: {existing_gerente.nombre}")
                
                # Actualizar rol y nombre si es necesario
                updated = False
                if existing_gerente.rol != 'asesor':
                    existing_gerente.rol = 'asesor'
                    updated = True
                
                if existing_gerente.nombre != 'Juan Gerente':
                    existing_gerente.nombre = 'Juan Gerente'
                    updated = True
                
                if updated:
                    db.session.commit()
                    print("✓ Usuario actualizado")
            else:
                # Crear nuevo usuario gerente
                nuevo_gerente = Usuario(
                    email='gerente@test.com',
                    nombre='Juan Gerente',
                    rol='asesor'
                )
                nuevo_gerente.password = 'gerente123'
                
                db.session.add(nuevo_gerente)
                db.session.commit()
                
                print("✓ Usuario gerente creado exitosamente:")
                print("  - Email: gerente@test.com")
                print("  - Password: gerente123")
                print("  - Rol: asesor")
                print("  - Nombre: Juan Gerente")
            
            # === CREAR USUARIO ADMIN DE PRUEBA ===
            print("\n--- Verificando usuario admin de prueba ---")
            existing_admin = Usuario.query.filter_by(email='admin@test.com').first()
            
            if existing_admin:
                print("✓ El usuario admin@test.com ya existe")
                print(f"  - Rol actual: {existing_admin.rol}")
                
                # Asegurar que tenga rol admin
                if existing_admin.rol != 'admin':
                    existing_admin.rol = 'admin'
                    db.session.commit()
                    print("✓ Rol actualizado a admin")
            else:
                # Crear nuevo usuario admin
                nuevo_admin = Usuario(
                    email='admin@test.com',
                    nombre='Admin Principal',
                    rol='admin'
                )
                nuevo_admin.password = 'admin123'
                
                db.session.add(nuevo_admin)
                db.session.commit()
                
                print("✓ Usuario admin de prueba creado:")
                print("  - Email: admin@test.com")
                print("  - Password: admin123")
                print("  - Rol: admin")
                print("  - Nombre: Admin Principal")
            
            # === VERIFICAR USUARIOS EXISTENTES ===
            print("\n--- Verificando todos los usuarios ---")
            todos_usuarios = Usuario.query.all()
            print(f"✓ Total de usuarios en el sistema: {len(todos_usuarios)}")
            
            for usuario in todos_usuarios:
                rol_display = usuario.get_display_role() if hasattr(usuario, 'get_display_role') else usuario.rol
                print(f"  - {usuario.email} | {rol_display} | ID: {usuario.id}")
            
            # === VERIFICAR USUARIOS POR ROL ===
            print("\n--- Resumen por roles ---")
            admins = Usuario.query.filter_by(rol='admin').all()
            asesores = Usuario.query.filter_by(rol='asesor').all()
            
            print(f"👑 Administradores: {len(admins)}")
            for admin in admins:
                print(f"   - {admin.email} ({admin.nombre or 'Sin nombre'})")
            
            print(f"👥 Asesores/Gerentes: {len(asesores)}")
            for asesor in asesores:
                print(f"   - {asesor.email} ({asesor.nombre or 'Sin nombre'})")
            
            print("\n🎉 ¡Configuración de usuarios completada exitosamente!")
            print("\n=== CREDENCIALES PARA PRUEBAS ===")
            print("👑 ADMINISTRADOR:")
            print("   Email: admin@test.com")
            print("   Password: admin123")
            print("   Funciones: Botón Excel, Ver todos los reclutas, Asignar asesores")
            print()
            print("👥 GERENTE/ASESOR:")
            print("   Email: gerente@test.com") 
            print("   Password: gerente123")
            print("   Funciones: Solo sus reclutas, Sin botón Excel, Vista simplificada")
            print()
            print("🚀 ¡Ya puedes probar el sistema con ambos roles!")

    except ImportError as e:
        print(f"❌ Error de importación: {str(e)}")
        print("\n🔧 Posibles soluciones:")
        print("1. Asegúrate de estar en la raíz del proyecto")
        print("2. Activa el entorno virtual:")
        print("   - En Windows: venv\\Scripts\\activate")
        print("   - En Linux/Mac: source venv/bin/activate")
        print("3. Instala las dependencias: pip install -r requirements.txt")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
        print(f"❌ Tipo de error: {type(e).__name__}")
        print("\n🔧 Verifica:")
        print("1. Que la base de datos esté accesible")
        print("2. Que no haya errores de sintaxis en los modelos")
        print("3. Que las dependencias estén instaladas correctamente")
        
        # Información adicional para debugging
        import traceback
        print("\n📋 Información detallada del error:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()