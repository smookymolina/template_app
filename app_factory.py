from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
import logging
import os
import time
import redis
from config import config
from models import db
from sqlalchemy.exc import OperationalError
from models.usuario import Usuario
from flask_cors import CORS

# Instancia global de Migrate
migrate = Migrate()

def create_app(config_name='default'):
    """
    Factory pattern para crear la aplicación Flask.
    
    Args:
        config_name: Nombre de la configuración a usar
        
    Returns:
        Aplicación Flask configurada
    """
    app = Flask(__name__)
    
    # Cargar configuración
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Establecer explícitamente FLASK_ENV en app.config
    app.config['FLASK_ENV'] = os.environ.get('FLASK_ENV', 'development')
    
    # Configurar CORS para permitir peticiones desde orígenes externos
    if app.config['FLASK_ENV'] == 'production' and app.config.get('CORS_ORIGINS'):
        # En producción, usar orígenes específicos definidos en la configuración
        CORS(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS')}})
    else:
        # En desarrollo, permitir todos los orígenes para las rutas de API
        CORS(app, resources={r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
            "expose_headers": ["Content-Type", "X-Total-Count"],
            "max_age": 600  # Tiempo de caché para preflight requests (en segundos)
        }})

    # Crear carpetas de subida si no existen
    try:
        os.makedirs(app.config['PROFILE_IMG_FOLDER'], exist_ok=True)
        app.logger.info(f"Carpeta de subida de perfiles asegurada en: {app.config['PROFILE_IMG_FOLDER']}")
    except OSError as e:
        app.logger.error(f"Error al crear la carpeta de subida de perfiles: {e}")
    
    # Configurar logging
    configure_logging(app)
    
    # Inicializar extensiones
    initialize_extensions(app)
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Crear contexto de shell
    register_shell_context(app)
    
    # Registrar comandos CLI
    register_commands(app)
    
    # Configurar manejadores de errores
    register_error_handlers(app)
    
    # Configurar ganchos antes/después de petición
    register_request_hooks(app)

    # Registrar context processor para cache busting de archivos estáticos
    register_context_processors(app)

    # Inicializar la base de datos y crear usuarios por defecto
    with app.app_context():
        initialize_database(app)

    return app

def configure_logging(app):
    """Configura el sistema de logging de la aplicación"""
    log_level = getattr(logging, app.config['LOG_LEVEL'])
    
    # Configurar logger principal
    app.logger.setLevel(log_level)
    
    # En desarrollo, usar handler de consola
    if app.debug:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        app.logger.addHandler(console_handler)
    
    # Usar un enfoque más seguro para determinar el entorno
    entorno = app.config.get('FLASK_ENV', 'development')
    app.logger.info(f'Aplicación inicializada en modo {entorno}')

def initialize_extensions(app):
    """Inicializa las extensiones de Flask"""
    # Inicializar Cliente Redis
    redis_url = app.config.get('REDIS_URL') or 'redis://localhost:6379/0'
    redis_client = redis.from_url(
        redis_url,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
        health_check_interval=30,
        retry_on_timeout=True
    )
    
    # Intentar conexión con Redis de forma segura
    redis_available = False
    for attempt in range(1, 4):
        try:
            redis_client.ping()
            app.logger.info("Conexión con Redis establecida exitosamente.")
            redis_available = True
            break
        except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError) as e:
            if attempt == 3:
                app.logger.warning(f"No se pudo conectar a Redis después de {attempt} intentos: {e}. Las funciones de caché y notificaciones en tiempo real podrían estar limitadas.")
            else:
                time.sleep(1)
    
    app.redis_client = redis_client if redis_available else None
    app.redis_available = redis_available

    # Inicializar SQLAlchemy
    db.init_app(app)

    # Inicializar Flask-Migrate
    migrate.init_app(app, db)

    # Inicializar Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'main.index'  # Vista de login
    login_manager.login_message = 'Por favor inicie sesión para acceder a esta página'
    login_manager.login_message_category = 'warning'
    
    @login_manager.user_loader
    def load_user(user_id):
        return Usuario.query.get(int(user_id))

def register_blueprints(app):
    """Registra los blueprints de la aplicación"""
    # Importar blueprints
    from routes.main import main_bp
    from routes.api import api_bp
    from routes.auth import auth_bp
    from routes.admin import admin_bp
    from routes.gerente_stats import gerente_stats_bp
    from routes.asesor_stats import asesor_stats_bp
    from routes.notifications import notifications_bp

    # Registrar blueprints principales
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(admin_bp, url_prefix='/admin')
    app.register_blueprint(gerente_stats_bp)
    app.register_blueprint(asesor_stats_bp)
    app.register_blueprint(notifications_bp, url_prefix='/api')
    
    # Tutorial blueprint (opcional, solo si existe el archivo)
    try:
        from routes.tutorial import tutorial_bp
        app.register_blueprint(tutorial_bp, url_prefix='/tutorial')
        app.logger.info('Blueprint tutorial registrado')
    except ImportError:
        app.logger.debug('Blueprint tutorial no encontrado, omitiendo...')

def register_shell_context(app):
    """Registra variables para el contexto del shell"""
    @app.shell_context_processor
    def make_shell_context():
        # Importar modelos para asegurar que las tablas se creen
        from models.evento_recluta import EventoRecluta
        from models.recluta import Recluta
        from models.entrevista import Entrevista
        
        return {
            'db': db, 
            'Usuario': Usuario,
            'EventoRecluta': EventoRecluta,
            'Recluta': Recluta,
            'Entrevista': Entrevista,
            'app': app
        }

def register_commands(app):
    """Registra comandos CLI personalizados"""
    @app.cli.command("crear-admin")
    def crear_admin():
        """Crea un usuario administrador"""
        from models.usuario import Usuario
        
        email = input("Email del administrador: ")
        password = input("Contraseña: ")
        nombre = input("Nombre completo: ")
        
        # Verificar si ya existe
        usuario = Usuario.query.filter_by(email=email).first()
        if usuario:
            print(f"Ya existe un usuario con el email {email}")
            return
        
        # Crear nuevo usuario
        usuario = Usuario(
            email=email,
            nombre=nombre,
            rol='admin',
            is_active=True
        )
        usuario.password = password
        db.session.add(usuario)
        db.session.commit()
        
        print(f"Usuario administrador {email} creado correctamente")

def register_error_handlers(app):
    """Registra los manejadores de errores HTTP"""
    @app.errorhandler(404)
    def page_not_found(e):
        return {'error': 'Página o recurso no encontrado'}, 404
    
    @app.errorhandler(500)
    def server_error(e):
        app.logger.error(f'Error del servidor: {str(e)}')
        return {'error': 'Error interno del servidor'}, 500
    
    @app.errorhandler(403)
    def forbidden(e):
        return {'error': 'Acceso prohibido'}, 403
    
    @app.errorhandler(401)
    def unauthorized(e):
        return {'error': 'No autorizado'}, 401

def register_context_processors(app):
    """Registra context processors para variables globales en templates"""
    @app.context_processor
    def inject_static_version():
        # Generar un timestamp para cache busting
        timestamp = int(time.time())
        return {
            'static_version': timestamp,
            'v': timestamp  # Alias corto para usar en templates
        }

def register_request_hooks(app):
    """Registra ganchos de petici?n (before/after request)"""
    @app.before_request
    def log_request_info():
        """Log de informaci?n b?sica de la petici?n"""
        if app.debug:
            from flask import request
            app.logger.debug(f'Petici?n: {request.method} {request.path}')

    @app.before_request
    def track_user_activity():
        """Actualiza la actividad de la sesi?n del usuario autenticado."""
        from flask import request, g
        from flask_login import current_user
        from datetime import datetime
        from models.user_session import UserSession

        if not current_user.is_authenticated:
            return

        if request.endpoint == 'static' or request.path.startswith('/static'):
            return

        cookie_name = app.config.get('USER_SESSION_COOKIE_NAME', 'user_session')
        session_token = request.cookies.get(cookie_name)
        if not session_token:
            g._create_user_session = True
            return

        g._create_user_session = False

        try:
            user_session = UserSession.query.filter_by(
                session_token=session_token,
                usuario_id=current_user.id,
                is_valid=True
            ).first()

            if not user_session:
                g._create_user_session = True
                return

            now = datetime.utcnow()
            threshold = app.config.get('USER_ACTIVITY_UPDATE_SECONDS', 60)
            if not user_session.last_activity or (now - user_session.last_activity).total_seconds() >= threshold:
                user_session.last_activity = now
                db.session.commit()
        except Exception as e:
            db.session.rollback()
            app.logger.warning(f"Error actualizando actividad de sesion: {str(e)}")

    @app.after_request
    def add_security_headers(response):
        """A?ade cabeceras de seguridad a las respuestas"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # Asegurar que el encoding UTF-8 est? correctamente configurado
        if response.mimetype == 'text/html':
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
        elif response.mimetype == 'application/json':
            response.headers['Content-Type'] = 'application/json; charset=utf-8'

        # Emitir cookie de sesi?n propia si falta
        try:
            from flask import request, g
            from flask_login import current_user
            from utils.security import create_user_session, get_client_ip

            if current_user.is_authenticated:
                cookie_name = app.config.get('USER_SESSION_COOKIE_NAME', 'user_session')
                if not request.cookies.get(cookie_name) and getattr(g, "_create_user_session", False):
                    set_cookie_header = response.headers.get("Set-Cookie", "")
                    if cookie_name not in set_cookie_header:
                        max_age = int(app.permanent_session_lifetime.total_seconds())
                        days_valid = max(1, int(max_age / 86400)) if max_age else 7
                        session_obj = create_user_session(
                            usuario_id=current_user.id,
                            ip_address=get_client_ip(),
                            user_agent=request.user_agent.string if request.user_agent else None,
                            days_valid=days_valid
                        )
                        response.set_cookie(
                            cookie_name,
                            session_obj.session_token,
                            max_age=max_age,
                            httponly=True,
                            samesite='Lax',
                            secure=not app.debug
                        )
        except Exception as e:
            app.logger.warning(f"No se pudo emitir cookie de sesion: {str(e)}")

        return response

def initialize_database(app):
    """Inicializa la base de datos y crea datos iniciales si es entorno de desarrollo."""
    # Importar modelos necesarios
    from models.usuario import Usuario

    try:
        # Crear tablas de la base de datos
        db.create_all()

        # Determinar qué tipo de base de datos se está usando
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        if 'mysql' in db_uri:
            app.logger.info('Tablas MySQL creadas/verificadas')
        else:
            app.logger.info('Tablas SQLite creadas/verificadas (fallback automatico)')

        # Usar una variable de entorno o configuración para decidir si crear usuarios
        # Aquí usamos FLASK_ENV que ya está configurado en la app
        if app.config.get('FLASK_ENV') == 'development' and app.config.get('SEED_DEV_USERS'):
            crear_usuarios_desarrollo(app)
    except OperationalError as exc:
        app.logger.error(
            'No se pudo inicializar la base de datos: %s. '
            '\n\n🔧 SOLUCIONES POSIBLES:'
            '\n1. Instalar MySQL: https://dev.mysql.com/downloads/installer/'
            '\n2. Iniciar MySQL: net start mysql'
            '\n3. Ejecutar script: python init_db.py'
            '\n4. Verificar credenciales en archivo .env'
            '\n5. La app usará SQLite automáticamente como fallback',
            exc
        )
        if app.config.get('TESTING'):
            raise

def crear_usuarios_desarrollo(app):
    """Crea un conjunto de usuarios por defecto para el entorno de desarrollo."""
    from models.usuario import Usuario

    usuarios_desarrollo = [
        {
            'email': 'admin@example.com',
            'nombre': 'Administrador Principal',
            'rol': 'admin',
            'password': 'admin'
        },
        {
            'email': 'admin2@example.com',
            'nombre': 'Admin Secundario',
            'rol': 'admin',
            'password': 'admin2'
        },
        {
            'email': 'asesor1@example.com',
            'nombre': 'María García',
            'rol': 'asesor',
            'password': 'asesor1'
        },
        {
            'email': 'asesor2@example.com',
            'nombre': 'Juan Rodríguez',
            'rol': 'asesor',
            'password': 'asesor2'
        },
        {
            'email': 'gerente1@example.com',
            'nombre': 'Ana López',
            'rol': 'gerente',
            'password': 'gerente1'
        }
    ]

    for user_data in usuarios_desarrollo:
        usuario_existente = Usuario.query.filter_by(email=user_data['email']).first()
        if not usuario_existente:
            nuevo_usuario = Usuario(
                email=user_data['email'],
                nombre=user_data['nombre'],
                rol=user_data['rol']
            )
            nuevo_usuario.password = user_data['password']
            db.session.add(nuevo_usuario)
            app.logger.info(f'Usuario de desarrollo creado: {user_data["email"]}')
        else:
            # Opcional: asegurar que el rol sea el correcto si el usuario ya existe
            if usuario_existente.rol != user_data['rol']:
                usuario_existente.rol = user_data['rol']
                app.logger.info(f'Rol actualizado para usuario de desarrollo: {user_data["email"]}')

    db.session.commit()
