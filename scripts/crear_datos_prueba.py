#!/usr/bin/env python3
"""
Script para crear datos de prueba
- Crea un recluta de ejemplo
- Agrega eventos de timeline
- Agrega documentos de prueba
"""
import sys
import os

# Configurar stdout para UTF-8 en Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta
from models.evento_recluta import EventoRecluta
from models.documento import Documento
from datetime import datetime, timedelta
import random
import string

def generar_folio():
    """Genera un folio único para el recluta"""
    letras = ''.join(random.choices(string.ascii_uppercase, k=3))
    numeros = ''.join(random.choices(string.digits, k=6))
    return f"REC-{letras}{numeros}"

def main():
    app = create_app('development')

    with app.app_context():
        print("=" * 60)
        print("🔧 CREANDO DATOS DE PRUEBA")
        print("=" * 60)

        # 1. Verificar/crear usuario asesor
        asesor = Usuario.query.filter_by(rol='asesor').first()
        if not asesor:
            print("⚠️ No hay asesores, creando uno...")
            asesor = Usuario(
                email='asesor.prueba@example.com',
                nombre='Asesor de Prueba',
                rol='asesor',
                is_active=True
            )
            asesor.password = 'asesor123'
            db.session.add(asesor)
            db.session.commit()
            print(f"✅ Asesor creado: {asesor.email}")
        else:
            print(f"✅ Usando asesor existente: {asesor.nombre}")

        # 2. Crear recluta de prueba
        folio = generar_folio()
        recluta = Recluta(
            nombre="Juan Carlos Pérez García",
            email="juancarlos.prueba@email.com",
            telefono="5512345678",
            puesto="Desarrollador Full Stack",
            estado="En proceso",
            folio=folio,
            notas="Recluta de prueba creado automáticamente para testing de timeline y documentos.",
            asesor_id=asesor.id,
            fecha_registro=datetime.now()
        )
        db.session.add(recluta)
        db.session.commit()

        print(f"\n✅ RECLUTA CREADO:")
        print(f"   ID: {recluta.id}")
        print(f"   Nombre: {recluta.nombre}")
        print(f"   Email: {recluta.email}")
        print(f"   Folio: {recluta.folio}")
        print(f"   Asesor: {asesor.nombre}")

        # 3. Crear eventos de timeline
        eventos_data = [
            {
                'fecha': datetime.now() - timedelta(days=15),
                'titulo': 'Recepción de CV',
                'descripcion': 'Se recibió el curriculum vitae del candidato. Perfil interesante con 5 años de experiencia.',
                'estado': 'completed'
            },
            {
                'fecha': datetime.now() - timedelta(days=12),
                'titulo': 'Revisión de Documentos',
                'descripcion': 'Se verificaron los documentos personales y referencias laborales. Todo en orden.',
                'estado': 'completed'
            },
            {
                'fecha': datetime.now() - timedelta(days=8),
                'titulo': 'Primera Entrevista',
                'descripcion': 'Entrevista telefónica inicial. El candidato mostró buena comunicación y conocimiento técnico.',
                'estado': 'completed'
            },
            {
                'fecha': datetime.now() - timedelta(days=3),
                'titulo': 'Prueba Técnica',
                'descripcion': 'Se envió prueba técnica de programación. Plazo: 5 días.',
                'estado': 'pending'
            },
            {
                'fecha': datetime.now() + timedelta(days=5),
                'titulo': 'Entrevista con Gerente',
                'descripcion': 'Programada entrevista final con el gerente de área.',
                'estado': 'pending'
            }
        ]

        print(f"\n📅 CREANDO {len(eventos_data)} EVENTOS DE TIMELINE:")
        for evento_data in eventos_data:
            evento = EventoRecluta(
                recluta_id=recluta.id,
                fecha=evento_data['fecha'],
                titulo=evento_data['titulo'],
                descripcion=evento_data['descripcion'],
                estado=evento_data['estado']
            )
            db.session.add(evento)
            status_icon = "✅" if evento_data['estado'] == 'completed' else "⏳"
            print(f"   {status_icon} {evento_data['titulo']} ({evento_data['fecha'].strftime('%Y-%m-%d')})")

        db.session.commit()

        # 4. Crear documentos de prueba (solo metadata, sin archivos reales)
        documentos_data = [
            {'nombre': 'CV_JuanCarlos_Perez.pdf', 'tipo': 'curriculum'},
            {'nombre': 'INE_Frente.pdf', 'tipo': 'identificacion'},
            {'nombre': 'Comprobante_Domicilio.pdf', 'tipo': 'comprobante'},
            {'nombre': 'Certificado_Estudios.pdf', 'tipo': 'certificado'},
        ]

        print(f"\n📄 CREANDO {len(documentos_data)} DOCUMENTOS:")
        for doc_data in documentos_data:
            documento = Documento(
                recluta_id=recluta.id,
                nombre=doc_data['nombre'],
                tipo=doc_data['tipo'],
                url=f"/uploads/documentos/{recluta.id}/{doc_data['nombre']}",
                tamano=random.randint(50000, 500000),  # Tamaño simulado
                fecha_subida=datetime.now() - timedelta(days=random.randint(1, 10))
            )
            db.session.add(documento)
            print(f"   📎 {doc_data['nombre']}")

        db.session.commit()

        # Resumen final
        print("\n" + "=" * 60)
        print("✅ DATOS DE PRUEBA CREADOS EXITOSAMENTE")
        print("=" * 60)
        print(f"\n🔑 CREDENCIALES PARA ACCEDER:")
        print(f"   URL: http://127.0.0.1:5000")

        # Mostrar usuarios disponibles
        admin = Usuario.query.filter_by(rol='admin').first()
        if admin:
            print(f"\n   👤 Admin: {admin.email}")
        print(f"   👤 Asesor: {asesor.email} / password: asesor123")

        print(f"\n📋 FOLIO DEL RECLUTA DE PRUEBA:")
        print(f"   {folio}")
        print(f"\n   Usa este folio en la página de seguimiento público:")
        print(f"   http://127.0.0.1:5000/seguimiento")

        print("\n" + "=" * 60)

        return folio

if __name__ == '__main__':
    folio = main()
