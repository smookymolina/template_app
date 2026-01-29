#!/usr/bin/env python3
import sys
import os
import random
import string
from faker import Faker

# Añadir el directorio raíz al path para las importaciones
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app_factory import create_app
from models import db
from models.usuario import Usuario
from models.recluta import Recluta

# --- Configuración ---
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASS = "Str0ngP@ssw0rd!_2026"

NUM_GERENTES = 2
ASESORES_POR_GERENTE = 5
RECLUTAS_POR_ASESOR = 10
USER_PASS = "Password123"

def main():
    """Función principal para inyectar usuarios en la base de datos."""
    app = create_app('development')
    fake = Faker()

    with app.app_context():
        print("=" * 60)
        print("🚀 INICIANDO INYECCIÓN DE USUARIOS")
        print("=" * 60)

        # 1. Crear Administrador
        admin = Usuario.query.filter_by(email=ADMIN_EMAIL).first()
        if not admin:
            print(f"🔧 Creando administrador: {ADMIN_EMAIL}")
            admin = Usuario(
                email=ADMIN_EMAIL,
                nombre="Administrador Principal",
                rol='admin',
                is_active=True
            )
            admin.password = ADMIN_PASS
            db.session.add(admin)
        else:
            print(f"✅ Administrador ya existe: {ADMIN_EMAIL}")

        # 2. Crear Jerarquía
        for i in range(NUM_GERENTES):
            gerente_email = f"gerente.{i+1}@example.com"
            gerente = Usuario.query.filter_by(email=gerente_email).first()
            if not gerente:
                print(f"  🔧 Creando gerente: {gerente_email}")
                gerente = Usuario(
                    email=gerente_email,
                    nombre=fake.name(),
                    rol='gerente',
                    is_active=True
                )
                gerente.password = USER_PASS
                db.session.add(gerente)
                db.session.flush() # Para obtener el ID del gerente
            else:
                print(f"  ✅ Gerente ya existe: {gerente_email}")

            for j in range(ASESORES_POR_GERENTE):
                asesor_email = f"asesor.{i+1}.{j+1}@example.com"
                asesor = Usuario.query.filter_by(email=asesor_email).first()
                if not asesor:
                    print(f"    🔧 Creando asesor: {asesor_email} para gerente {gerente.email}")
                    asesor = Usuario(
                        email=asesor_email,
                        nombre=fake.name(),
                        rol='asesor',
                        is_active=True,
                        gerente_id=gerente.id
                    )
                    asesor.password = USER_PASS
                    db.session.add(asesor)
                    db.session.flush() # Para obtener el ID del asesor
                else:
                    print(f"    ✅ Asesor ya existe: {asesor_email}")

                for k in range(RECLUTAS_POR_ASESOR):
                    recluta_email = f"recluta.{i+1}.{j+1}.{k+1}@example.com"
                    recluta = Recluta.query.filter_by(email=recluta_email).first()
                    if not recluta:
                        print(f"      - Creando recluta para {asesor.email}")
                        recluta = Recluta(
                            nombre=fake.name(),
                            email=recluta_email,
                            telefono=fake.phone_number(),
                            estado="Activo",
                            asesor_id=asesor.id
                        )
                        db.session.add(recluta)
                    # No se imprime si ya existe para no saturar la salida

        print("\n💾 Guardando todos los cambios en la base de datos...")
        try:
            db.session.commit()
            print("✅ Cambios guardados exitosamente.")
        except Exception as e:
            db.session.rollback()
            print(f"❌ ERROR: No se pudieron guardar los cambios. Se revirtió la transacción.")
            print(f"   Detalle: {e}")
            return

        print("\n" + "=" * 60)
        print("🎉 INYECCIÓN DE DATOS COMPLETADA")
        print("=" * 60)
        print("\n🔑 CREDENCIALES DEL ADMINISTRADOR:")
        print(f"   📧 Correo: {ADMIN_EMAIL}")
        print(f"   🔑 Contraseña: {ADMIN_PASS}")
        print("\n" + "=" * 60)

if __name__ == '__main__':
    # Instalar dependencias si es necesario
    try:
        import faker
    except ImportError:
        print("⚠️  Librería 'Faker' no encontrada. Instalando...")
        os.system(f'\"{sys.executable}\" -m pip install Faker')
    
    main()
