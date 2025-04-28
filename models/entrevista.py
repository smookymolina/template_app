from datetime import datetime
from models import db, DatabaseError

class Entrevista(db.Model):
    """
    Modelo para las entrevistas programadas con los reclutas.
    """
    id = db.Column(db.Integer, primary_key=True)
    recluta_id = db.Column(db.Integer, db.ForeignKey('recluta.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    hora = db.Column(db.String(10), nullable=False)  # Formato "HH:MM"
    duracion = db.Column(db.Integer, default=60)  # Duración en minutos
    tipo = db.Column(db.String(20), default='presencial')  # presencial, virtual, telefonica
    ubicacion = db.Column(db.String(200), nullable=True)
    notas = db.Column(db.Text, nullable=True)
    estado = db.Column(db.String(20), default='pendiente')  # pendiente, completada, cancelada
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def serialize(self):
        """Retorna una representación serializable de la entrevista"""
        return {
            'id': self.id,
            'recluta_id': self.recluta_id,
            'recluta_nombre': self.recluta.nombre if self.recluta else None,
            'fecha': self.fecha.isoformat() if self.fecha else None,
            'hora': self.hora,
            'duracion': self.duracion,
            'tipo': self.tipo,
            'ubicacion': self.ubicacion,
            'notas': self.notas,
            'estado': self.estado,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'ultima_actualizacion': self.ultima_actualizacion.isoformat() if self.ultima_actualizacion else None
        }
    
    def save(self):
        """Guarda la entrevista en la base de datos de forma segura"""
        try:
            if not self.id:  # Si es una nueva entrevista
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar entrevista: {str(e)}")
    
    def delete(self):
        """Elimina la entrevista de la base de datos de forma segura"""
        try:
            db.session.delete(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al eliminar entrevista: {str(e)}")
    
    @classmethod
    def get_by_id(cls, entrevista_id):
        """Obtiene una entrevista por su ID"""
        return cls.query.get(entrevista_id)
    
    @classmethod
    def get_for_recluta(cls, recluta_id):
        """Obtiene todas las entrevistas de un recluta específico"""
        return cls.query.filter_by(recluta_id=recluta_id).order_by(cls.fecha, cls.hora).all()
    
    @classmethod
    def get_pending(cls):
        """Obtiene todas las entrevistas pendientes"""
        return cls.query.filter_by(estado='pendiente').order_by(cls.fecha, cls.hora).all()
    
    @classmethod
    def get_for_date(cls, date):
        """Obtiene todas las entrevistas para una fecha específica"""
        return cls.query.filter_by(fecha=date).order_by(cls.hora).all()
    
    @classmethod
    def get_upcoming(cls, limit=5):
        """Obtiene las próximas entrevistas pendientes"""
        today = datetime.now().date()
        return cls.query.filter(
            cls.fecha >= today,
            cls.estado == 'pendiente'
        ).order_by(cls.fecha, cls.hora).limit(limit).all()
    
    @classmethod
    def count_by_month(cls, year):
        """Cuenta las entrevistas agrupadas por mes para un año específico"""
        # Esta consulta podría requerir ajustes según el motor de base de datos
        result = {}
        for month in range(1, 13):
            count = cls.query.filter(
                db.extract('year', cls.fecha) == year,
                db.extract('month', cls.fecha) == month
            ).count()
            result[month] = count
        return result