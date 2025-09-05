from datetime import datetime
from models import db


class Documento(db.Model):
    __tablename__ = 'documento'

    id = db.Column(db.Integer, primary_key=True)
    recluta_id = db.Column(db.Integer, db.ForeignKey('recluta.id'), nullable=False, index=True)
    nombre = db.Column(db.String(255), nullable=False)
    url = db.Column(db.String(512), nullable=False)
    tipo = db.Column(db.String(50), nullable=True)
    tamano = db.Column(db.Integer, nullable=True)
    fecha_subida = db.Column(db.DateTime, default=datetime.utcnow)

    recluta = db.relationship('Recluta', backref=db.backref('documentos', lazy='dynamic', cascade='all, delete-orphan'))

    def serialize(self):
        return {
            'id': self.id,
            'recluta_id': self.recluta_id,
            'nombre': self.nombre,
            'url': self.url,
            'tipo': self.tipo,
            'tamano': self.tamano,
            'fecha_subida': self.fecha_subida.isoformat() if self.fecha_subida else None,
        }

