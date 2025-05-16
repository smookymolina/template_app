from flask import Flask
from flask_login import LoginManager
import logging
import os
from config import config
from models import db
from models.usuario import Usuario
from flask_cors import CORS  # Importar CORS

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
    # Inicializar SQLAlchemy
    db.init_app(app)
    
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
    
    # Registrar blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(admin_bp, url_prefix='/admin')

def register_shell_context(app):
    """Registra variables para el contexto del shell"""
    @app.shell_context_processor
    def make_shell_context():
        return {
            'db': db, 
            'Usuario': Usuario,
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
        
        # Verificar si ya existe
        usuario = Usuario.query.filter_by(email=email).first()
        if usuario:
            print(f"Ya existe un usuario con el email {email}")
            return
        
        # Crear nuevo usuario
        usuario = Usuario(email=email)
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

def register_request_hooks(app):
    """Registra ganchos de petición (before/after request)"""
    @app.before_request
    def log_request_info():
        """Log de información básica de la petición"""
        if app.debug:
            from flask import request
            app.logger.debug(f'Petición: {request.method} {request.path}')
    
    @app.after_request
    def add_security_headers(response):
        """Añade cabeceras de seguridad a las respuestas"""
        # Cabeceras de seguridad
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Rutas públicas que SÍ deben permitir caché
        public_paths = ['/static/', '/api/tracking/', '/favicon.ico']
        
        # Verificar si es una ruta protegida o un usuario autenticado
        is_protected_route = not any(request.path.startswith(path) for path in public_paths)
        
        # Para rutas autenticadas o protegidas, prevenir caché agresivamente
        if current_user.is_authenticated or is_protected_route:
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '-1'
            response.headers['Vary'] = 'Cookie'
        else:
            # Para contenido público, permitir cierto nivel de caché
            response.headers['Cache-Control'] = 'public, max-age=300'  # 5 minutos
        
        return response
    
    @app.before_request
def check_authentication():
    """Verifica la validez de la autenticación en cada solicitud"""
    from flask import request, redirect, url_for
    from flask_login import current_user, logout_user
    import json
    
    # Rutas que no requieren verificación de sesión
    exempt_routes = [
        '/auth/login', 
        '/auth/logout',
        '/api/tracking/',
        '/api/verificar-folio/',
        '/api/recuperar-folio',
        '/static/'
    ]
    
    # No verificar rutas exentas o favicon
    if any(request.path.startswith(route) for route in exempt_routes) or request.path == '/favicon.ico':
        return
        
    # Verificar si el usuario está autenticado y la ruta lo requiere
    if current_user.is_authenticated:
        # Verificar validez de sesión en la base de datos
        try:
            from models.user_session import UserSession
            session_token = request.cookies.get('session', '')
            
            if session_token:
                is_valid_session = UserSession.query.filter_by(
                    session_token=session_token,
                    usuario_id=current_user.id,
                    is_valid=True
                ).first() is not None
                
                if not is_valid_session:
                    # Si la sesión no es válida, forzar logout
                    logout_user()
                    
                    # Si es una solicitud AJAX/API, devolver 401
                    if request.path.startswith('/api/'):
                        return app.response_class(
                            response=json.dumps({
                                "success": False,
                                "message": "Sesión expirada o inválida",
                                "code": "SESSION_EXPIRED"
                            }),
                            status=401,
                            mimetype='application/json'
                        )
                    # Para solicitudes normales, redirigir a la página de login
                    return redirect(url_for('main.index'))
        except Exception as e:
            app.logger.error(f"Error al verificar sesión: {str(e)}")

def initialize_database(app):
    """Inicializa la base de datos y crea datos iniciales"""
    # Crear tablas
    db.create_all()
    
    # Crear usuario admin por defecto si no existe
    admin_email = 'admin@example.com'
    if not Usuario.query.filter_by(email=admin_email).first():
        admin = Usuario(email=admin_email)
        admin.password = 'admin'  # Se encriptará automáticamente
        db.session.add(admin)
        db.session.commit()
        app.logger.info(f'Usuario admin creado: {admin_email}')
    
    # Crear segundo admin para pruebas
    admin2_email = 'admin2@example.com'
    if not Usuario.query.filter_by(email=admin2_email).first():
        admin2 = Usuario(email=admin2_email)
        admin2.password = 'admin2'  # Se encriptará automáticamente
        db.session.add(admin2)
        db.session.commit()
        app.logger.info(f'Usuario admin2 creado: {admin2_email}')
    
    app.logger.info('Base de datos inicializada correctamente')