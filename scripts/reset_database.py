"""
Script para resetear la base de datos (eliminar y recrear tablas)
ADVERTENCIA: Este script ELIMINA todos los datos existentes

Ejecutar en el servidor: python scripts/reset_database.py

PASOS RECOMENDADOS:
1. Primero ejecutar: python scripts/export_data.py
2. Luego ejecutar: python scripts/reset_database.py
3. Finalmente ejecutar: python scripts/import_data.py backup_XXXXXX
"""
import os
import sys

# Agregar el directorio raiz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db

def reset_database():
    """Eliminar y recrear todas las tablas"""
    print("=" * 60)
    print("RESET DE BASE DE DATOS")
    print("=" * 60)
    print("\nADVERTENCIA: Este proceso eliminara TODOS los datos existentes.")
    print("Asegurate de haber ejecutado export_data.py antes de continuar.\n")

    confirm = input("Escriba 'CONFIRMAR' para continuar: ")
    if confirm != 'CONFIRMAR':
        print("Operacion cancelada.")
        sys.exit(0)

    # Crear aplicacion Flask
    app = create_app('production')

    with app.app_context():
        print("\n[1/3] Eliminando todas las tablas...")
        db.drop_all()
        print("Tablas eliminadas.")

        print("\n[2/3] Creando nuevas tablas...")
        db.create_all()
        print("Tablas creadas.")

        print("\n[3/3] Verificando estructura...")
        # Listar tablas creadas
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"Tablas en la base de datos: {', '.join(tables)}")

        print("\n" + "=" * 60)
        print("BASE DE DATOS RESETEADA EXITOSAMENTE")
        print("=" * 60)
        print("\nAhora puedes importar los datos con:")
        print("  python scripts/import_data.py backup_XXXXXX")
        print("=" * 60)

if __name__ == '__main__':
    reset_database()
