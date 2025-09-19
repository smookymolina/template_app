#!/usr/bin/env python3
"""
Script para crear datos de ejemplo para la gestión jerárquica de gerentes.
Crea 3 gerentes con sus asesores y reclutas correspondientes.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta

def crear_gerentes_ejemplo():
    """Crea 3 gerentes de ejemplo con datos realistas"""

    gerentes_data = [
        {
            'email': 'gerente.norte@empresa.com',
            'password': 'gerente123',
            'nombre': 'Carlos Rodríguez',
            'telefono': '+52 555-0101',
            'rol': 'gerente'
        },
        {
            'email': 'gerente.centro@empresa.com',
            'password': 'gerente123',
            'nombre': 'María González',
            'telefono': '+52 555-0102',
            'rol': 'gerente'
        },
        {
            'email': 'gerente.sur@empresa.com',
            'password': 'gerente123',
            'nombre': 'Juan Martínez',
            'telefono': '+52 555-0103',
            'rol': 'gerente'
        }
    ]

    gerentes_creados = []

    for data in gerentes_data:
        # Verificar si el gerente ya existe
        gerente_existente = Usuario.query.filter_by(email=data['email']).first()
        if gerente_existente:
            print(f"Gerente {data['nombre']} ya existe")
            gerentes_creados.append(gerente_existente)
            continue

        gerente = Usuario(
            email=data['email'],
            nombre=data['nombre'],
            telefono=data['telefono'],
            rol=data['rol'],
            is_active=True
        )
        gerente.password = data['password']

        try:
            gerente.save()
            gerentes_creados.append(gerente)
            print(f"Gerente creado: {gerente.nombre} ({gerente.email})")
        except Exception as e:
            print(f"Error creando gerente {data['nombre']}: {e}")

    return gerentes_creados

def crear_asesores_ejemplo(gerentes):
    """Crea asesores de ejemplo asignados a cada gerente"""

    asesores_data = [
        # Asesores para Carlos Rodríguez (Gerente Norte)
        [
            {'email': 'asesor.norte1@empresa.com', 'nombre': 'Ana López', 'telefono': '+52 555-0201'},
            {'email': 'asesor.norte2@empresa.com', 'nombre': 'Luis Hernández', 'telefono': '+52 555-0202'},
            {'email': 'asesor.norte3@empresa.com', 'nombre': 'Carmen Silva', 'telefono': '+52 555-0203'}
        ],
        # Asesores para María González (Gerente Centro)
        [
            {'email': 'asesor.centro1@empresa.com', 'nombre': 'Roberto Vega', 'telefono': '+52 555-0204'},
            {'email': 'asesor.centro2@empresa.com', 'nombre': 'Patricia Ruiz', 'telefono': '+52 555-0205'}
        ],
        # Asesores para Juan Martínez (Gerente Sur)
        [
            {'email': 'asesor.sur1@empresa.com', 'nombre': 'Diego Torres', 'telefono': '+52 555-0206'},
            {'email': 'asesor.sur2@empresa.com', 'nombre': 'Elena Morales', 'telefono': '+52 555-0207'},
            {'email': 'asesor.sur3@empresa.com', 'nombre': 'Fernando Castro', 'telefono': '+52 555-0208'},
            {'email': 'asesor.sur4@empresa.com', 'nombre': 'Gabriela Ramos', 'telefono': '+52 555-0209'}
        ]
    ]

    asesores_creados = []

    for i, gerente in enumerate(gerentes):
        if i >= len(asesores_data):
            continue

        print(f"\nCreando asesores para {gerente.nombre}:")

        for asesor_data in asesores_data[i]:
            # Verificar si el asesor ya existe
            asesor_existente = Usuario.query.filter_by(email=asesor_data['email']).first()
            if asesor_existente:
                # Si existe, solo actualizar su gerente_id
                asesor_existente.gerente_id = gerente.id
                asesor_existente.save()
                print(f"  Asesor existente actualizado: {asesor_data['nombre']}")
                asesores_creados.append(asesor_existente)
                continue

            asesor = Usuario(
                email=asesor_data['email'],
                nombre=asesor_data['nombre'],
                telefono=asesor_data['telefono'],
                rol='asesor',
                gerente_id=gerente.id,
                is_active=True
            )
            asesor.password = 'asesor123'

            try:
                asesor.save()
                asesores_creados.append(asesor)
                print(f"  Asesor creado: {asesor.nombre} -> {gerente.nombre}")
            except Exception as e:
                print(f"  Error creando asesor {asesor_data['nombre']}: {e}")

    return asesores_creados

def crear_reclutas_ejemplo(asesores):
    """Crea reclutas de ejemplo asignados a cada asesor"""

    nombres_ejemplo = [
        'Andrea Jiménez', 'Miguel Vargas', 'Sofia Delgado', 'Alejandro Peña',
        'Valeria Mendoza', 'David Guerrero', 'Isabella Cruz', 'Santiago Flores',
        'Camila Herrera', 'Sebastián Aguilar', 'Natalia Reyes', 'Mateo Cortés',
        'Lucía Romero', 'Andrés Moreno', 'Victoria Sánchez', 'Daniel Molina',
        'Antonia Gutiérrez', 'Carlos Varela', 'Mariana Ortega', 'Felipe Díaz',
        'Emilia Castro', 'Nicolás Rivas', 'Julieta Campos', 'Tomás Navarro',
        'Renata León', 'Óscar Medina', 'Paloma Ríos', 'Iván Serrano'
    ]

    empleos_ejemplo = [
        'Desarrollador Frontend', 'Analista de Datos', 'Diseñador UX/UI',
        'Ingeniero de Software', 'Product Manager', 'Especialista en Marketing Digital',
        'Contador Público', 'Recursos Humanos', 'Vendedor Técnico',
        'Administrador de Base de Datos', 'Especialista en Ciberseguridad',
        'Coordinador de Proyectos', 'Analista Financiero', 'Desarrollador Backend'
    ]

    import random
    from datetime import datetime, timedelta

    reclutas_creados = []

    for asesor in asesores:
        # Crear entre 3 y 8 reclutas por asesor
        num_reclutas = random.randint(3, 8)

        print(f"\nCreando {num_reclutas} reclutas para {asesor.nombre}:")

        for i in range(num_reclutas):
            if not nombres_ejemplo:
                break

            nombre = nombres_ejemplo.pop(0)
            empleo = random.choice(empleos_ejemplo)

            # Generar fecha aleatoria en los últimos 30 días
            fecha_creacion = datetime.now() - timedelta(days=random.randint(1, 30))

            recluta = Recluta(
                nombre=nombre,
                puesto=empleo,
                telefono=f"+52 555-{random.randint(1000, 9999)}",
                email=f"{nombre.lower().replace(' ', '.')}@email.com",
                asesor_id=asesor.id,
                estado='activo'
            )

            try:
                db.session.add(recluta)
                db.session.commit()
                reclutas_creados.append(recluta)
                print(f"  Recluta creado: {nombre} - {empleo}")
            except Exception as e:
                print(f"  Error creando recluta {nombre}: {e}")
                db.session.rollback()

    return reclutas_creados

def main():
    """Función principal que ejecuta la creación de datos de ejemplo"""

    app = create_app()

    with app.app_context():
        print("Iniciando creacion de datos de ejemplo para Gestion de Gerentes...")
        print("=" * 70)

        # Paso 1: Crear gerentes
        print("\nPASO 1: Creando gerentes de ejemplo...")
        gerentes = crear_gerentes_ejemplo()

        if not gerentes:
            print("No se pudieron crear gerentes. Abortando...")
            return

        # Paso 2: Crear asesores
        print("\nPASO 2: Creando asesores de ejemplo...")
        asesores = crear_asesores_ejemplo(gerentes)

        # Paso 3: Crear reclutas
        print("\nPASO 3: Creando reclutas de ejemplo...")
        reclutas = crear_reclutas_ejemplo(asesores)

        # Resumen final
        print("\n" + "=" * 70)
        print("RESUMEN DE DATOS CREADOS:")
        print(f"Gerentes: {len(gerentes)}")
        print(f"Asesores: {len(asesores)}")
        print(f"Reclutas: {len(reclutas)}")

        print("\nESTRUCTURA JERARQUICA CREADA:")
        for gerente in gerentes:
            mis_asesores = gerente.get_mis_asesores()
            total_reclutas = gerente._count_reclutas_equipo(gerente.id)
            print(f"\n{gerente.nombre}")
            print(f"   Email: {gerente.email}")
            print(f"   Asesores: {len(mis_asesores)}")
            print(f"   Reclutas totales: {total_reclutas}")

            for asesor in mis_asesores:
                reclutas_asesor = Recluta.query.filter_by(asesor_id=asesor.id).count()
                print(f"      -> {asesor.nombre} ({reclutas_asesor} reclutas)")

        print("\nDatos de ejemplo creados exitosamente!")
        print("\nCREDENCIALES DE ACCESO:")
        print("   Gerentes: password = 'gerente123'")
        print("   Asesores: password = 'asesor123'")

if __name__ == "__main__":
    main()