#!/usr/bin/env python3
"""
Script para corregir roles de usuarios existentes
Ejecutar desde la raíz del proyecto: python fix_roles.py
"""

import sys
import os

# Añadir el directorio actual al path para importar módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    try:
        print("🔄 Iniciando corrección de roles de usuarios...")
        
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
            
            # === OBTENER TODOS LOS USUARIOS ===
            usuarios = Usuario.query.all()
            print(f"\n📊 Total de usuarios en el sistema: {len(usuarios)}")
            
            if len(usuarios) == 0:
                print("ℹ️  No hay usuarios en el sistema.")
                return
            
            # === MOSTRAR ESTADO ACTUAL ===
            print("\n📋 Estado actual de usuarios:")
            print("-" * 60)
            for usuario in usuarios:
                rol_actual = getattr(usuario, 'rol', None) or 'Sin rol'
                print(f"  - {usuario.email:<35} | {rol_actual}")
            print("-" * 60)
            
            # === CONTAR USUARIOS POR ROL ===
            admins = Usuario.query.filter_by(rol='admin').count()
            asesores = Usuario.query.filter_by(rol='asesor').count()
            sin_rol = Usuario.query.filter((Usuario.rol == None) | (Usuario.rol == '')).count()
            
            print(f"\n📈 Resumen actual:")
            print(f"  👑 Administradores: {admins}")
            print(f"  👥 Asesores/Gerentes: {asesores}")
            print(f"  ❓ Sin rol definido: {sin_rol}")
            
            # === CORRECCIÓN AUTOMÁTICA ===
            usuarios_modificados = 0
            
            print(f"\n🔧 Aplicando correcciones...")
            
            for usuario in usuarios:
                rol_actual = getattr(usuario, 'rol', None)
                modificado = False
                
                # Si no tiene rol, asignar 'asesor' por defecto
                if not rol_actual or rol_actual.strip() == '':
                    usuario.rol = 'asesor'
                    modificado = True
                    print(f"  ✓ {usuario.email}: Sin rol → asesor")
                
                # Si el rol es 'user', cambiar a 'asesor'
                elif rol_actual == 'user':
                    usuario.rol = 'asesor'
                    modificado = True
                    print(f"  ✓ {usuario.email}: user → asesor")
                
                # Si el rol es 'gerente', mantener como 'asesor' (normalización)
                elif rol_actual == 'gerente':
                    usuario.rol = 'asesor'
                    modificado = True
                    print(f"  ✓ {usuario.email}: gerente → asesor")
                
                if modificado:
                    usuarios_modificados += 1
            
            # === CONFIGURAR AL MENOS UN ADMINISTRADOR ===
            print(f"\n👑 Verificando que exista al menos un administrador...")
            
            admin_actual = Usuario.query.filter_by(rol='admin').first()
            if not admin_actual:
                # Si no hay admin, promover el primer usuario
                primer_usuario = Usuario.query.first()
                if primer_usuario:
                    primer_usuario.rol = 'admin'
                    print(f"  ✓ Promovido a admin: {primer_usuario.email}")
                    usuarios_modificados += 1
                else:
                    print("  ⚠️  No hay usuarios para promover a admin")
            else:
                print(f"  ✓ Admin existente: {admin_actual.email}")
            
            # === GUARDAR CAMBIOS ===
            if usuarios_modificados > 0:
                try:
                    db.session.commit()
                    print(f"\n💾 Cambios guardados exitosamente: {usuarios_modificados} usuarios modificados")
                except Exception as e:
                    db.session.rollback()
                    print(f"\n❌ Error al guardar cambios: {str(e)}")
                    return
            else:
                print(f"\n📝 No se requirieron cambios")
            
            # === MOSTRAR ESTADO FINAL ===
            print(f"\n📊 Estado final de usuarios:")
            print("-" * 60)
            
            usuarios_finales = Usuario.query.all()
            for usuario in usuarios_finales:
                rol_final = getattr(usuario, 'rol', 'Sin rol')
                emoji = "👑" if rol_final == 'admin' else "👥" if rol_final == 'asesor' else "❓"
                print(f"  {emoji} {usuario.email:<35} | {rol_final}")
            
            print("-" * 60)
            
            # === RESUMEN FINAL ===
            admins_final = Usuario.query.filter_by(rol='admin').count()
            asesores_final = Usuario.query.filter_by(rol='asesor').count()
            sin_rol_final = Usuario.query.filter((Usuario.rol == None) | (Usuario.rol == '')).count()
            
            print(f"\n📈 Resumen final:")
            print(f"  👑 Administradores: {admins_final}")
            print(f"  👥 Asesores/Gerentes: {asesores_final}")
            print(f"  ❓ Sin rol definido: {sin_rol_final}")
            
            # === RECOMENDACIONES ===
            print(f"\n💡 Recomendaciones:")
            if admins_final == 0:
                print("  ⚠️  CRÍTICO: No hay administradores. Crea uno manualmente.")
            elif admins_final == 1:
                print("  ✓ Hay 1 administrador (recomendado)")
            else:
                print(f"  ℹ️  Hay {admins_final} administradores")
            
            if asesores_final > 0:
                print(f"  ✓ Hay {asesores_final} asesor(es)/gerente(s)")
            
            print(f"\n🎉 ¡Corrección de roles completada exitosamente!")
            print(f"\n=== CREDENCIALES PARA PRUEBAS ===")
            print(f"Para crear usuarios de prueba, ejecuta: python create_test_user.py")

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
        
        # Información adicional para debugging
        import traceback
        print("\n📋 Información detallada del error:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()