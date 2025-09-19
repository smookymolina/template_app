#!/usr/bin/env python3
"""
Script para limpiar completamente la base de datos y crear usuarios específicos para pruebas.
Crea: 2 administradores, 2 gerentes, 2 asesores.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta
from models.entrevista import Entrevista
from models.evento_recluta import EventoRecluta
from models.documento import Documento
from models.user_session import UserSession
from models.user_settings import UserSettings
from models.tutorial_analytics import TutorialAnalytics

def limpiar_base_datos():
    """Elimina todos los datos de todas las tablas"""

    try:
        print("Iniciando limpieza completa de la base de datos...")

        # Orden de eliminación para respetar las claves foráneas
        tablas_orden = [
            TutorialAnalytics,
            UserSession,
            UserSettings,
            Documento,
            EventoRecluta,
            Entrevista,
            Recluta,
            Usuario
        ]

        for tabla in tablas_orden:
            try:
                count = tabla.query.count()
                if count > 0:
                    tabla.query.delete()
                    print(f"  - Eliminados {count} registros de {tabla.__tablename__}")
                else:
                    print(f"  - Tabla {tabla.__tablename__} ya estaba vacía")
            except Exception as e:
                print(f"  - Error eliminando {tabla.__tablename__}: {e}")

        db.session.commit()
        print("Base de datos limpiada exitosamente")
        return True

    except Exception as e:
        print(f"Error durante la limpieza: {e}")
        db.session.rollback()
        return False

def crear_usuarios_prueba():
    """Crea usuarios específicos para pruebas"""

    usuarios_data = [
        # 2 Administradores
        {
            'email': 'admin1@empresa.com',
            'password': 'admin123',
            'nombre': 'Administrador Principal',
            'telefono': '+52 555-0001',
            'rol': 'admin'
        },
        {
            'email': 'admin2@empresa.com',
            'password': 'admin123',
            'nombre': 'Administrador Secundario',
            'telefono': '+52 555-0002',
            'rol': 'admin'
        },

        # 2 Gerentes
        {
            'email': 'gerente1@empresa.com',
            'password': 'gerente123',
            'nombre': 'María Fernández',
            'telefono': '+52 555-0101',
            'rol': 'gerente'
        },
        {
            'email': 'gerente2@empresa.com',
            'password': 'gerente123',
            'nombre': 'Carlos Mendoza',
            'telefono': '+52 555-0102',
            'rol': 'gerente'
        },

        # 2 Asesores
        {
            'email': 'asesor1@empresa.com',
            'password': 'asesor123',
            'nombre': 'Ana García',
            'telefono': '+52 555-0201',
            'rol': 'asesor'
        },
        {
            'email': 'asesor2@empresa.com',
            'password': 'asesor123',
            'nombre': 'Luis Rodríguez',
            'telefono': '+52 555-0202',
            'rol': 'asesor'
        }
    ]

    usuarios_creados = []

    print("\nCreando usuarios de prueba...")

    for data in usuarios_data:
        try:
            # Verificar si el usuario ya existe
            usuario_existente = Usuario.query.filter_by(email=data['email']).first()
            if usuario_existente:
                print(f"  - Usuario {data['email']} ya existe, saltando...")
                usuarios_creados.append(usuario_existente)
                continue

            # Crear nuevo usuario
            usuario = Usuario(
                email=data['email'],
                nombre=data['nombre'],
                telefono=data['telefono'],
                rol=data['rol'],
                is_active=True
            )
            usuario.password = data['password']

            usuario.save()
            usuarios_creados.append(usuario)

            print(f"  - {data['rol'].upper()}: {data['nombre']} ({data['email']})")

        except Exception as e:
            print(f"  - Error creando {data['nombre']}: {e}")

    return usuarios_creados

def crear_algunas_reclutas_ejemplo():
    """Crea algunos reclutas de ejemplo para probar funcionalidades"""

    # Obtener asesores para asignar reclutas
    asesores = Usuario.query.filter_by(rol='asesor', is_active=True).all()

    if not asesores:
        print("No hay asesores disponibles para asignar reclutas")
        return []

    reclutas_data = [
        {
            'nombre': 'Juan Pérez',
            'email': 'juan.perez@email.com',
            'telefono': '+52 555-1001',
            'puesto': 'Desarrollador Frontend',
            'estado': 'activo'
        },
        {
            'nombre': 'María López',
            'email': 'maria.lopez@email.com',
            'telefono': '+52 555-1002',
            'puesto': 'Diseñadora UX/UI',
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
            'nombre': 'Sofia Ramírez',
            'email': 'sofia.ramirez@email.com',
            'telefono': '+52 555-1004',
            'puesto': 'Product Manager',
            'estado': 'en proceso'
        }
    ]

    reclutas_creados = []

    print("\nCreando reclutas de ejemplo...")

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
        print("=" * 70)
        print("RESET COMPLETO DE BASE DE DATOS Y CREACION DE USUARIOS DE PRUEBA")
        print("=" * 70)

        # Paso 1: Limpiar base de datos
        if not limpiar_base_datos():
            print("Error en la limpieza. Abortando...")
            return

        # Paso 2: Crear usuarios de prueba
        usuarios = crear_usuarios_prueba()

        if not usuarios:
            print("Error creando usuarios. Abortando...")
            return

        # Paso 3: Crear algunos reclutas de ejemplo
        reclutas = crear_algunas_reclutas_ejemplo()

        # Resumen final
        print("\n" + "=" * 70)
        print("RESUMEN DE CREACION:")
        print("=" * 70)

        # Contar por rol
        admins = [u for u in usuarios if u.rol == 'admin']
        gerentes = [u for u in usuarios if u.rol == 'gerente']
        asesores = [u for u in usuarios if u.rol == 'asesor']

        print(f"\nADMINISTRADORES ({len(admins)}):")
        for admin in admins:
            print(f"  - {admin.nombre} ({admin.email})")

        print(f"\nGERENTES ({len(gerentes)}):")
        for gerente in gerentes:
            print(f"  - {gerente.nombre} ({gerente.email})")

        print(f"\nASESORES ({len(asesores)}):")
        for asesor in asesores:
            print(f"  - {asesor.nombre} ({asesor.email})")

        print(f"\nRECLUTAS CREADOS: {len(reclutas)}")

        print("\nCREDENCIALES DE ACCESO:")
        print("  - Administradores: password = 'admin123'")
        print("  - Gerentes: password = 'gerente123'")
        print("  - Asesores: password = 'asesor123'")

        print("\nNOTA: Los gerentes y asesores están SIN ASIGNAR inicialmente.")
        print("Use la funcionalidad de 'Asignar Asesores a Gerentes' para establecer la jerarquía.")

        print("\nReset de base de datos completado exitosamente!")

if __name__ == "__main__":
    main()