from datetime import datetime
from models import db, DatabaseError
import uuid 

class Recluta(db.Model):
    """
    Modelo para candidatos o reclutas gestionados en el sistema.
    """
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(20), nullable=False)
    estado = db.Column(db.String(20), nullable=False)  # Activo, En proceso, Rechazado
    puesto = db.Column(db.String(100), nullable=True)
    notas = db.Column(db.Text, nullable=True)
    folio = db.Column(db.String(20), unique=True, nullable=False)
    foto_url = db.Column(db.String(255), nullable=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con entrevistas
    entrevistas = db.relationship('Entrevista', backref='recluta', lazy='dynamic', cascade="all, delete-orphan")
    asesor_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    asesor = db.relationship('Usuario', backref='reclutas_asignados')
    
    def serialize(self):
        """Retorna una representación serializable del recluta"""
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'telefono': self.telefono,
            'estado': self.estado,
            'puesto': self.puesto,
            'notas': self.notas,
            'folio': self.folio,
            'foto_url': self.foto_url,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'ultima_actualizacion': self.ultima_actualizacion.isoformat() if self.ultima_actualizacion else None,
            'asesor_id': self.asesor_id,
            'asesor_nombre': self.asesor.nombre if self.asesor else (self.asesor.email if self.asesor else None)
        }
    
    def save(self):
        """Guarda el recluta en la base de datos de forma segura"""
        try:
            if not self.folio:
                # Asegurar que el folio sea único
                while True:
                    temp_folio = f"REC-{uuid.uuid4().hex[:8].upper()}"
                    if Recluta.query.filter_by(folio=temp_folio).first() is None:
                        self.folio = temp_folio
                        break
                    
            if not self.id:  # Si es un nuevo recluta
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar recluta: {str(e)}")
    
    def delete(self):
        """Elimina el recluta de la base de datos de forma segura"""
        try:
            db.session.delete(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al eliminar recluta: {str(e)}")
    
    @classmethod
    def get_by_id(cls, recluta_id):
        """Obtiene un recluta por su ID"""
        return cls.query.get(recluta_id)
    
    @classmethod
    def get_all(cls, page=1, per_page=10, search=None, estado=None, sort_by='id', sort_order='asc'):
        """
        Obtiene todos los reclutas con paginación y filtros.
        
        Args:
            page: Número de página
            per_page: Elementos por página
            search: Texto para buscar en nombre, email, teléfono o puesto
            estado: Filtrar por estado
            sort_by: Campo por el que ordenar
            sort_order: Dirección de ordenamiento ('asc' o 'desc')
            
        Returns:
            Objeto de paginación SQLAlchemy
        """
        query = cls.query
        
        # Aplicar filtros si existen
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    cls.nombre.ilike(search_term),
                    cls.email.ilike(search_term),
                    cls.telefono.ilike(search_term),
                    cls.puesto.ilike(search_term)
                )
            )
        
        if estado:
            query = query.filter_by(estado=estado)
        
        # Aplicar ordenamiento
        if hasattr(cls, sort_by):
            attr = getattr(cls, sort_by)
            if sort_order.lower() == 'desc':
                attr = attr.desc()
            query = query.order_by(attr)
        
        # Retornar con paginación
        return query.paginate(page=page, per_page=per_page, error_out=False)