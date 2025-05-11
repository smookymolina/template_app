from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_login import UserMixin
import bcrypt
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Recluta(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    email = db.Column(db.String(100))
    telefono = db.Column(db.String(20))
    estado = db.Column(db.String(20))
    puesto = db.Column(db.String(100), nullable=True)
    notas = db.Column(db.Text, nullable=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'telefono': self.telefono,
            'estado': self.estado,
            'puesto': self.puesto,
            'notas': self.notas,
            'fecha_registro': self.fecha_registro.strftime('%Y-%m-%d %H:%M:%S') if self.fecha_registro else None
        }

class Usuario(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    @property
    def password(self):
        raise AttributeError('La contraseña no es un atributo legible')
        
    @password.setter
    def password(self, password):
        # Genera un hash seguro de la contraseña
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        # Verifica la contraseña
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email
        }

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    session_token = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    is_valid = db.Column(db.Boolean, default=True)
    
    @property
    def is_expired(self):
        return datetime.utcnow() > self.expires_at if self.expires_at else False