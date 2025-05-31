from datetime import datetime
from models import db, DatabaseError
import uuid 
import logging

class Recluta(db.Model):
    """
    Modelo para candidatos o reclutas gestionados en el sistema.
    ✅ CON GENERACIÓN AUTOMÁTICA Y GARANTIZADA DE FOLIOS
    """
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(20), nullable=False)
    estado = db.Column(db.String(20), nullable=False)  # Activo, En proceso, Rechazado
    puesto = db.Column(db.String(100), nullable=True)
    notas = db.Column(db.Text, nullable=True)
    folio = db.Column(db.String(20), unique=True, nullable=False)  # ✅ OBLIGATORIO Y ÚNICO
    foto_url = db.Column(db.String(255), nullable=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    ultima_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relación con entrevistas
    entrevistas = db.relationship('Entrevista', backref='recluta', lazy='dynamic', cascade="all, delete-orphan")
    asesor_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    asesor = db.relationship('Usuario', backref='reclutas_asignados')

    def __init__(self, **kwargs):
        """
        ✅ CONSTRUCTOR CON GENERACIÓN AUTOMÁTICA DE FOLIO
        """
        super(Recluta, self).__init__(**kwargs)
        # Si no se proporciona folio, generar uno automáticamente
        if not self.folio:
            self.folio = self._generar_folio_unico()
            logging.info(f"✅ Folio generado automáticamente: {self.folio}")
    
    def _generar_folio_unico(self):
        """
        ✅ GENERA UN FOLIO ÚNICO CON FORMATO REC-XXXXXXXX
        """
        max_attempts = 10
        for attempt in range(max_attempts):
            # Generar folio con formato REC-XXXXXXXX (8 caracteres hexadecimales)
            folio_candidate = f"REC-{uuid.uuid4().hex[:8].upper()}"
            
            # Verificar que no exista en la base de datos
            if not Recluta.query.filter_by(folio=folio_candidate).first():
                logging.info(f"✅ Folio único generado: {folio_candidate} (intento {attempt + 1})")
                return folio_candidate
            
            logging.warning(f"⚠️ Folio {folio_candidate} ya existe, reintentando... (intento {attempt + 1})")
        
        # Si después de 10 intentos no se pudo generar, usar timestamp
        timestamp_hex = hex(int(datetime.utcnow().timestamp()))[2:].upper()
        fallback_folio = f"REC-{timestamp_hex}"
        logging.warning(f"🔄 Usando folio de respaldo: {fallback_folio}")
        return fallback_folio

    @classmethod
    def generar_folio_nuevo(cls):
        """
        ✅ MÉTODO ESTÁTICO PARA GENERAR FOLIOS ÚNICOS
        """
        temp_recluta = cls()
        return temp_recluta._generar_folio_unico()
    
    def serialize(self):
        """
        ✅ SERIALIZACIÓN MEJORADA CON VERIFICACIÓN DE FOLIO
        """
        # Asegurar que siempre haya un folio
        if not self.folio:
            self.folio = self._generar_folio_unico()
            logging.warning(f"⚠️ Folio faltante generado durante serialización: {self.folio}")
        
        return {
            'id': self.id,
            'nombre': self.nombre,
            'email': self.email,
            'telefono': self.telefono,
            'estado': self.estado,
            'puesto': self.puesto,
            'notas': self.notas,
            'folio': self.folio,  # ✅ SIEMPRE INCLUIDO
            'foto_url': self.foto_url,
            'fecha_registro': self.fecha_registro.isoformat() if self.fecha_registro else None,
            'ultima_actualizacion': self.ultima_actualizacion.isoformat() if self.ultima_actualizacion else None,
            'asesor_id': self.asesor_id,
            'asesor_nombre': self.asesor.nombre if self.asesor else (self.asesor.email if self.asesor else None)
        }
    
    def save(self):
        """
        ✅ GUARDA EL RECLUTA CON VERIFICACIÓN DE FOLIO
        """
        try:
            # ✅ VERIFICAR Y GENERAR FOLIO SI ES NECESARIO
            if not self.folio:
                self.folio = self._generar_folio_unico()
                logging.info(f"✅ Folio generado durante save(): {self.folio}")
            
            # Verificar que el folio sea único (por si acaso)
            if self.id is None:  # Solo para nuevos reclutas
                existing = Recluta.query.filter_by(folio=self.folio).first()
                if existing:
                    # Regenerar folio si ya existe
                    old_folio = self.folio
                    self.folio = self._generar_folio_unico()
                    logging.warning(f"🔄 Folio duplicado {old_folio} reemplazado por {self.folio}")
            
            if not self.id:  # Si es un nuevo recluta
                db.session.add(self)
                logging.info(f"➕ Nuevo recluta añadido: {self.nombre} con folio {self.folio}")
            else:
                logging.info(f"✏️ Recluta actualizado: {self.nombre} (ID: {self.id})")
            
            db.session.commit()
            logging.info(f"✅ Recluta guardado exitosamente: {self.folio}")
            return True
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"❌ Error al guardar recluta: {str(e)}")
            raise DatabaseError(f"Error al guardar recluta: {str(e)}")
    
    def delete(self):
        """
        ✅ ELIMINA EL RECLUTA DE FORMA SEGURA
        """
        try:
            folio_info = self.folio
            nombre_info = self.nombre
            
            db.session.delete(self)
            db.session.commit()
            
            logging.info(f"🗑️ Recluta eliminado: {nombre_info} (folio: {folio_info})")
            return True
            
        except Exception as e:
            db.session.rollback()
            logging.error(f"❌ Error al eliminar recluta: {str(e)}")
            raise DatabaseError(f"Error al eliminar recluta: {str(e)}")
    
    @classmethod
    def get_by_folio(cls, folio):
        """
        ✅ OBTENER RECLUTA POR FOLIO (PARA TRACKING PÚBLICO)
        """
        if not folio:
            return None
        
        # Normalizar folio (mayúsculas y sin espacios)
        folio_normalized = folio.strip().upper()
        
        recluta = cls.query.filter_by(folio=folio_normalized).first()
        if recluta:
            logging.info(f"🔍 Recluta encontrado por folio: {folio_normalized}")
        else:
            logging.warning(f"❌ No se encontró recluta con folio: {folio_normalized}")
        
        return recluta
    
    @classmethod
    def get_by_id(cls, recluta_id, current_user=None):
        """
        ✅ OBTENER RECLUTA POR ID CON VERIFICACIÓN DE PERMISOS
        """
        recluta = cls.query.get(recluta_id)
        
        if not recluta:
            return None
        
        # Si hay usuario y es asesor, verificar que tenga permiso
        if current_user and hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            if recluta.asesor_id != current_user.id:
                logging.warning(f"🚫 Asesor {current_user.id} sin permisos para recluta {recluta_id}")
                return None
        
        return recluta

    @classmethod
    def get_all(cls, page=1, per_page=10, search=None, estado=None, sort_by='id', sort_order='asc', current_user=None):
        """
        ✅ OBTENER TODOS LOS RECLUTAS CON PAGINACIÓN Y FILTROS
        """
        query = cls.query
        
        # Si hay usuario actual y es asesor, filtrar por asesor_id
        if current_user and hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            query = query.filter_by(asesor_id=current_user.id)
            logging.info(f"🔒 Filtrando reclutas para asesor {current_user.id}")
        
        # Aplicar filtros si existen
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    cls.nombre.ilike(search_term),
                    cls.email.ilike(search_term),
                    cls.telefono.ilike(search_term),
                    cls.puesto.ilike(search_term),
                    cls.folio.ilike(search_term)  # ✅ INCLUIR BÚSQUEDA POR FOLIO
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
        result = query.paginate(page=page, per_page=per_page, error_out=False)
        logging.info(f"📊 Consulta paginada: {result.total} reclutas encontrados")
        return result

    @classmethod
    def get_by_email_and_phone(cls, email, telefono):
        """
        ✅ BUSCAR RECLUTA POR EMAIL Y TELÉFONO (PARA RECUPERACIÓN DE FOLIO)
        """
        if not email or not telefono:
            return None
        
        # Normalizar datos
        email_normalized = email.strip().lower()
        telefono_normalized = telefono.strip()
        
        recluta = cls.query.filter_by(
            email=email_normalized, 
            telefono=telefono_normalized
        ).first()
        
        if recluta:
            logging.info(f"🔍 Recluta encontrado para recuperación: {email_normalized}")
        else:
            logging.warning(f"❌ No se encontró recluta para: {email_normalized}")
        
        return recluta

    def get_tracking_info(self):
        """
        ✅ INFORMACIÓN PÚBLICA PARA TRACKING (SIN DATOS SENSIBLES)
        """
        # Obtener próxima entrevista
        proxima_entrevista = None
        entrevista = self.entrevistas.filter_by(estado='pendiente').order_by('fecha').first()
        
        if entrevista:
            proxima_entrevista = {
                "fecha": entrevista.fecha.strftime('%d/%m/%Y'),
                "hora": entrevista.hora,
                "tipo": entrevista.tipo
            }
        
        return {
            "nombre": self.nombre,
            "estado": self.estado,
            "fecha_registro": self.fecha_registro.strftime('%d/%m/%Y') if self.fecha_registro else None,
            "ultima_actualizacion": self.ultima_actualizacion.strftime('%d/%m/%Y') if self.ultima_actualizacion else None,
            "proxima_entrevista": proxima_entrevista
        }

    def __repr__(self):
        return f'<Recluta {self.folio}: {self.nombre}>'

# ✅ FUNCIÓN AUXILIAR PARA VERIFICAR INTEGRIDAD DE FOLIOS
def verificar_folios_existentes():
    """
    Verifica y repara reclutas sin folio (función de mantenimiento)
    """
    reclutas_sin_folio = Recluta.query.filter(
        db.or_(Recluta.folio.is_(None), Recluta.folio == '')
    ).all()
    
    if reclutas_sin_folio:
        logging.warning(f"⚠️ Encontrados {len(reclutas_sin_folio)} reclutas sin folio")
        
        for recluta in reclutas_sin_folio:
            old_folio = recluta.folio
            recluta.folio = recluta._generar_folio_unico()
            
            try:
                db.session.commit()
                logging.info(f"🔧 Folio reparado: {recluta.nombre} -> {recluta.folio}")
            except Exception as e:
                db.session.rollback()
                logging.error(f"❌ Error reparando folio para {recluta.nombre}: {e}")
    else:
        logging.info("✅ Todos los reclutas tienen folio asignado")

# ✅ EVENTO PARA ASEGURAR FOLIO ANTES DE INSERT
from sqlalchemy import event

@event.listens_for(Recluta, 'before_insert')
def receive_before_insert(mapper, connection, target):
    """
    Evento que se ejecuta antes de insertar un recluta
    Asegura que siempre tenga un folio
    """
    if not target.folio:
        target.folio = target._generar_folio_unico()
        logging.info(f"🔧 Folio asignado por evento before_insert: {target.folio}")