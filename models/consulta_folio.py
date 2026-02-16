from datetime import datetime
from models import db, DatabaseError


class ConsultaFolio(db.Model):
    """
    Registra cada consulta publica realizada al endpoint de tracking por folio.
    """
    __tablename__ = 'consulta_folio'

    id = db.Column(db.Integer, primary_key=True)
    recluta_id = db.Column(db.Integer, db.ForeignKey('recluta.id'), nullable=False, index=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(512), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    recluta = db.relationship('Recluta', backref=db.backref('consultas_folio', lazy='dynamic', cascade='all, delete-orphan'))

    def serialize(self):
        return {
            'id': self.id,
            'recluta_id': self.recluta_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

    def save(self):
        try:
            if not self.id:
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar consulta folio: {str(e)}")

    @classmethod
    def count_for_recluta(cls, recluta_id):
        return cls.query.filter_by(recluta_id=recluta_id).count()

    @classmethod
    def last_consulta_for_recluta(cls, recluta_id):
        return cls.query.filter_by(recluta_id=recluta_id)\
            .order_by(cls.timestamp.desc()).first()
