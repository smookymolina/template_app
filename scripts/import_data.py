"""
Script para importar datos desde CSV a la base de datos
Ejecutar en el servidor: python scripts/import_data.py <directorio_backup>

Ejemplo: python scripts/import_data.py backup_20260119_120000
"""
import os
import sys
import csv
from datetime import datetime
from decimal import Decimal

# Agregar el directorio raiz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta
from models.entrevista import Entrevista
from models.evento_recluta import EventoRecluta
from models.ficha_deposito import FichaDeposito

def parse_datetime(value):
    """Parsear datetime desde string ISO"""
    if not value or value == '':
        return None
    try:
        return datetime.fromisoformat(value)
    except:
        return None

def parse_date(value):
    """Parsear date desde string ISO"""
    if not value or value == '':
        return None
    try:
        return datetime.fromisoformat(value).date()
    except:
        return None

def parse_int(value):
    """Parsear int desde string"""
    if not value or value == '':
        return None
    try:
        return int(value)
    except:
        return None

def parse_bool(value):
    """Parsear boolean desde string"""
    if isinstance(value, bool):
        return value
    if not value or value == '':
        return True
    return str(value).lower() in ('true', '1', 'yes', 'si')

def parse_decimal(value):
    """Parsear Decimal desde string"""
    if not value or value == '':
        return Decimal('0')
    try:
        return Decimal(str(value))
    except:
        return Decimal('0')

def import_usuarios(backup_dir):
    """Importar usuarios desde CSV"""
    filepath = os.path.join(backup_dir, 'usuarios.csv')
    if not os.path.exists(filepath):
        print(f"Archivo no encontrado: {filepath}")
        return 0

    count = 0
    id_mapping = {}  # Mapeo de ID viejo a nuevo

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        # Primera pasada: crear usuarios sin gerente_id
        usuarios_data = list(reader)

        for row in usuarios_data:
            # Verificar si ya existe por email
            existing = Usuario.query.filter_by(email=row['email']).first()
            if existing:
                id_mapping[row['id']] = existing.id
                print(f"  Usuario ya existe: {row['email']} (ID: {existing.id})")
                continue

            usuario = Usuario(
                email=row['email'],
                password_hash=row['password_hash'],
                nombre=row['nombre'] or None,
                telefono=row['telefono'] or None,
                foto_url=row['foto_url'] or None,
                rol=row['rol'] or 'asesor',
                is_active=parse_bool(row['is_active']),
                created_at=parse_datetime(row['created_at']),
                last_login=parse_datetime(row['last_login']),
                gerente_id=None  # Se actualiza despues
            )
            db.session.add(usuario)
            db.session.flush()  # Obtener ID generado
            id_mapping[row['id']] = usuario.id
            count += 1

        db.session.commit()

        # Segunda pasada: actualizar gerente_id
        for row in usuarios_data:
            if row['gerente_id'] and row['gerente_id'] != '':
                old_gerente_id = row['gerente_id']
                new_gerente_id = id_mapping.get(old_gerente_id)
                new_user_id = id_mapping.get(row['id'])

                if new_gerente_id and new_user_id:
                    usuario = Usuario.query.get(new_user_id)
                    if usuario:
                        usuario.gerente_id = new_gerente_id

        db.session.commit()

    print(f"Importados {count} usuarios nuevos")
    return count, id_mapping

def import_reclutas(backup_dir, usuario_mapping):
    """Importar reclutas desde CSV"""
    filepath = os.path.join(backup_dir, 'reclutas.csv')
    if not os.path.exists(filepath):
        print(f"Archivo no encontrado: {filepath}")
        return 0, {}

    count = 0
    id_mapping = {}

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Verificar si ya existe por folio
            existing = Recluta.query.filter_by(folio=row['folio']).first()
            if existing:
                id_mapping[row['id']] = existing.id
                print(f"  Recluta ya existe: {row['folio']} (ID: {existing.id})")
                continue

            # Mapear asesor_id al nuevo ID
            new_asesor_id = None
            if row['asesor_id'] and row['asesor_id'] != '':
                new_asesor_id = usuario_mapping.get(row['asesor_id'])

            recluta = Recluta(
                nombre=row['nombre'],
                email=row['email'],
                telefono=row['telefono'],
                estado=row['estado'],
                puesto=row['puesto'] or None,
                notas=row['notas'] or None,
                folio=row['folio'],
                foto_url=row['foto_url'] or None,
                fecha_registro=parse_datetime(row['fecha_registro']),
                ultima_actualizacion=parse_datetime(row['ultima_actualizacion']),
                asesor_id=new_asesor_id
            )
            db.session.add(recluta)
            db.session.flush()
            id_mapping[row['id']] = recluta.id
            count += 1

    db.session.commit()
    print(f"Importados {count} reclutas nuevos")
    return count, id_mapping

def import_entrevistas(backup_dir, recluta_mapping):
    """Importar entrevistas desde CSV"""
    filepath = os.path.join(backup_dir, 'entrevistas.csv')
    if not os.path.exists(filepath):
        print(f"Archivo no encontrado: {filepath}")
        return 0

    count = 0

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Mapear recluta_id al nuevo ID
            new_recluta_id = recluta_mapping.get(row['recluta_id'])
            if not new_recluta_id:
                print(f"  Saltando entrevista: recluta_id {row['recluta_id']} no encontrado")
                continue

            entrevista = Entrevista(
                recluta_id=new_recluta_id,
                fecha=parse_date(row['fecha']),
                hora=row['hora'],
                duracion=parse_int(row['duracion']) or 60,
                tipo=row['tipo'] or 'presencial',
                ubicacion=row['ubicacion'] or None,
                notas=row['notas'] or None,
                estado=row['estado'] or 'pendiente',
                fecha_creacion=parse_datetime(row['fecha_creacion']),
                ultima_actualizacion=parse_datetime(row['ultima_actualizacion'])
            )
            db.session.add(entrevista)
            count += 1

    db.session.commit()
    print(f"Importadas {count} entrevistas")
    return count

def import_eventos(backup_dir, recluta_mapping):
    """Importar eventos de recluta desde CSV"""
    filepath = os.path.join(backup_dir, 'eventos_recluta.csv')
    if not os.path.exists(filepath):
        print(f"Archivo no encontrado: {filepath}")
        return 0

    count = 0

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Mapear recluta_id al nuevo ID
            new_recluta_id = recluta_mapping.get(row['recluta_id'])
            if not new_recluta_id:
                print(f"  Saltando evento: recluta_id {row['recluta_id']} no encontrado")
                continue

            evento = EventoRecluta(
                recluta_id=new_recluta_id,
                fecha=parse_date(row['fecha']),
                estado=row['estado'] or 'pending',
                titulo=row['titulo'],
                descripcion=row['descripcion'] or None,
                fecha_creacion=parse_datetime(row['fecha_creacion']),
                ultima_actualizacion=parse_datetime(row['ultima_actualizacion'])
            )
            db.session.add(evento)
            count += 1

    db.session.commit()
    print(f"Importados {count} eventos")
    return count

def import_fichas(backup_dir, usuario_mapping):
    """Importar fichas de deposito desde CSV"""
    filepath = os.path.join(backup_dir, 'fichas_deposito.csv')
    if not os.path.exists(filepath):
        print(f"Archivo no encontrado: {filepath}")
        return 0

    count = 0

    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            # Mapear gerente_id al nuevo ID
            new_gerente_id = usuario_mapping.get(row['gerente_id'])
            if not new_gerente_id:
                print(f"  Saltando ficha: gerente_id {row['gerente_id']} no encontrado")
                continue

            ficha = FichaDeposito(
                fecha=parse_datetime(row['fecha']),
                nombre_depositante=row['nombre_depositante'],
                banco=row['banco'],
                monto=parse_decimal(row['monto']),
                gerente_id=new_gerente_id,
                created_at=parse_datetime(row['created_at'])
            )
            db.session.add(ficha)
            count += 1

    db.session.commit()
    print(f"Importadas {count} fichas")
    return count

def main():
    """Funcion principal de importacion"""
    if len(sys.argv) < 2:
        print("Uso: python scripts/import_data.py <directorio_backup>")
        print("Ejemplo: python scripts/import_data.py backup_20260119_120000")
        sys.exit(1)

    backup_dir = sys.argv[1]

    # Si es ruta relativa, buscar en el directorio del proyecto
    if not os.path.isabs(backup_dir):
        backup_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), backup_dir)

    if not os.path.exists(backup_dir):
        print(f"Error: Directorio no encontrado: {backup_dir}")
        sys.exit(1)

    print("=" * 60)
    print("IMPORTACION DE BASE DE DATOS")
    print(f"Desde: {backup_dir}")
    print("=" * 60)

    # Crear aplicacion Flask
    app = create_app('production')

    with app.app_context():
        # Importar en orden de dependencias
        print("\n[1/5] Importando usuarios...")
        usuarios_count, usuario_mapping = import_usuarios(backup_dir)

        print("\n[2/5] Importando reclutas...")
        reclutas_count, recluta_mapping = import_reclutas(backup_dir, usuario_mapping)

        print("\n[3/5] Importando entrevistas...")
        entrevistas_count = import_entrevistas(backup_dir, recluta_mapping)

        print("\n[4/5] Importando eventos...")
        eventos_count = import_eventos(backup_dir, recluta_mapping)

        print("\n[5/5] Importando fichas...")
        fichas_count = import_fichas(backup_dir, usuario_mapping)

        print("\n" + "=" * 60)
        print("RESUMEN DE IMPORTACION")
        print("=" * 60)
        print(f"  Usuarios: {usuarios_count}")
        print(f"  Reclutas: {reclutas_count}")
        print(f"  Entrevistas: {entrevistas_count}")
        print(f"  Eventos: {eventos_count}")
        print(f"  Fichas: {fichas_count}")
        print("=" * 60)

if __name__ == '__main__':
    main()
