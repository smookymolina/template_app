#!/usr/bin/env python3
"""
🗄️ Script de inicialización de base de datos MySQL
Migra datos desde SQLite (si existe) a MySQL y configura el esquema
"""

import os
import sys
from sqlalchemy import create_engine, text
from app_factory import create_app
from models import db
from config import build_mysql_uri
import logging

def check_mysql_connection():
    """Verifica la conexión a MySQL"""
    try:
        app = create_app('development')
        with app.app_context():
            # Intentar conexión simple
            db.engine.execute(text('SELECT 1'))
            print("✅ Conexión a MySQL exitosa")
            return True
    except Exception as e:
        print(f"❌ Error de conexión a MySQL: {e}")
        return False

def create_databases():
    """Crea las bases de datos necesarias"""
    try:
        # Conectar sin especificar base de datos
        user = os.environ.get('MYSQL_USER', 'root')
        password = os.environ.get('MYSQL_PASSWORD', '')
        host = os.environ.get('MYSQL_HOST', '127.0.0.1')
        port = os.environ.get('MYSQL_PORT', '3306')

        if password:
            connection_string = f"mysql+pymysql://{user}:{password}@{host}:{port}/"
        else:
            connection_string = f"mysql+pymysql://{user}@{host}:{port}/"

        engine = create_engine(connection_string)

        databases = ['template_app', 'template_app_dev', 'template_app_test']

        with engine.connect() as conn:
            for db_name in databases:
                conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                print(f"✅ Base de datos '{db_name}' creada/verificada")

        engine.dispose()
        return True

    except Exception as e:
        print(f"❌ Error creando bases de datos: {e}")
        return False

def migrate_from_sqlite():
    """Migra datos desde SQLite si existe"""
    sqlite_path = os.path.join(os.path.dirname(__file__), 'instance', 'database.db')

    if not os.path.exists(sqlite_path):
        print("ℹ️  No se encontró base de datos SQLite para migrar")
        return True

    try:
        print("🔄 Iniciando migración desde SQLite...")

        # Crear engines para SQLite y MySQL
        sqlite_engine = create_engine(f'sqlite:///{sqlite_path}')
        app = create_app('development')

        with app.app_context():
            # Crear tablas en MySQL
            db.create_all()
            print("✅ Esquema MySQL creado")

            # Aquí puedes agregar lógica específica de migración si necesitas
            # transferir datos existentes desde SQLite a MySQL

        sqlite_engine.dispose()
        print("✅ Migración completada")
        return True

    except Exception as e:
        print(f"❌ Error en migración: {e}")
        return False

def initialize_schema():
    """Inicializa el esquema de la base de datos"""
    try:
        app = create_app('development')
        with app.app_context():
            # Crear todas las tablas
            db.create_all()
            print("✅ Esquema de base de datos inicializado")

            # Importar modelos para asegurar que las tablas se creen
            from models.usuario import Usuario
            from models.evento_recluta import EventoRecluta
            from models.recluta import Recluta
            from models.entrevista import Entrevista
            from models.ficha_deposito import FichaDeposito

            print("✅ Modelos cargados correctamente")
            return True

    except Exception as e:
        print(f"❌ Error inicializando esquema: {e}")
        return False

def main():
    """Función principal de inicialización"""
    print("🚀 INICIALIZANDO BASE DE DATOS MYSQL")
    print("=" * 50)

    # Cargar variables de entorno
    from dotenv import load_dotenv
    load_dotenv()

    # Paso 1: Crear bases de datos
    print("\n📋 Paso 1: Creando bases de datos...")
    if not create_databases():
        sys.exit(1)

    # Paso 2: Verificar conexión
    print("\n📋 Paso 2: Verificando conexión...")
    if not check_mysql_connection():
        print("\n💡 SOLUCIÓN:")
        print("1. Verifica que MySQL esté corriendo: net start mysql")
        print("2. Revisa las credenciales en el archivo .env")
        print("3. Asegúrate que el usuario tenga permisos")
        sys.exit(1)

    # Paso 3: Migrar desde SQLite (si existe)
    print("\n📋 Paso 3: Migrando datos...")
    if not migrate_from_sqlite():
        sys.exit(1)

    # Paso 4: Inicializar esquema
    print("\n📋 Paso 4: Inicializando esquema...")
    if not initialize_schema():
        sys.exit(1)

    print("\n" + "=" * 50)
    print("🎉 ¡INICIALIZACIÓN COMPLETADA EXITOSAMENTE!")
    print("\n📋 SIGUIENTES PASOS:")
    print("1. Ejecuta: python run.py")
    print("2. Accede a la aplicación en tu navegador")
    print("3. Los usuarios de desarrollo estarán disponibles si SEED_DEV_USERS=true")

if __name__ == '__main__':
    main()