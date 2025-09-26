from datetime import datetime

from models import db


class FichaDeposito(db.Model):
    """Modelo para registrar fichas de deposito semanales por gerente."""

    __tablename__ = 'ficha_deposito'

    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    nombre_depositante = db.Column(db.String(150), nullable=False)
    banco = db.Column(db.String(100), nullable=False)
    monto = db.Column(db.Numeric(10, 2), nullable=False)
    gerente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    gerente = db.relationship('Usuario', backref=db.backref('fichas_deposito', lazy='dynamic'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<FichaDeposito {self.id} - {self.monto} - Gerente {self.gerente_id}>"

    def serialize(self):
        """Retorna una representacion serializable de la ficha de deposito."""
        monto_value = float(self.monto) if self.monto is not None else 0.0
        return {
            'id': self.id,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'nombre_depositante': self.nombre_depositante,
            'banco': self.banco,
            'monto': monto_value,
            'gerente_id': self.gerente_id,
            'gerente_nombre': self.gerente.nombre if self.gerente else 'N/A',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
