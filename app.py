import os
from flask import Flask
from routes.auth import auth_bp
from app_factory import create_app
from dotenv import load_dotenv

app = Flask(__name__)

# Cargar variables de entorno desde .env si existe
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

# Determinar el entorno de ejecución
env = os.environ.get('FLASK_ENV', 'development')
app = create_app(env)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = env == 'development'
    
    app.run(host=host, port=port, debug=debug)
    app.register_blueprint(auth_bp)