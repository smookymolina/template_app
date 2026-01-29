import os
from urllib.parse import quote_plus


def build_database_uri(default_db, *, db_env_keys=None):
    """Construye URI de base de datos con fallback automático MySQL -> SQLite"""
    url = os.environ.get('DATABASE_URL')
    if url:
        return url

    # Intentar MySQL primero
    try:
        import pymysql

        db_env_keys = db_env_keys or []
        user = os.environ.get('MYSQL_USER', 'root')
        password = os.environ.get('MYSQL_PASSWORD', '')
        host = os.environ.get('MYSQL_HOST', '127.0.0.1')
        port = os.environ.get('MYSQL_PORT', '3306')

        db_name = None
        for key in db_env_keys:
            value = os.environ.get(key)
            if value:
                db_name = value
                break
        if not db_name:
            db_name = os.environ.get('MYSQL_DB', default_db)

        if password:
            credentials = f"{user}:{quote_plus(password)}"
        else:
            credentials = user

        if credentials:
            credentials = f"{credentials}@"

        # Verificar si MySQL está disponible
        test_conn = pymysql.connect(host=host, port=int(port), user=user, password=password)
        test_conn.close()

        return f"mysql+pymysql://{credentials}{host}:{port}/{db_name}?charset=utf8mb4"

    except (ImportError, Exception):
        # Fallback a SQLite
        basedir = os.path.abspath(os.path.dirname(__file__))
        instance_path = os.path.join(basedir, 'instance')
        os.makedirs(instance_path, exist_ok=True)
        return f"sqlite:///{os.path.join(instance_path, f'{default_db}.db')}"

def build_mysql_uri(default_db, *, db_env_keys=None):
    """Función legacy - mantiene compatibilidad"""
    return build_database_uri(default_db, db_env_keys=db_env_keys)


def get_pool_recycle():
    try:
        return int(os.environ.get('MYSQL_POOL_RECYCLE', '280'))
    except ValueError:
        return 280


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'una-clave-secreta-muy-dificil-de-adivinar'
    SQLALCHEMY_DATABASE_URI = build_database_uri('template_app', db_env_keys=['MYSQL_DATABASE', 'MYSQL_DB'])
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': get_pool_recycle()
    }
    # Redis Configuration
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads')
    PROFILE_IMG_FOLDER = os.path.join(UPLOAD_FOLDER, 'profile_images')
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
    SEED_DEV_USERS = os.environ.get('SEED_DEV_USERS', 'false').lower() == 'true'
    USER_SESSION_COOKIE_NAME = os.environ.get('USER_SESSION_COOKIE_NAME', 'user_session')
    USER_ACTIVITY_UPDATE_SECONDS = int(os.environ.get('USER_ACTIVITY_UPDATE_SECONDS', '60'))

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = False  # Useful to debug queries during development
    SQLALCHEMY_DATABASE_URI = build_database_uri(
        'template_app_dev',
        db_env_keys=['MYSQL_DEV_DB', 'MYSQL_DATABASE', 'MYSQL_DB']
    )


class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = build_database_uri(
        'template_app',
        db_env_keys=['MYSQL_PROD_DB', 'MYSQL_DATABASE', 'MYSQL_DB']
    )


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = build_database_uri(
        'template_app_test',
        db_env_keys=[
            'MYSQL_TEST_DB',
            'MYSQL_TEST_DATABASE',
            'MYSQL_DATABASE',
            'MYSQL_DB'
        ]
    )
    WTF_CSRF_ENABLED = False
    PRESERVE_CONTEXT_ON_EXCEPTION = False


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
