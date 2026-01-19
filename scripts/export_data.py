"""
Script para exportar todos los datos de la base de datos a CSV
Ejecutar en el servidor: python scripts/export_data.py
"""
import os
import sys
import csv
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta
from models.entrevista import Entrevista
from models.evento_recluta import EventoRecluta
from models.ficha_deposito import FichaDeposito

def create_export_dir():
    """Crear directorio para exportaciones"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    export_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), f'backup_{timestamp}')
    os.makedirs(export_dir, exist_ok=True)
    print(f"Directorio de exportacion: {export_dir}")
    return export_dir

def export_usuarios(export_dir):
    """Exportar tabla usuarios"""
    filepath = os.path.join(export_dir, 'usuarios.csv')
    usuarios = Usuario.query.all()

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Header
        writer.writerow([
            'id', 'email', 'password_hash', 'nombre', 'telefono',
            'foto_url', 'rol', 'is_active', 'created_at', 'last_login', 'gerente_id'
        ])
        # Data
        for u in usuarios:
            writer.writerow([
                u.id, u.email, u.password_hash, u.nombre, u.telefono,
                u.foto_url, u.rol, u.is_active,
                u.created_at.isoformat() if u.created_at else '',
                u.last_login.isoformat() if u.last_login else '',
                u.gerente_id or ''
            ])

    print(f"Exportados {len(usuarios)} usuarios -> {filepath}")
    return len(usuarios)

def export_reclutas(export_dir):
    """Exportar tabla reclutas"""
    filepath = os.path.join(export_dir, 'reclutas.csv')
    reclutas = Recluta.query.all()

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Header
        writer.writerow([
            'id', 'nombre', 'email', 'telefono', 'estado', 'puesto',
            'notas', 'folio', 'foto_url', 'fecha_registro',
            'ultima_actualizacion', 'asesor_id'
        ])
        # Data
        for r in reclutas:
            writer.writerow([
                r.id, r.nombre, r.email, r.telefono, r.estado, r.puesto,
                r.notas, r.folio, r.foto_url,
                r.fecha_registro.isoformat() if r.fecha_registro else '',
                r.ultima_actualizacion.isoformat() if r.ultima_actualizacion else '',
                r.asesor_id or ''
            ])

    print(f"Exportados {len(reclutas)} reclutas -> {filepath}")
    return len(reclutas)

def export_entrevistas(export_dir):
    """Exportar tabla entrevistas"""
    filepath = os.path.join(export_dir, 'entrevistas.csv')
    entrevistas = Entrevista.query.all()

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Header
        writer.writerow([
            'id', 'recluta_id', 'fecha', 'hora', 'duracion', 'tipo',
            'ubicacion', 'notas', 'estado', 'fecha_creacion', 'ultima_actualizacion'
        ])
        # Data
        for e in entrevistas:
            writer.writerow([
                e.id, e.recluta_id,
                e.fecha.isoformat() if e.fecha else '',
                e.hora, e.duracion, e.tipo, e.ubicacion, e.notas, e.estado,
                e.fecha_creacion.isoformat() if e.fecha_creacion else '',
                e.ultima_actualizacion.isoformat() if e.ultima_actualizacion else ''
            ])

    print(f"Exportadas {len(entrevistas)} entrevistas -> {filepath}")
    return len(entrevistas)

def export_eventos(export_dir):
    """Exportar tabla evento_recluta"""
    filepath = os.path.join(export_dir, 'eventos_recluta.csv')
    eventos = EventoRecluta.query.all()

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Header
        writer.writerow([
            'id', 'recluta_id', 'fecha', 'estado', 'titulo',
            'descripcion', 'fecha_creacion', 'ultima_actualizacion'
        ])
        # Data
        for ev in eventos:
            writer.writerow([
                ev.id, ev.recluta_id,
                ev.fecha.isoformat() if ev.fecha else '',
                ev.estado, ev.titulo, ev.descripcion,
                ev.fecha_creacion.isoformat() if ev.fecha_creacion else '',
                ev.ultima_actualizacion.isoformat() if ev.ultima_actualizacion else ''
            ])

    print(f"Exportados {len(eventos)} eventos -> {filepath}")
    return len(eventos)

def export_fichas(export_dir):
    """Exportar tabla ficha_deposito"""
    filepath = os.path.join(export_dir, 'fichas_deposito.csv')
    fichas = FichaDeposito.query.all()

    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Header
        writer.writerow([
            'id', 'fecha', 'nombre_depositante', 'banco',
            'monto', 'gerente_id', 'created_at'
        ])
        # Data
        for fi in fichas:
            writer.writerow([
                fi.id,
                fi.fecha.isoformat() if fi.fecha else '',
                fi.nombre_depositante, fi.banco, float(fi.monto),
                fi.gerente_id,
                fi.created_at.isoformat() if fi.created_at else ''
            ])

    print(f"Exportadas {len(fichas)} fichas -> {filepath}")
    return len(fichas)

def main():
    """Funcion principal de exportacion"""
    print("=" * 60)
    print("EXPORTACION DE BASE DE DATOS")
    print("=" * 60)

    # Crear aplicacion Flask
    app = create_app('production')

    with app.app_context():
        # Crear directorio de exportacion
        export_dir = create_export_dir()

        # Exportar todas las tablas
        totals = {
            'usuarios': export_usuarios(export_dir),
            'reclutas': export_reclutas(export_dir),
            'entrevistas': export_entrevistas(export_dir),
            'eventos': export_eventos(export_dir),
            'fichas': export_fichas(export_dir)
        }

        print("\n" + "=" * 60)
        print("RESUMEN DE EXPORTACION")
        print("=" * 60)
        for tabla, count in totals.items():
            print(f"  {tabla}: {count} registros")
        print(f"\nArchivos guardados en: {export_dir}")
        print("=" * 60)

if __name__ == '__main__':
    main()
