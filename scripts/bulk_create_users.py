"""
Utility script to create a large number of accounts for testing purposes.
"""

import os
import sys
from sqlalchemy.exc import OperationalError
from sqlalchemy import inspect

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta

def ensure_user(email, nombre, rol, password, telefono=None, gerente_id=None):
    user = Usuario.query.filter_by(email=email).first()
    created = False
    if not user:
        user = Usuario(
            email=email,
            nombre=nombre,
            rol=rol,
            telefono=telefono,
            is_active=True,
            gerente_id=gerente_id
        )
        user.password = password
        db.session.add(user)
        created = True
    elif gerente_id and user.gerente_id != gerente_id:
        user.gerente_id = gerente_id

    return user, created

def ensure_recluta(data, asesor):
    recluta = Recluta.query.filter_by(email=data['email']).first()
    created = False
    if not recluta:
        recluta = Recluta(
            nombre=data['nombre'],
            email=data['email'],
            telefono=data['telefono'],
            estado='En proceso',
            puesto='Candidato General',
            notas='Generado por script de bulk creation.',
            asesor_id=asesor.id if asesor else None
        )
        db.session.add(recluta)
        created = True
    else:
        if asesor and recluta.asesor_id != asesor.id:
            recluta.asesor_id = asesor.id
    return recluta, created

def ensure_schema_ready():
    inspector = inspect(db.engine)
    required_tables = (Usuario.__tablename__, Recluta.__tablename__)
    missing_tables = [table for table in required_tables if not inspector.has_table(table)]
    if missing_tables:
        tables = ', '.join(missing_tables)
        raise RuntimeError(
            f'Las tablas requeridas no están disponibles ({tables}). ' 
            'Ejecuta las migraciones o inicializa la base de datos antes de usar este script.'
        )

def main():
    app = create_app()
    with app.app_context():
        try:
            ensure_schema_ready()
        except OperationalError as exc:
            print('No se pudo conectar a la base de datos. Verifica la configuración y que la base exista antes de continuar.')
            raise SystemExit(1) from exc
        except RuntimeError as exc:
            print(str(exc))
            raise SystemExit(1)

        num_gerentes = 5
        num_asesores_por_gerente = 5
        num_reclutas_por_asesor = 5

        for i in range(1, num_gerentes + 1):
            gerente_email = f'gerente{i}@example.com'
            gerente_nombre = f'Gerente {i}'
            gerente, g_created = ensure_user(gerente_email, gerente_nombre, 'gerente', 'Password123!')
            if g_created:
                print(f"Gerente CREADO: {gerente_nombre} ({gerente_email})")
            else:
                print(f"Gerente EXISTENTE: {gerente_nombre} ({gerente_email})")

            db.session.flush() # Flush to get gerente.id for asesores

            for j in range(1, num_asesores_por_gerente + 1):
                asesor_num = (i - 1) * num_asesores_por_gerente + j
                asesor_email = f'asesor{asesor_num}@example.com'
                asesor_nombre = f'Asesor {asesor_num} (Gerente {i})'
                asesor, a_created = ensure_user(asesor_email, asesor_nombre, 'asesor', 'Password123!', gerente_id=gerente.id)
                if a_created:
                    print(f"  Asesor CREADO: {asesor_nombre} ({asesor_email})")
                else:
                    print(f"  Asesor EXISTENTE: {asesor_nombre} ({asesor_email})")

                db.session.flush() # Flush to get asesor.id for reclutas

                for k in range(1, num_reclutas_por_asesor + 1):
                    recluta_num = (asesor_num - 1) * num_reclutas_por_asesor + k
                    recluta_data = {
                        'nombre': f'Recluta {recluta_num}',
                        'email': f'recluta{recluta_num}@example.com',
                        'telefono': f'555-2000-{recluta_num:04d}',
                    }
                    recluta, r_created = ensure_recluta(recluta_data, asesor)
                    if r_created:
                        print(f"    Recluta CREADO: {recluta.nombre} ({recluta.email})")
                    else:
                        print(f"    Recluta EXISTENTE: {recluta.nombre} ({recluta.email})")

        print("\nCommit final a la base de datos...")
        db.session.commit()
        print("¡Proceso completado!")

if __name__ == '__main__':
    main()
