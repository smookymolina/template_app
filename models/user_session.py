from datetime import datetime
from models import db, DatabaseError

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    session_token = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    is_valid = db.Column(db.Boolean, default=True)
    user_agent = db.Column(db.String(255), nullable=True)
    
    @property
    def is_expired(self):
        """Verifica si la sesión ha expirado"""
        return datetime.utcnow() > self.expires_at if self.expires_at else True
    
    @property
    def is_valid_session(self):
        """Verifica si la sesión es válida y no ha expirado"""
        return self.is_valid and not self.is_expired
    
    def save(self):
        try:
            db.session.add(self)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar sesión: {str(e)}")
    
    def invalidate(self):
        """Invalida esta sesión"""
        self.is_valid = False
        self.save()
    
    def serialize(self):
        """Serializa la sesión para API"""
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "ip_address": self.ip_address,
            "created_at": self.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "expires_at": self.expires_at.strftime('%Y-%m-%d %H:%M:%S') if self.expires_at else None,
            "is_valid": self.is_valid,
            "is_expired": self.is_expired,
            "user_agent": self.user_agent
        }
    
    @classmethod
    def get_for_user(cls, usuario_id):
        """Obtiene todas las sesiones activas de un usuario"""
        return cls.query.filter_by(
            usuario_id=usuario_id,
            is_valid=True
        ).filter(
            cls.expires_at > datetime.utcnow()
        ).all()
    
    @classmethod
    def get_valid_session(cls, session_token, usuario_id):
        """Obtiene una sesión válida por token y usuario"""
        return cls.query.filter_by(
            session_token=session_token,
            usuario_id=usuario_id,
            is_valid=True
        ).filter(
            cls.expires_at > datetime.utcnow()
        ).first()
    
    @classmethod
    def cleanup_expired(cls):
        """Limpia las sesiones expiradas de la base de datos"""
        expired_sessions = cls.query.filter(
            cls.expires_at < datetime.utcnow()
        ).all()
        
        for session in expired_sessions:
            session.is_valid = False
        
        db.session.commit()
        return len(expired_sessions)