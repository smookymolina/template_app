#!/usr/bin/env python3
"""
Script para crear algunos reclutas de ejemplo para pruebas.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta

def crear_reclutas_ejemplo():
    """Crea algunos reclutas de ejemplo para probar funcionalidades"""

    # Obtener asesores para asignar reclutas
    asesores = Usuario.query.filter_by(rol='asesor', is_active=True).all()

    if not asesores:
        print("No hay asesores disponibles para asignar reclutas")
        return []

    reclutas_data = [
        {
            'nombre': 'Juan Perez',
            'email': 'juan.perez@email.com',
            'telefono': '+52 555-1001',
            'puesto': 'Desarrollador Frontend',
            'estado': 'activo'
        },
        {
            'nombre': 'Maria Lopez',
            'email': 'maria.lopez@email.com',
            'telefono': '+52 555-1002',
            'puesto': 'Disenadora UX/UI',
            'estado': 'activo'
        },
        {
            'nombre': 'Carlos Torres',
            'email': 'carlos.torres@email.com',
            'telefono': '+52 555-1003',
            'puesto': 'Analista de Datos',
            'estado': 'activo'
        },
        {
            'nombre': 'Sofia Ramirez',
            'email': 'sofia.ramirez@email.com',
            'telefono': '+52 555-1004',
            'puesto': 'Product Manager',
            'estado': 'en proceso'
        },
        {
            'nombre': 'Diego Morales',
            'email': 'diego.morales@email.com',
            'telefono': '+52 555-1005',
            'puesto': 'Ingeniero Backend',
            'estado': 'activo'
        },
        {
            'nombre': 'Fernanda Silva',
            'email': 'fernanda.silva@email.com',
            'telefono': '+52 555-1006',
            'puesto': 'Especialista en Marketing',
            'estado': 'activo'
        }
    ]

    reclutas_creados = []

    print("Creando reclutas de ejemplo...")

    for i, data in enumerate(reclutas_data):
        try:
            # Asignar al asesor de forma circular
            asesor = asesores[i % len(asesores)]

            recluta = Recluta(
                nombre=data['nombre'],
                email=data['email'],
                telefono=data['telefono'],
                puesto=data['puesto'],
                estado=data['estado'],
                asesor_id=asesor.id
            )

            db.session.add(recluta)
            db.session.commit()

            reclutas_creados.append(recluta)
            print(f"  - {data['nombre']} -> {asesor.nombre}")

        except Exception as e:
            print(f"  - Error creando recluta {data['nombre']}: {e}")
            db.session.rollback()

    return reclutas_creados

def main():
    """Función principal"""

    app = create_app()

    with app.app_context():
        print("=" * 50)
        print("CREANDO RECLUTAS DE EJEMPLO")
        print("=" * 50)

        reclutas = crear_reclutas_ejemplo()

        print(f"\nReclutas creados exitosamente: {len(reclutas)}")

if __name__ == "__main__":
    main()