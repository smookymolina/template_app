from flask_login import UserMixin
from datetime import datetime
import bcrypt
from models import db, DatabaseError

class Usuario(db.Model, UserMixin):
    """
    Modelo para usuarios administradores y gerentes del sistema.
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    nombre = db.Column(db.String(100), nullable=True)
    telefono = db.Column(db.String(20), nullable=True)
    foto_url = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    rol = db.Column(db.String(20), default='asesor')  # 'admin' o 'asesor'

    
    @property
    def password(self):
        """La contraseña no es un atributo legible"""
        raise AttributeError('La contraseña no es un atributo legible')
        
    @password.setter
    def password(self, password):
        """Genera un hash seguro de la contraseña"""
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
    
    def check_password(self, password):
        """Verifica la contraseña"""
        return bcrypt.checkpw(
            password.encode('utf-8'), 
            self.password_hash.encode('utf-8')
        )

    def serialize(self):
        """Retorna una representación serializable del usuario"""
        return {
            "id": self.id,
            "email": self.email,
            "nombre": self.nombre,
            "telefono": self.telefono,
            "foto_url": self.foto_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }
    
    def save(self):
        """Guarda el usuario en la base de datos de forma segura"""
        try:
            if not self.id:  # Si es un nuevo usuario
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar usuario: {str(e)}")
    
    def update_last_login(self):
        """Actualiza la fecha del último inicio de sesión"""
        try:
            self.last_login = datetime.utcnow()
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al actualizar último login: {str(e)}")