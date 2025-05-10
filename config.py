import os
import secrets
from datetime import timedelta
from flask_cors import CORS  # Importar CORS

class Config:
    """Configuración base para la aplicación"""
    # Configuración general
    SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(16))
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB límite para uploads
    
    
    # Para compatibilidad con la variable ENV
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Configuración de base de datos
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Directorios de la aplicación
    APP_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join('static', 'uploads')
    
    # Lista de IPs permitidas para administración
    IPS_PERMITIDAS = ['127.0.0.1', '192.168.1.100', '192.168.1.7']
    
    # Configuración de paginación
    DEFAULT_PAGE_SIZE = 10
    MAX_PAGE_SIZE = 100
    
    # Configuración de logging
    LOG_FILE = "app.log"
    LOG_LEVEL = "INFO"
    
    # Configuración de seguridad
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    REMEMBER_COOKIE_DURATION = timedelta(days=14)
    
    @staticmethod
    def init_app(app):
        """Inicialización para la configuración base"""
        # Crear directorios de uploads si no existen
        upload_folder = os.path.join(app.root_path, Config.UPLOAD_FOLDER)
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        # Crear subdirectorios para diferentes tipos de uploads
        for subdir in ['usuario', 'recluta']:
            subdir_path = os.path.join(upload_folder, subdir)
            if not os.path.exists(subdir_path):
                os.makedirs(subdir_path)

class ProductionConfig(Config):
    """Configuración para entorno de producción"""
    # ... otras configuraciones ...
    
    # Lista de orígenes permitidos para CORS
    CORS_ORIGINS = [
        'https://ejemplo.com',
        'https://www.ejemplo.com',
        'https://app.ejemplo.com'
    ]
    
    @staticmethod
    def init_app(app):
        """Inicialización específica para producción"""
        Config.init_app(app)
        
        # Configurar CORS para producción
        from flask_cors import CORS
        CORS(app, resources={r"/api/*": {"origins": app.config.get('CORS_ORIGINS', ["*"])}})

class DevelopmentConfig(Config):
    """Configuración para entorno de desarrollo"""
    DEBUG = True
    TESTING = False
    
    # SQLite de desarrollo
    SQLALCHEMY_DATABASE_URI = os.environ.get('DEV_DATABASE_URL') or \
        'sqlite:///' + os.path.join(Config.APP_DIR, 'database.db')
    
    # Nivel de log para desarrollo
    LOG_LEVEL = "DEBUG"

class TestingConfig(Config):
    """Configuración para entorno de pruebas"""
    DEBUG = False
    TESTING = True
    
    # Base de datos SQLite en memoria para pruebas
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite:///:memory:'
    
    # Deshabilitar CSRF para pruebas
    WTF_CSRF_ENABLED = False
    
    # Deshabilitar protección de contraseña para pruebas más rápidas
    BCRYPT_LOG_ROUNDS = 4

class ProductionConfig(Config):
    """Configuración para entorno de producción"""
    DEBUG = False
    TESTING = False
    
    # Base de datos de producción (puede ser MySQL, PostgreSQL, etc.)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(Config.APP_DIR, 'production.db')
    
    # Configuración de seguridad en producción
    SESSION_COOKIE_SECURE = True
    
    # Nivel de log para producción
    LOG_LEVEL = "ERROR"
    
    @staticmethod
    def init_app(app):
        """Inicialización específica para producción"""
        Config.init_app(app)
        
        # Configuración de logs para producción
        import logging
        from logging.handlers import RotatingFileHandler
        
        file_handler = RotatingFileHandler(
            Config.LOG_FILE, 
            maxBytes=1024 * 1024 * 10, 
            backupCount=5
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.ERROR)
        app.logger.addHandler(file_handler)

# Diccionario de configuraciones disponibles
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}