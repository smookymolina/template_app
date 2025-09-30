#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para crear la tabla ficha_deposito en la base de datos
"""

import os
import sys
from app_factory import create_app
from models import db
from models.ficha_deposito import FichaDeposito
from sqlalchemy import inspect

def table_exists(table_name):
    """Verifica si una tabla existe en la base de datos"""
    app = create_app('development')
    with app.app_context():
        inspector = inspect(db.engine)
        return table_name in inspector.get_table_names()

def create_fichas_table():
    """Crea la tabla ficha_deposito si no existe"""
    try:
        print("Verificando tabla ficha_deposito...")

        if table_exists('ficha_deposito'):
            print("OK: La tabla ficha_deposito ya existe")
            return True

        print("Creando tabla ficha_deposito...")
        app = create_app('development')
        with app.app_context():
            # Crear solo la tabla de FichaDeposito
            FichaDeposito.__table__.create(db.engine, checkfirst=True)
            print("OK: Tabla ficha_deposito creada exitosamente")

            # Verificar que se creo correctamente
            inspector = inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('ficha_deposito')]
            print("Columnas creadas: {}".format(', '.join(columns)))

        return True

    except Exception as e:
        print("ERROR al crear tabla: {}".format(e))
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("CREANDO TABLA DE FICHAS DE DEPOSITO")
    print("=" * 50)

    # Cargar variables de entorno
    from dotenv import load_dotenv
    load_dotenv()

    if create_fichas_table():
        print("\n" + "=" * 50)
        print("EXITO: TABLA CREADA EXITOSAMENTE!")
        print("\nEstructura de la tabla:")
        print("   - id (PK)")
        print("   - fecha")
        print("   - nombre_depositante")
        print("   - banco")
        print("   - monto")
        print("   - gerente_id (FK)")
        print("   - created_at")
    else:
        print("\nERROR: No se pudo crear la tabla")
        print("Verifica tu conexion a la base de datos")