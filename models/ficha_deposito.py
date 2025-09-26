from models import db
from datetime import datetime, timezone

class FichaDeposito(db.Model):
    """
    Modelo para registrar las fichas de depósito semanales por gerente.
    """
    __tablename__ = 'ficha_deposito'

    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    nombre_depositante = db.Column(db.String(150), nullable=False)
    banco = db.Column(db.String(100), nullable=False)
    monto = db.Column(db.Numeric(10, 2), nullable=False)
    
    gerente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    # Relación para acceder al objeto Gerente (Usuario) desde una Ficha
    gerente = db.relationship('Usuario', backref=db.backref('fichas_deposito', lazy='dynamic'))

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<FichaDeposito {self.id} - {self.monto} - Gerente {self.gerente_id}>'

    def serialize(self):
        """Retorna una representación serializable de la ficha de depósito."""
        return {
            "id": self.id,
            "fecha": self.fecha.isoformat(),
            "nombre_depositante": self.nombre_depositante,
            "banco": self.banco,
            "monto": str(self.monto),
            "gerente_id": self.gerente_id,
            "gerente_nombre": self.gerente.nombre if self.gerente else "N/A",
            "created_at": self.created_at.isoformat()
        }
