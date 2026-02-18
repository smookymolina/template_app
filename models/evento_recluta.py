from datetime import datetime
from models import db, DatabaseError

# Tabla de asociación many-to-many entre EventoRecluta y Documento
evento_recluta_documento = db.Table(
    'evento_recluta_documento',
    db.Column('evento_id', db.Integer, db.ForeignKey('evento_recluta.id', ondelete='CASCADE'), primary_key=True),
    db.Column('documento_id', db.Integer, db.ForeignKey('documento.id', ondelete='CASCADE'), primary_key=True)
)


class EventoRecluta(db.Model):
    """
    Evento de la línea de seguimiento/timeline personalizado por recluta.
    """
    __tablename__ = 'evento_recluta'

    id = db.Column(db.Integer, primary_key=True)
    recluta_id = db.Column(db.Integer, db.ForeignKey('recluta.id'), nullable=False, index=True)
    documento_id = db.Column(db.Integer, db.ForeignKey('documento.id'), nullable=True)  # legado
    fecha = db.Column(db.Date, nullable=False)
    estado = db.Column(db.String(20), nullable=False, default='pending')  # pending, completed, cancelled
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recluta = db.relationship('Recluta', backref=db.backref('eventos', lazy='dynamic', cascade='all, delete-orphan'))
    documento = db.relationship('Documento', backref=db.backref('evento', uselist=False), foreign_keys=[documento_id])
    documentos = db.relationship(
        'Documento',
        secondary=evento_recluta_documento,
        lazy='joined',
        backref=db.backref('eventos_asociados', lazy='dynamic')
    )

    def serialize(self):
        docs_list = [
            {'id': doc.id, 'nombre': doc.nombre, 'tipo': doc.tipo}
            for doc in (self.documentos or [])
        ]
        data = {
            'id': self.id,
            'recluta_id': self.recluta_id,
            'date': self.fecha.isoformat() if self.fecha else None,
            'status': self.estado,
            'title': self.titulo,
            'description': self.descripcion or '',
            'created_at': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'updated_at': self.ultima_actualizacion.isoformat() if self.ultima_actualizacion else None,
            'documentos': docs_list,
        }
        # Retrocompatibilidad: campos singulares para código existente
        data['documento_id'] = docs_list[0]['id'] if docs_list else self.documento_id
        data['documento'] = docs_list[0] if docs_list else (
            {'id': self.documento.id, 'nombre': self.documento.nombre, 'tipo': self.documento.tipo}
            if self.documento else None
        )
        return data

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
