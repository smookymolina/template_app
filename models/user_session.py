from datetime import datetime, timedelta
from models import db, DatabaseError

class UserSession(db.Model):
    """
    Modelo para las sesiones de usuario, permitiendo rastrear dispositivos y sesiones activas.
    """
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id', ondelete='CASCADE'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    user_agent = db.Column(db.String(255), nullable=True)
    session_token = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_valid = db.Column(db.Boolean, default=True)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    @property
    def is_expired(self):
        """Verifica si la sesión ha expirado"""
        return datetime.utcnow() > self.expires_at if self.expires_at else True
    
    @property
    def is_active(self):
        """Verifica si la sesión está activa (válida y no expirada)"""
        return self.is_valid and not self.is_expired
    
    def serialize(self):
        """Retorna una representación serializable de la sesión"""
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_valid": self.is_valid,
            "is_expired": self.is_expired,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None
        }
    
    def save(self):
        """Guarda la sesión en la base de datos de forma segura"""
        try:
            if not self.id:  # Si es una nueva sesión
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar sesión: {str(e)}")
    
    def invalidate(self):
        """Invalida la sesión actual"""
        try:
            self.is_valid = False
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al invalidar sesión: {str(e)}")
    
    def update_activity(self):
        """Actualiza la marca de tiempo de última actividad"""
        try:
            self.last_activity = datetime.utcnow()
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al actualizar actividad: {str(e)}")
    
    def extend_session(self, days=7):
        """Extiende la validez de la sesión"""
        try:
            self.expires_at = datetime.utcnow() + timedelta(days=days)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al extender sesión: {str(e)}")
    
    @classmethod
    def get_by_token(cls, token):
        """Obtiene una sesión por su token"""
        return cls.query.filter_by(session_token=token, is_valid=True).first()
    
    @classmethod
    def get_for_user(cls, usuario_id):
        """Obtiene todas las sesiones activas de un usuario"""
        return cls.query.filter_by(
            usuario_id=usuario_id, 
            is_valid=True
        ).filter(cls.expires_at > datetime.utcnow()).all()
    
    @classmethod
    def cleanup_expired(cls):
        """Limpia las sesiones expiradas de la base de datos"""
        try:
            expired = cls.query.filter(
                cls.expires_at < datetime.utcnow()
            ).update({'is_valid': False})
            db.session.commit()
            return expired
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al limpiar sesiones expiradas: {str(e)}")