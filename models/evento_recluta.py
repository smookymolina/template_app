from datetime import datetime
from models import db, DatabaseError


class EventoRecluta(db.Model):
    """
    Evento de la línea de seguimiento/timeline personalizado por recluta.
    """
    __tablename__ = 'evento_recluta'

    id = db.Column(db.Integer, primary_key=True)
    recluta_id = db.Column(db.Integer, db.ForeignKey('recluta.id'), nullable=False, index=True)
    fecha = db.Column(db.Date, nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='pending')  # pending, completed, cancelled
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recluta = db.relationship('Recluta', backref=db.backref('eventos', lazy='dynamic', cascade='all, delete-orphan'))

    def serialize(self):
        return {
            'id': self.id,
            'recluta_id': self.recluta_id,
            'date': self.fecha.isoformat() if self.fecha else None,
            'status': self.estado,
            'title': self.titulo,
            'description': self.descripcion or '',
            'created_at': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'updated_at': self.ultima_actualizacion.isoformat() if self.ultima_actualizacion else None,
        }

    def save(self):
        try:
            if not self.id:
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar evento: {str(e)}")

    def delete(self):
        try:
            db.session.delete(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al eliminar evento: {str(e)}")

    @classmethod
    def get_for_recluta(cls, recluta_id):
        return (
            cls.query.filter_by(recluta_id=recluta_id)
            .order_by(cls.fecha.asc(), cls.id.asc())
            .all()
        )

    @classmethod
    def get_by_id(cls, event_id):
        return cls.query.get(event_id)

