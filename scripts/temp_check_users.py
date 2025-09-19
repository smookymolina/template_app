from app_factory import create_app
from models.usuario import Usuario

app = create_app('development')

with app.app_context():
    print(Usuario.query.count())
