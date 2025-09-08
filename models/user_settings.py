from models import db, DatabaseError
from datetime import datetime
import json

class UserSettings(db.Model):
    """
    Modelo para guardar las preferencias y configuraciones de usuario.
    """
    __tablename__ = 'user_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    key = db.Column(db.String(50), nullable=False)
    value = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con Usuario
    usuario = db.relationship('Usuario', backref='settings')
    
    # Índice único para usuario_id + key
    __table_args__ = (db.UniqueConstraint('usuario_id', 'key', name='_user_setting_key_unique'),)
    
    @classmethod
    def get_user_settings(cls, usuario_id):
        """
        Obtiene todas las configuraciones de un usuario como diccionario.
        
        Args:
            usuario_id: ID del usuario
            
        Returns:
            dict: Diccionario con las configuraciones del usuario
        """
        settings = cls.query.filter_by(usuario_id=usuario_id).all()
        result = {}
        
        for setting in settings:
            try:
                # Intentar parsear como JSON, sino usar valor directo
                result[setting.key] = json.loads(setting.value)
            except (json.JSONDecodeError, TypeError):
                result[setting.key] = setting.value
                
        return result
    
    @classmethod
    def set_user_setting(cls, usuario_id, key, value):
        """
        Establece o actualiza una configuración de usuario.
        
        Args:
            usuario_id: ID del usuario
            key: Clave de la configuración
            value: Valor de la configuración
            
        Returns:
            bool: True si se guardó correctamente, False en caso contrario
        """
        try:
            # Buscar configuración existente
            setting = cls.query.filter_by(usuario_id=usuario_id, key=key).first()
            
            # Convertir valor a JSON si es necesario
            if isinstance(value, (dict, list)):
                json_value = json.dumps(value)
            elif isinstance(value, bool):
                json_value = json.dumps(value)
            else:
                json_value = str(value)
            
            if setting:
                # Actualizar existente
                setting.value = json_value
                setting.updated_at = datetime.utcnow()
            else:
                # Crear nuevo
                setting = cls(
                    usuario_id=usuario_id,
                    key=key,
                    value=json_value
                )
                db.session.add(setting)
            
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar configuración: {str(e)}")
    
    @classmethod
    def get_user_setting(cls, usuario_id, key, default=None):
        """
        Obtiene una configuración específica de usuario.
        
        Args:
            usuario_id: ID del usuario
            key: Clave de la configuración
            default: Valor por defecto si no existe
            
        Returns:
            Valor de la configuración o valor por defecto
        """
        setting = cls.query.filter_by(usuario_id=usuario_id, key=key).first()
        
        if not setting:
            return default
        
        try:
            # Intentar parsear como JSON
            return json.loads(setting.value)
        except (json.JSONDecodeError, TypeError):
            return setting.value
    
    @classmethod
    def delete_user_setting(cls, usuario_id, key):
        """
        Elimina una configuración específica de usuario.
        
        Args:
            usuario_id: ID del usuario
            key: Clave de la configuración
            
        Returns:
            bool: True si se eliminó correctamente
        """
        try:
            setting = cls.query.filter_by(usuario_id=usuario_id, key=key).first()
            if setting:
                db.session.delete(setting)
                db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al eliminar configuración: {str(e)}")
    
    @classmethod
    def delete_all_user_settings(cls, usuario_id):
        """
        Elimina todas las configuraciones de un usuario.
        
        Args:
            usuario_id: ID del usuario
            
        Returns:
            bool: True si se eliminaron correctamente
        """
        try:
            cls.query.filter_by(usuario_id=usuario_id).delete()
            db.session.commit()
            return True
            
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al eliminar configuraciones: {str(e)}")
    
    def serialize(self):
        """
        Serializa la configuración para API.
        
        Returns:
            dict: Representación serializable de la configuración
        """
        try:
            parsed_value = json.loads(self.value)
        except (json.JSONDecodeError, TypeError):
            parsed_value = self.value
            
        return {
            'id': self.id,
            'key': self.key,
            'value': parsed_value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<UserSettings {self.usuario_id}:{self.key}>'