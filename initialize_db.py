
from app_factory import create_app
from models import db
from models.usuario import Usuario

app = create_app('development')

with app.app_context():
    # Crear todas las tablas
    db.create_all()
    
    # Crear usuario administrador inicial
    admin = Usuario(
        email='admin@example.com',
        nombre='Administrador',
        rol='admin'
    )
    admin.password = 'adminpassword'  # Se encriptará automáticamente
    
    # Crear un usuario asesor de ejemplo
    asesor = Usuario(
        email='asesor@example.com',
        nombre='Asesor',
        rol='asesor'
    )
    asesor.password = 'asesorpassword'  # Se encriptará automáticamente
    
    # Guardar en base de datos
    db.session.add(admin)
    db.session.add(asesor)
    db.session.commit()
    
    print("Base de datos inicializada correctamente")
    print(f"Usuario admin creado: {admin.email}")
    print(f"Usuario asesor creado: {asesor.email}")