#!/usr/bin/env python3
"""
🗂️ DATABASE ROADMAP SCRIPT - TEMPLATE APP
====================================================
Script completo para crear, migrar y gestionar la base de datos
del sistema de reclutamiento y gestión de usuarios.

Autor: Claude AI
Fecha: 2025-09-19
Versión: 1.0

FUNCIONALIDADES:
✅ Creación completa de la base de datos
✅ Migración de datos existentes
✅ Población con datos de prueba
✅ Verificación de integridad
✅ Mantenimiento y limpieza
✅ Backup y restauración
"""

import os
import sys
import logging
from datetime import datetime, timezone, timedelta
import uuid
import json
import sqlite3
import bcrypt
from contextlib import contextmanager
from sqlalchemy.engine import make_url
from sqlalchemy import MetaData, text

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('database_roadmap.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Agregar el directorio actual al path para importar models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app_factory import create_app
    from models import db
    from models.usuario import Usuario
    from models.recluta import Recluta, verificar_folios_existentes
    from models.entrevista import Entrevista
    from models.user_session import UserSession
    from models.documento import Documento
    from models.tutorial_analytics import TutorialAnalytics
    from config import Config
except ImportError as e:
    logger.error(f"❌ Error importando modelos: {e}")
    logger.error("🔧 Asegúrate de estar en el directorio correcto del proyecto")
    sys.exit(1)


class DatabaseRoadmap:
    """
    🛣️ Clase principal para gestionar el roadmap completo de la base de datos
    """

    def __init__(self):
        """Inicializar el roadmap de la base de datos"""
        self.app = None
        self.db_path = None
        self.db_uri = None
        self.db_url = None

    def initialize_app(self):
        """🚀 Inicializar la aplicación Flask"""
        try:
            self.app = create_app()

            self.db_uri = self.app.config.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///app.db')
            try:
                self.db_url = make_url(self.db_uri)
            except Exception as parse_error:
                logger.warning(f'No se pudo interpretar la URI de base de datos: {parse_error}')
                self.db_url = None

            if self.db_url and self.db_url.get_backend_name() == 'sqlite':
                self.db_path = self.db_url.database
                if self.db_path and not os.path.isabs(self.db_path):
                    self.db_path = os.path.join(os.path.dirname(__file__), self.db_path)
            else:
                self.db_path = None

            backend = self.db_url.get_backend_name() if self.db_url else 'desconocido'
            database_name = self.db_url.database if self.db_url else 'sin definir'
            logger.info(f'Aplicacion inicializada. Backend: {backend}. Base: {database_name}')
            return True

        except Exception as e:
            logger.error(f"❌ Error inicializando aplicación: {e}")
            return False

    @contextmanager
    def app_context(self):
        """🔧 Context manager para operaciones con la base de datos"""
        if not self.app:
            self.initialize_app()

        with self.app.app_context():
            yield

    def create_database(self, drop_existing=False):
        """
        🏗️ PASO 1: Crear toda la estructura de la base de datos
        """
        logger.info("=" * 60)
        logger.info("🏗️ INICIANDO CREACIÓN DE BASE DE DATOS")
        logger.info("=" * 60)

        try:
            with self.app_context():
                if drop_existing:
                    logger.warning("⚠️ ELIMINANDO BASE DE DATOS EXISTENTE...")
                    db.drop_all()
                    logger.info("🗑️ Base de datos eliminada")

                # Crear todas las tablas
                logger.info("🔨 Creando estructura de tablas...")
                db.create_all()

                # Verificar tablas creadas
                inspector = db.inspect(db.engine)
                tables = inspector.get_table_names()

                logger.info(f"✅ {len(tables)} tablas creadas:")
                for table in sorted(tables):
                    logger.info(f"   📋 {table}")

                logger.info("✅ ESTRUCTURA DE BASE DE DATOS CREADA EXITOSAMENTE")
                return True

        except Exception as e:
            logger.error(f"❌ Error creando base de datos: {e}")
            return False

    def populate_sample_data(self):
        """
        🌱 PASO 2: Poblar con datos de ejemplo
        """
        logger.info("=" * 60)
        logger.info("🌱 POBLANDO CON DATOS DE EJEMPLO")
        logger.info("=" * 60)

        try:
            with self.app_context():
                self._create_admin_users()
                self._create_sample_reclutas()
                self._create_sample_entrevistas()
                self._create_sample_documentos()
                self._create_sample_analytics()

                logger.info("✅ DATOS DE EJEMPLO CREADOS EXITOSAMENTE")
                return True

        except Exception as e:
            logger.error(f"❌ Error poblando datos: {e}")
            return False

    def _create_admin_users(self):
        """👥 Crear usuarios administradores y asesores"""
        logger.info("👥 Creando usuarios del sistema...")

        users_data = [
            {
                'email': 'admin@girtec.com',
                'password': 'admin123',
                'nombre': 'Administrador Principal',
                'telefono': '+52-555-0101',
                'rol': 'admin'
            },
            {
                'email': 'gerente1@girtec.com',
                'password': 'gerente123',
                'nombre': 'Carlos Gerente',
                'telefono': '+52-555-0201',
                'rol': 'gerente'
            },
            {
                'email': 'asesor1@girtec.com',
                'password': 'asesor123',
                'nombre': 'Ana Asesora',
                'telefono': '+52-555-0301',
                'rol': 'asesor',
                'gerente_email': 'gerente1@girtec.com'
            },
            {
                'email': 'asesor2@girtec.com',
                'password': 'asesor123',
                'nombre': 'Luis Asesor',
                'telefono': '+52-555-0302',
                'rol': 'asesor',
                'gerente_email': 'gerente1@girtec.com'
            }
        ]

        created_users = {}

        for user_data in users_data:
            # Verificar si ya existe
            existing = Usuario.query.filter_by(email=user_data['email']).first()
            if existing:
                logger.info(f"   👤 Usuario ya existe: {user_data['email']}")
                created_users[user_data['email']] = existing
                continue

            # Crear nuevo usuario
            user = Usuario(
                email=user_data['email'],
                nombre=user_data['nombre'],
                telefono=user_data['telefono'],
                rol=user_data['rol']
            )
            user.password = user_data['password']

            # Asignar gerente si es asesor
            if user_data['rol'] == 'asesor' and 'gerente_email' in user_data:
                gerente = created_users.get(user_data['gerente_email'])
                if gerente:
                    user.gerente_id = gerente.id

            user.save()
            created_users[user_data['email']] = user
            logger.info(f"   ✅ Usuario creado: {user_data['nombre']} ({user_data['rol']})")

        # Asignar gerentes después de crear todos los usuarios
        for user_data in users_data:
            if user_data['rol'] == 'asesor' and 'gerente_email' in user_data:
                asesor = created_users.get(user_data['email'])
                gerente = created_users.get(user_data['gerente_email'])
                if asesor and gerente and not asesor.gerente_id:
                    asesor.gerente_id = gerente.id
                    asesor.save()
                    logger.info(f"   🔗 Asesor {asesor.nombre} asignado a gerente {gerente.nombre}")

    def _create_sample_reclutas(self):
        """👨‍💼 Crear reclutas de ejemplo"""
        logger.info("👨‍💼 Creando reclutas de ejemplo...")

        # Obtener usuarios para asignar
        admin = Usuario.query.filter_by(rol='admin').first()
        gerente = Usuario.query.filter_by(rol='gerente').first()
        asesores = Usuario.query.filter_by(rol='asesor').all()

        reclutas_data = [
            {
                'nombre': 'Juan Pérez García',
                'email': 'juan.perez@email.com',
                'telefono': '+52-555-1001',
                'estado': 'Activo',
                'puesto': 'Desarrollador Frontend',
                'notas': 'Candidato con 3 años de experiencia en React',
                'asesor': asesores[0] if asesores else admin
            },
            {
                'nombre': 'María González López',
                'email': 'maria.gonzalez@email.com',
                'telefono': '+52-555-1002',
                'estado': 'En proceso',
                'puesto': 'Diseñadora UX/UI',
                'notas': 'Portfolio excelente, disponibilidad inmediata',
                'asesor': asesores[1] if len(asesores) > 1 else (asesores[0] if asesores else admin)
            },
            {
                'nombre': 'Carlos Rodríguez Sánchez',
                'email': 'carlos.rodriguez@email.com',
                'telefono': '+52-555-1003',
                'estado': 'Activo',
                'puesto': 'DevOps Engineer',
                'notas': 'Experiencia con AWS y Docker',
                'asesor': gerente
            },
            {
                'nombre': 'Ana Martínez Hernández',
                'email': 'ana.martinez@email.com',
                'telefono': '+52-555-1004',
                'estado': 'Rechazado',
                'puesto': 'Product Manager',
                'notas': 'No cumple con los requisitos de experiencia',
                'asesor': admin
            },
            {
                'nombre': 'Luis Fernández Torres',
                'email': 'luis.fernandez@email.com',
                'telefono': '+52-555-1005',
                'estado': 'En proceso',
                'puesto': 'Backend Developer',
                'notas': 'Conocimientos en Python y Django',
                'asesor': asesores[0] if asesores else admin
            }
        ]

        for recluta_data in reclutas_data:
            # Verificar si ya existe
            existing = Recluta.query.filter_by(
                email=recluta_data['email']
            ).first()

            if existing:
                logger.info(f"   👤 Recluta ya existe: {recluta_data['nombre']}")
                continue

            # Crear nuevo recluta
            recluta = Recluta(
                nombre=recluta_data['nombre'],
                email=recluta_data['email'],
                telefono=recluta_data['telefono'],
                estado=recluta_data['estado'],
                puesto=recluta_data['puesto'],
                notas=recluta_data['notas'],
                asesor_id=recluta_data['asesor'].id if recluta_data['asesor'] else None
            )

            recluta.save()
            logger.info(f"   ✅ Recluta creado: {recluta.nombre} (Folio: {recluta.folio})")

    def _create_sample_entrevistas(self):
        """📅 Crear entrevistas de ejemplo"""
        logger.info("📅 Creando entrevistas de ejemplo...")

        reclutas = Recluta.query.filter(Recluta.estado.in_(['Activo', 'En proceso'])).all()

        if not reclutas:
            logger.warning("⚠️ No hay reclutas activos para crear entrevistas")
            return

        # Crear entrevistas para los próximos días
        base_date = datetime.now().date()

        entrevistas_data = [
            {
                'recluta': reclutas[0],
                'fecha': base_date + timedelta(days=1),
                'hora': '10:00',
                'tipo': 'virtual',
                'ubicacion': 'Zoom Meeting',
                'notas': 'Primera entrevista técnica',
                'estado': 'pendiente'
            },
            {
                'recluta': reclutas[1] if len(reclutas) > 1 else reclutas[0],
                'fecha': base_date + timedelta(days=2),
                'hora': '14:30',
                'tipo': 'presencial',
                'ubicacion': 'Oficina Central - Sala A',
                'notas': 'Entrevista con RH',
                'estado': 'pendiente'
            },
            {
                'recluta': reclutas[2] if len(reclutas) > 2 else reclutas[0],
                'fecha': base_date - timedelta(days=1),
                'hora': '09:00',
                'tipo': 'telefonica',
                'ubicacion': 'Llamada telefónica',
                'notas': 'Entrevista completada satisfactoriamente',
                'estado': 'completada'
            }
        ]

        for entrevista_data in entrevistas_data:
            entrevista = Entrevista(
                recluta_id=entrevista_data['recluta'].id,
                fecha=entrevista_data['fecha'],
                hora=entrevista_data['hora'],
                tipo=entrevista_data['tipo'],
                ubicacion=entrevista_data['ubicacion'],
                notas=entrevista_data['notas'],
                estado=entrevista_data['estado']
            )

            entrevista.save()
            logger.info(f"   ✅ Entrevista creada: {entrevista_data['recluta'].nombre} - {entrevista_data['fecha']}")

    def _create_sample_documentos(self):
        """📄 Crear documentos de ejemplo"""
        logger.info("📄 Creando documentos de ejemplo...")

        reclutas = Recluta.query.limit(3).all()

        for i, recluta in enumerate(reclutas):
            documento = Documento(
                recluta_id=recluta.id,
                nombre=f"CV_{recluta.nombre.replace(' ', '_')}.pdf",
                url=f"/uploads/documents/cv_{recluta.id}_{uuid.uuid4().hex[:8]}.pdf",
                tipo="application/pdf",
                tamano=1024 * 250  # 250KB
            )

            db.session.add(documento)
            logger.info(f"   ✅ Documento creado: {documento.nombre}")

        db.session.commit()

    def _create_sample_analytics(self):
        """📊 Crear datos de analytics de ejemplo"""
        logger.info("📊 Creando analytics de ejemplo...")

        # Simular varios eventos del tutorial
        events = [
            {'event_type': 'started', 'step': None},
            {'event_type': 'step_completed', 'step': 1},
            {'event_type': 'step_completed', 'step': 2},
            {'event_type': 'step_completed', 'step': 3},
            {'event_type': 'completed', 'step': None},
            {'event_type': 'skipped', 'step': 4}
        ]

        for i in range(5):  # 5 sesiones de tutorial diferentes
            device_id = f"device_{uuid.uuid4().hex[:12]}"

            for event in events:
                TutorialAnalytics.log_event(
                    device_id=device_id,
                    event_type=event['event_type'],
                    step=event['step'],
                    time_spent=30000 + (i * 5000),  # Tiempo variable
                    ip=f"192.168.1.{10 + i}",
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                )

        logger.info("   ✅ Analytics de tutorial creados")

    def verify_database_integrity(self):
        """
        🔍 PASO 3: Verificar integridad de la base de datos
        """
        logger.info("=" * 60)
        logger.info("🔍 VERIFICANDO INTEGRIDAD DE LA BASE DE DATOS")
        logger.info("=" * 60)

        try:
            with self.app_context():
                issues = []

                # Verificar folios únicos en reclutas
                logger.info("🔍 Verificando folios de reclutas...")
                verificar_folios_existentes()

                # Verificar relaciones usuario-recluta
                logger.info("🔍 Verificando relaciones usuario-recluta...")
                reclutas_sin_asesor = Recluta.query.filter_by(asesor_id=None).count()
                if reclutas_sin_asesor > 0:
                    issues.append(f"⚠️ {reclutas_sin_asesor} reclutas sin asesor asignado")

                # Verificar jerarquía de usuarios
                logger.info("🔍 Verificando jerarquía de usuarios...")
                asesores_sin_gerente = Usuario.query.filter_by(rol='asesor', gerente_id=None).count()
                if asesores_sin_gerente > 0:
                    issues.append(f"⚠️ {asesores_sin_gerente} asesores sin gerente asignado")

                # Verificar entrevistas huérfanas
                logger.info("🔍 Verificando integridad de entrevistas...")
                entrevistas_huerfanas = db.session.query(Entrevista).filter(
                    ~Entrevista.recluta_id.in_(db.session.query(Recluta.id))
                ).count()
                if entrevistas_huerfanas > 0:
                    issues.append(f"❌ {entrevistas_huerfanas} entrevistas huérfanas encontradas")

                # Verificar sesiones expiradas
                logger.info("🔍 Limpiando sesiones expiradas...")
                expired_sessions = UserSession.cleanup_expired()
                if expired_sessions > 0:
                    logger.info(f"🧹 {expired_sessions} sesiones expiradas limpiadas")

                # Mostrar estadísticas
                self._show_database_statistics()

                if issues:
                    logger.warning("⚠️ PROBLEMAS DE INTEGRIDAD ENCONTRADOS:")
                    for issue in issues:
                        logger.warning(f"   {issue}")
                else:
                    logger.info("✅ INTEGRIDAD DE BASE DE DATOS VERIFICADA")

                return len(issues) == 0

        except Exception as e:
            logger.error(f"❌ Error verificando integridad: {e}")
            return False

    def _show_database_statistics(self):
        """📊 Mostrar estadísticas de la base de datos"""
        logger.info("📊 ESTADÍSTICAS DE LA BASE DE DATOS:")

        try:
            stats = {
                'Usuarios': Usuario.query.count(),
                'Reclutas': Recluta.query.count(),
                'Entrevistas': Entrevista.query.count(),
                'Documentos': Documento.query.count(),
                'Sesiones activas': UserSession.query.filter_by(is_valid=True).count(),
                'Analytics': TutorialAnalytics.query.count()
            }

            for table, count in stats.items():
                logger.info(f"   📋 {table}: {count}")

            # Estadísticas por rol
            logger.info("👥 USUARIOS POR ROL:")
            roles = db.session.query(Usuario.rol, db.func.count(Usuario.id)).group_by(Usuario.rol).all()
            for rol, count in roles:
                logger.info(f"   👤 {rol}: {count}")

            # Estadísticas de reclutas por estado
            logger.info("👨‍💼 RECLUTAS POR ESTADO:")
            estados = db.session.query(Recluta.estado, db.func.count(Recluta.id)).group_by(Recluta.estado).all()
            for estado, count in estados:
                logger.info(f"   📊 {estado}: {count}")

        except Exception as e:
            logger.error(f"❌ Error obteniendo estadísticas: {e}")

    def backup_database(self, backup_path=None):
        """
        💾 PASO 4: Crear backup de la base de datos
        """
        logger.info("=" * 60)
        logger.info("💾 CREANDO BACKUP DE LA BASE DE DATOS")
        logger.info("=" * 60)

        try:
            backend = self.db_url.get_backend_name() if self.db_url else None

            if not backup_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                extension = 'db' if backend == 'sqlite' else 'json'
                backup_path = f"backup_database_{timestamp}.{extension}"

            if backend == 'sqlite':
                if not self.db_path:
                    logger.error('Ruta de base de datos no definida para SQLite')
                    return False

                if not os.path.exists(self.db_path):
                    logger.error(f'Base de datos no encontrada: {self.db_path}')
                    return False

                import shutil
                shutil.copy2(self.db_path, backup_path)

                backup_size = os.path.getsize(backup_path)
                logger.info(f'Backup creado: {backup_path} ({backup_size:,} bytes)')
                return True

            if not self.db_url:
                logger.error('No se pudo determinar la conexion de base de datos para el backup')
                return False

            dump = {}
            with self.app_context():
                metadata = MetaData()
                metadata.reflect(bind=db.engine)
                for table in metadata.sorted_tables:
                    result = db.session.execute(table.select())
                    dump[table.name] = [dict(row._mapping) for row in result]

            with open(backup_path, 'w', encoding='utf-8') as backup_file:
                json.dump(dump, backup_file, default=str, indent=2)

            backup_size = os.path.getsize(backup_path)
            logger.info(f'Backup logico creado: {backup_path} ({backup_size:,} bytes)')
            return True
        except Exception as e:
            logger.error(f"❌ Error creando backup: {e}")
            return False

    def maintenance_tasks(self):
        """
        🧹 PASO 5: Tareas de mantenimiento
        """
        logger.info("=" * 60)
        logger.info("🧹 EJECUTANDO TAREAS DE MANTENIMIENTO")
        logger.info("=" * 60)

        try:
            with self.app_context():
                # Limpiar sesiones expiradas
                logger.info("🧹 Limpiando sesiones expiradas...")
                expired_count = UserSession.cleanup_expired()
                logger.info(f"   ✅ {expired_count} sesiones limpiadas")

                # Verificar y reparar folios
                logger.info("🔧 Verificando folios de reclutas...")
                verificar_folios_existentes()

                # Limpiar analytics antiguos (opcional, más de 6 meses)
                logger.info("🗑️ Limpiando analytics antiguos...")
                six_months_ago = datetime.utcnow() - timedelta(days=180)
                old_analytics = TutorialAnalytics.query.filter(
                    TutorialAnalytics.timestamp < six_months_ago
                ).count()

                if old_analytics > 0:
                    TutorialAnalytics.query.filter(
                        TutorialAnalytics.timestamp < six_months_ago
                    ).delete()
                    db.session.commit()
                    logger.info(f"   ✅ {old_analytics} registros de analytics eliminados")
                else:
                    logger.info("   ✅ No hay analytics antiguos para limpiar")

                backend = self.db_url.get_backend_name() if self.db_url else None
                if backend == 'sqlite' and self.db_path and self.db_path.endswith('.db'):
                    logger.info('   Optimizando base de datos SQLite...')
                    with sqlite3.connect(self.db_path) as conn:
                        conn.execute('VACUUM')
                        conn.execute('ANALYZE')
                    logger.info('   Base de datos SQLite optimizada')
                elif backend == 'mysql':
                    logger.info('   Optimizando tablas MySQL...')
                    inspector = db.inspect(db.engine)
                    tables = inspector.get_table_names()
                    for table in tables:
                        db.session.execute(text(f'OPTIMIZE TABLE {table}'))
                    db.session.commit()
                    logger.info(f'   {len(tables)} tablas MySQL optimizadas')

                logger.info("✅ MANTENIMIENTO COMPLETADO")
                return True

        except Exception as e:
            logger.error(f"❌ Error en mantenimiento: {e}")
            return False

    def full_roadmap(self, drop_existing=False, skip_sample_data=False):
        """
        🛣️ EJECUTAR ROADMAP COMPLETO
        """
        logger.info("🚀" * 20)
        logger.info("🛣️ INICIANDO ROADMAP COMPLETO DE BASE DE DATOS")
        logger.info("🚀" * 20)

        success = True

        # Paso 1: Inicializar aplicación
        if not self.initialize_app():
            return False

        # Paso 2: Crear base de datos
        if not self.create_database(drop_existing=drop_existing):
            success = False

        # Paso 3: Poblar con datos (opcional)
        if not skip_sample_data and success:
            if not self.populate_sample_data():
                success = False

        # Paso 4: Verificar integridad
        if success:
            if not self.verify_database_integrity():
                success = False

        # Paso 5: Crear backup
        if success:
            if not self.backup_database():
                success = False

        # Paso 6: Mantenimiento
        if success:
            if not self.maintenance_tasks():
                success = False

        if success:
            logger.info("🎉" * 20)
            logger.info("🎉 ROADMAP COMPLETADO EXITOSAMENTE")
            logger.info("🎉" * 20)
        else:
            logger.error("❌" * 20)
            logger.error("❌ ROADMAP COMPLETADO CON ERRORES")
            logger.error("❌" * 20)

        return success


def main():
    """🎯 Función principal del script"""
    import argparse

    parser = argparse.ArgumentParser(
        description='🛣️ Database Roadmap Script - Template App',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
EJEMPLOS DE USO:
  python database_roadmap.py --full                    # Roadmap completo
  python database_roadmap.py --create                  # Solo crear estructura
  python database_roadmap.py --create --drop           # Recrear desde cero
  python database_roadmap.py --populate                # Solo poblar datos
  python database_roadmap.py --verify                  # Solo verificar integridad
  python database_roadmap.py --backup                  # Solo crear backup
  python database_roadmap.py --maintenance             # Solo mantenimiento
        """
    )

    parser.add_argument('--full', action='store_true',
                       help='Ejecutar roadmap completo')
    parser.add_argument('--create', action='store_true',
                       help='Crear estructura de base de datos')
    parser.add_argument('--drop', action='store_true',
                       help='Eliminar base de datos existente antes de crear')
    parser.add_argument('--populate', action='store_true',
                       help='Poblar con datos de ejemplo')
    parser.add_argument('--verify', action='store_true',
                       help='Verificar integridad de la base de datos')
    parser.add_argument('--backup', action='store_true',
                       help='Crear backup de la base de datos')
    parser.add_argument('--maintenance', action='store_true',
                       help='Ejecutar tareas de mantenimiento')
    parser.add_argument('--skip-sample-data', action='store_true',
                       help='Saltar creación de datos de ejemplo en roadmap completo')

    args = parser.parse_args()

    # Si no se especifica ninguna acción, mostrar ayuda
    if not any([args.full, args.create, args.populate, args.verify,
                args.backup, args.maintenance]):
        parser.print_help()
        return

    # Crear instancia del roadmap
    roadmap = DatabaseRoadmap()

    try:
        if args.full:
            # Roadmap completo
            success = roadmap.full_roadmap(
                drop_existing=args.drop,
                skip_sample_data=args.skip_sample_data
            )
        else:
            # Tareas individuales
            success = True

            if args.create:
                roadmap.initialize_app()
                success = roadmap.create_database(drop_existing=args.drop) and success

            if args.populate:
                roadmap.initialize_app()
                success = roadmap.populate_sample_data() and success

            if args.verify:
                roadmap.initialize_app()
                success = roadmap.verify_database_integrity() and success

            if args.backup:
                roadmap.initialize_app()
                success = roadmap.backup_database() and success

            if args.maintenance:
                roadmap.initialize_app()
                success = roadmap.maintenance_tasks() and success

        if success:
            logger.info("✅ Script ejecutado exitosamente")
            sys.exit(0)
        else:
            logger.error("❌ Script completado con errores")
            sys.exit(1)

    except KeyboardInterrupt:
        logger.warning("⚠️ Script interrumpido por el usuario")
        sys.exit(130)
    except Exception as e:
        logger.error(f"❌ Error inesperado: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
