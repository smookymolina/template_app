"""Utility script to create temporary accounts for manual testing."""

import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta

def ensure_user(email, nombre, rol, password, telefono=None):
    user = Usuario.query.filter_by(email=email).first()
    created = False
    if not user:
        user = Usuario(
            email=email,
            nombre=nombre,
            rol=rol,
            telefono=telefono,
            is_active=True
        )
        user.password = password
        db.session.add(user)
        created = True
    return user, created

def ensure_recluta(data, asesor):
    recluta = Recluta.query.filter_by(email=data['email']).first()
    created = False
    if not recluta:
        recluta = Recluta(
            nombre=data['nombre'],
            email=data['email'],
            telefono=data['telefono'],
            estado=data['estado'],
            puesto=data.get('puesto'),
            notas=data.get('notas'),
            asesor_id=asesor.id if asesor else None
        )
        db.session.add(recluta)
        created = True
    else:
        if asesor and recluta.asesor_id != asesor.id:
            recluta.asesor_id = asesor.id
    return recluta, created

def main():
    app = create_app()
    with app.app_context():
        db.create_all()

        accounts = [
            {
                'email': 'admin.temp@example.com',
                'nombre': 'Admin Temporal',
                'rol': 'admin',
                'password': 'TemporalAdmin!1',
                'telefono': '555-0100'
            },
            {
                'email': 'gerente.temp@example.com',
                'nombre': 'Gerente Temporal',
                'rol': 'gerente',
                'password': 'TemporalGerente!1',
                'telefono': '555-0200'
            },
            {
                'email': 'asesor.temp@example.com',
                'nombre': 'Asesor Temporal',
                'rol': 'asesor',
                'password': 'TemporalAsesor!1',
                'telefono': '555-0300'
            }
        ]

        created_users = []
        for account in accounts:
            user, created = ensure_user(
                email=account['email'],
                nombre=account['nombre'],
                rol=account['rol'],
                password=account['password'],
                telefono=account['telefono']
            )
            created_users.append({
                'user': user,
                'created': created,
                'password': account['password']
            })

        gerente = next((item['user'] for item in created_users if item['user'].rol == 'gerente'), None)
        asesor = next((item['user'] for item in created_users if item['user'].rol == 'asesor'), None)

        if asesor and gerente and asesor.gerente_id != gerente.id:
            asesor.gerente_id = gerente.id

        db.session.commit()

        reclutas_data = [
            {
                'nombre': 'Recluta Demo 1',
                'email': 'recluta.demo1@example.com',
                'telefono': '555-1001',
                'estado': 'En proceso',
                'puesto': 'Ejecutivo de ventas',
                'notas': 'Generado para pruebas del flujo principal.'
            },
            {
                'nombre': 'Recluta Demo 2',
                'email': 'recluta.demo2@example.com',
                'telefono': '555-1002',
                'estado': 'En proceso',
                'puesto': 'Analista de datos',
                'notas': 'Incluido para validar filtros y asignaciones.'
            },
            {
                'nombre': 'Recluta Demo 3',
                'email': 'recluta.demo3@example.com',
                'telefono': '555-1003',
                'estado': 'Activo',
                'puesto': 'Disenador UX',
                'notas': 'Cuenta activa para escenarios de entrevistas.'
            },
            {
                'nombre': 'Recluta Demo 4',
                'email': 'recluta.demo4@example.com',
                'telefono': '555-1004',
                'estado': 'Rechazado',
                'puesto': 'Desarrollador Backend',
                'notas': 'Util para probar cambios de estado.'
            },
            {
                'nombre': 'Recluta Demo 5',
                'email': 'recluta.demo5@example.com',
                'telefono': '555-1005',
                'estado': 'En proceso',
                'puesto': 'Coordinador de reclutamiento',
                'notas': 'Ejemplo con seguimiento extendido.'
            }
        ]

        created_reclutas = []
        for data in reclutas_data:
            recluta, created = ensure_recluta(data, asesor)
            created_reclutas.append({
                'recluta': recluta,
                'created': created
            })

        db.session.commit()

        print('Usuarios temporales generados:')
        for item in created_users:
            user = item['user']
            status = 'CREADO' if item['created'] else 'EXISTENTE'
            password_info = item['password'] if item['created'] else 'sin cambios'
            print(f" - {user.rol.upper()}: {user.email} ({status}) | password: {password_info}")

        print('\nReclutas temporales generados:')
        for item in created_reclutas:
            recluta = item['recluta']
            status = 'CREADO' if item['created'] else 'EXISTENTE'
            print(f" - {recluta.nombre} ({recluta.email}) [{status}] asignado a asesor_id={recluta.asesor_id}")

if __name__ == '__main__':
    main()