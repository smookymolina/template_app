"""
Script de diagnostico de base de datos
Ejecutar en el servidor: python scripts/diagnostico_db.py

Este script verifica:
1. Conexion a la base de datos
2. Tablas existentes vs tablas esperadas
3. Estructura de columnas
4. Relaciones y foreign keys
5. Posibles conflictos
"""
import os
import sys

# Agregar el directorio raiz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

def print_header(title):
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def print_ok(msg):
    print(f"  [OK] {msg}")

def print_warn(msg):
    print(f"  [WARN] {msg}")

def print_error(msg):
    print(f"  [ERROR] {msg}")

def main():
    print_header("DIAGNOSTICO DE BASE DE DATOS")

    # 1. Verificar importaciones
    print_header("1. VERIFICANDO IMPORTACIONES")
    try:
        from app_factory import create_app
        from models import db
        print_ok("app_factory y models importados correctamente")
    except Exception as e:
        print_error(f"Error importando modulos principales: {e}")
        return

    # Importar modelos individualmente para detectar errores
    models_status = {}
    model_imports = [
        ('Usuario', 'models.usuario', 'Usuario'),
        ('Recluta', 'models.recluta', 'Recluta'),
        ('Entrevista', 'models.entrevista', 'Entrevista'),
        ('EventoRecluta', 'models.evento_recluta', 'EventoRecluta'),
        ('FichaDeposito', 'models.ficha_deposito', 'FichaDeposito'),
        ('Documento', 'models.documento', 'Documento'),
        ('UserSession', 'models.user_session', 'UserSession'),
        ('UserSettings', 'models.user_settings', 'UserSettings'),
        ('Notification', 'models.notification', 'Notification'),
        ('TutorialAnalytics', 'models.tutorial_analytics', 'TutorialAnalytics'),
    ]

    for name, module, class_name in model_imports:
        try:
            mod = __import__(module, fromlist=[class_name])
            model_class = getattr(mod, class_name)
            models_status[name] = model_class
            print_ok(f"{name} importado correctamente")
        except Exception as e:
            print_error(f"{name}: {e}")
            models_status[name] = None

    # 2. Crear aplicacion y contexto
    print_header("2. CREANDO CONTEXTO DE APLICACION")
    try:
        app = create_app('production')
        print_ok(f"Aplicacion creada en modo production")
        print(f"     Database URI: {app.config['SQLALCHEMY_DATABASE_URI'][:50]}...")
    except Exception as e:
        print_error(f"Error creando aplicacion: {e}")
        return

    with app.app_context():
        # 3. Verificar conexion
        print_header("3. VERIFICANDO CONEXION A BASE DE DATOS")
        try:
            from sqlalchemy import text
            result = db.session.execute(text('SELECT 1'))
            print_ok("Conexion a base de datos exitosa")
        except Exception as e:
            print_error(f"No se puede conectar a la base de datos: {e}")
            return

        # 4. Listar tablas existentes en la BD
        print_header("4. TABLAS EXISTENTES EN LA BASE DE DATOS")
        try:
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            existing_tables = set(inspector.get_table_names())

            if existing_tables:
                for table in sorted(existing_tables):
                    print(f"     - {table}")
            else:
                print_warn("No hay tablas en la base de datos")
        except Exception as e:
            print_error(f"Error listando tablas: {e}")
            existing_tables = set()

        # 5. Tablas esperadas por los modelos
        print_header("5. TABLAS ESPERADAS POR LOS MODELOS")
        expected_tables = set()
        for name, model in models_status.items():
            if model:
                try:
                    table_name = model.__tablename__
                    expected_tables.add(table_name)
                    status = "EXISTE" if table_name in existing_tables else "FALTA"
                    symbol = "[OK]" if table_name in existing_tables else "[!!]"
                    print(f"     {symbol} {name} -> {table_name} ({status})")
                except Exception as e:
                    print_error(f"{name}: No se puede obtener __tablename__: {e}")

        # 6. Tablas faltantes
        print_header("6. ANALISIS DE DIFERENCIAS")
        missing_tables = expected_tables - existing_tables
        extra_tables = existing_tables - expected_tables

        if missing_tables:
            print_warn(f"Tablas FALTANTES en la BD ({len(missing_tables)}):")
            for t in sorted(missing_tables):
                print(f"       - {t}")
        else:
            print_ok("Todas las tablas esperadas existen")

        if extra_tables:
            print(f"  [INFO] Tablas adicionales en BD ({len(extra_tables)}):")
            for t in sorted(extra_tables):
                print(f"       - {t}")

        # 7. Verificar estructura de evento_recluta (la sospechosa)
        print_header("7. ESTRUCTURA DE TABLA evento_recluta")
        if 'evento_recluta' in existing_tables:
            try:
                columns = inspector.get_columns('evento_recluta')
                print("  Columnas:")
                for col in columns:
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    print(f"       - {col['name']}: {col['type']} ({nullable})")

                # Verificar foreign keys
                fks = inspector.get_foreign_keys('evento_recluta')
                print("\n  Foreign Keys:")
                if fks:
                    for fk in fks:
                        print(f"       - {fk['constrained_columns']} -> {fk['referred_table']}.{fk['referred_columns']}")
                else:
                    print_warn("No hay foreign keys definidas")

                # Verificar indices
                indexes = inspector.get_indexes('evento_recluta')
                print("\n  Indices:")
                if indexes:
                    for idx in indexes:
                        print(f"       - {idx['name']}: {idx['column_names']}")
                else:
                    print("       (ninguno)")

            except Exception as e:
                print_error(f"Error analizando evento_recluta: {e}")
        else:
            print_error("La tabla evento_recluta NO EXISTE")

        # 8. Verificar estructura de recluta
        print_header("8. ESTRUCTURA DE TABLA recluta")
        if 'recluta' in existing_tables:
            try:
                columns = inspector.get_columns('recluta')
                print("  Columnas:")
                for col in columns:
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    print(f"       - {col['name']}: {col['type']} ({nullable})")
            except Exception as e:
                print_error(f"Error analizando recluta: {e}")
        else:
            print_error("La tabla recluta NO EXISTE")

        # 9. Intentar consultas basicas
        print_header("9. PRUEBAS DE CONSULTAS BASICAS")

        test_queries = [
            ('Usuario', models_status.get('Usuario')),
            ('Recluta', models_status.get('Recluta')),
            ('EventoRecluta', models_status.get('EventoRecluta')),
            ('Entrevista', models_status.get('Entrevista')),
        ]

        for name, model in test_queries:
            if model:
                try:
                    count = model.query.count()
                    print_ok(f"{name}.query.count() = {count}")
                except Exception as e:
                    print_error(f"{name}: {e}")

        # 10. Verificar relaciones
        print_header("10. PRUEBA DE RELACIONES")
        try:
            Recluta = models_status.get('Recluta')
            EventoRecluta = models_status.get('EventoRecluta')

            if Recluta and EventoRecluta:
                # Obtener un recluta de prueba
                recluta = Recluta.query.first()
                if recluta:
                    print_ok(f"Recluta encontrado: ID={recluta.id}, Folio={recluta.folio}")

                    # Intentar acceder a eventos via relacion
                    try:
                        eventos_count = recluta.eventos.count()
                        print_ok(f"recluta.eventos.count() = {eventos_count}")
                    except Exception as e:
                        print_error(f"Error accediendo a recluta.eventos: {e}")

                    # Intentar acceder a entrevistas via relacion
                    try:
                        entrevistas_count = recluta.entrevistas.count()
                        print_ok(f"recluta.entrevistas.count() = {entrevistas_count}")
                    except Exception as e:
                        print_error(f"Error accediendo a recluta.entrevistas: {e}")
                else:
                    print_warn("No hay reclutas en la base de datos para probar relaciones")
        except Exception as e:
            print_error(f"Error en prueba de relaciones: {e}")

        # 11. Recomendaciones
        print_header("11. RECOMENDACIONES")

        if missing_tables:
            print("\n  Para crear las tablas faltantes, ejecuta:")
            print("    flask db upgrade")
            print("  O si no hay migraciones:")
            print("    python -c \"from app_factory import create_app; from models import db; app = create_app('production'); app.app_context().push(); db.create_all()\"")

        if 'TutorialAnalytics' not in [m for m, c in models_status.items() if c]:
            print("\n  NOTA: TutorialAnalytics no esta importado en models/__init__.py")
            print("  Esto puede causar que la tabla no se cree automaticamente.")

        print("\n  Si el problema persiste, considera:")
        print("    1. Ejecutar: python scripts/export_data.py")
        print("    2. Ejecutar: python scripts/reset_database.py")
        print("    3. Ejecutar: python scripts/import_data.py <backup_dir>")

        print("\n" + "=" * 60)
        print(" DIAGNOSTICO COMPLETADO")
        print("=" * 60)

if __name__ == '__main__':
    main()
