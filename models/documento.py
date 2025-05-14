from datetime import datetime
from models import db, DatabaseError

class Documento(db.Model):
    """
    Modelo para los documentos PDF subidos por los reclutas.
    """
    id = db.Column(db.Integer, primary_key=True)
    recluta_id = db.Column(db.Integer, db.ForeignKey('recluta.id'), nullable=False)
    nombre = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    tipo = db.Column(db.String(50), default='pdf')
    tamaño = db.Column(db.Integer)  # Tamaño en bytes
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)
    
    def serialize(self):
        """Retorna una representación serializable del documento"""
        return {
            'id': self.id,
            'recluta_id': self.recluta_id,
            'nombre': self.nombre,
            'url': self.url,
            'tipo': self.tipo,
            'tamaño': self.tamaño,
            'fecha_subida': self.fecha_subida.isoformat() if self.fecha_subida else None
        }
    
    def save(self):
        """Guarda el documento en la base de datos de forma segura"""
        try:
            if not self.id:
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar documento: {str(e)}")