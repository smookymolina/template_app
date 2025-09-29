from flask_login import UserMixin
from datetime import datetime, timezone
import bcrypt
from models import db, DatabaseError
from flask import url_for

class Usuario(db.Model, UserMixin):
    """
    Modelo para usuarios administradores y gerentes del sistema.
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    nombre = db.Column(db.String(100), nullable=True)
    telefono = db.Column(db.String(20), nullable=True)
    foto_url = db.Column(db.String(255), nullable=True)
    rol = db.Column(db.String(20), default='asesor', nullable=False)  # ✅ CAMBIO: Default 'asesor' en lugar de 'admin'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime, nullable=True)
    
    # ✅ NUEVO: Relación jerárquica - gerente_id para asesores
    gerente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    
    # ✅ NUEVO: Relaciones jerárquicas bidireccionales
    # Un gerente puede tener muchos asesores
    asesores = db.relationship('Usuario', backref=db.backref('gerente', remote_side='Usuario.id'), lazy='dynamic')
    
    # Relación con sesiones de usuario
    sessions = db.relationship('UserSession', backref='usuario', lazy='dynamic', cascade="all, delete-orphan")
    
    @property
    def password(self):
        """La contraseña no es un atributo legible"""
        raise AttributeError('La contraseña no es un atributo legible')
        
    @password.setter
    def password(self, password):
        """Genera un hash seguro de la contraseña"""
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), 
            bcrypt.gensalt()
        ).decode('utf-8')
    
    def check_password(self, password):
        """Verifica la contraseña"""
        return bcrypt.checkpw(
            password.encode('utf-8'), 
            self.password_hash.encode('utf-8')
        )

    def serialize(self):
        """Retorna una representación serializable del usuario con la URL completa de la foto."""

        # Construir la URL de la foto solo si existe el nombre del archivo
        foto_url_completa = None
        if self.foto_url:
            try:
                # Usar url_for para generar la URL dinámicamente solo si tenemos un contexto de request
                from flask import has_request_context
                if has_request_context():
                    foto_url_completa = url_for('main.serve_profile_image', filename=self.foto_url, _external=False)
                else:
                    # Fallback: construir URL manualmente sin contexto de request
                    foto_url_completa = f'/uploads/profile_images/{self.foto_url}'
            except Exception:
                # Fallback en caso de error
                foto_url_completa = f'/uploads/profile_images/{self.foto_url}'

        return {
            "id": self.id,
            "email": self.email,
            "nombre": self.nombre,
            "telefono": self.telefono,
            "foto_url": foto_url_completa, # Devolver la URL completa
            "rol": self.rol or 'asesor',
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            # ✅ NUEVO: Información jerárquica
            "gerente_id": self.gerente_id,
            "gerente_nombre": self.gerente.nombre if self.gerente else None,
            "total_asesores": self.asesores.count() if self.rol == 'gerente' else 0
        }
    
    def get_display_role(self):
        """Retorna el nombre descriptivo del rol"""
        role_names = {
            'admin': 'Administrador',
            'asesor': 'Gerente de Reclutamiento',
            'gerente': 'Gerente de Reclutamiento',  # ✅ AÑADIDO: Alias para gerente
            'user': 'Usuario'
        }
        return role_names.get(self.rol, 'Usuario')

    # ✅ NUEVAS FUNCIONES DE PERMISOS
    def is_admin(self):
        """Verifica si el usuario es administrador"""
        return self.rol == 'admin'
    
    ROLES_ALIAS = {
        'admin': 'Administrador del Sistema',
        'gerente': 'Gerente',
        'asesor': 'Asesor',
        'usuario': 'Usuario Básico'
    }

    @property
    def role_alias(self):
        return self.ROLES_ALIAS.get(self.rol, 'Rol Desconocido')

    def is_asesor(self):
        """Verifica si el usuario es estrictamente un asesor."""
        return self.rol == 'asesor'

    def is_gerente(self):
        """Verifica si el usuario es estrictamente un gerente."""
        return self.rol == 'gerente'
    
    def can_upload_excel(self):
        """Verifica si el usuario puede subir archivos Excel"""
        return self.rol == 'admin'
    
    def can_assign_asesores(self):
        """Verifica si el usuario puede asignar asesores"""
        return self.rol == 'admin'
    
    def can_see_all_reclutas(self):
        """Verifica si el usuario puede ver todos los reclutas"""
        return self.rol == 'admin'

    def has_permission(self, permission):
        """Verifica si el usuario tiene un permiso específico"""
        permissions = {
            'admin': ['all'],
            'asesor': ['view_assigned_reclutas', 'edit_assigned_reclutas', 'schedule_interviews'],
            'gerente': ['view_assigned_reclutas', 'edit_assigned_reclutas', 'schedule_interviews'],
            'user': ['view_profile']
        }
        user_permissions = permissions.get(self.rol, [])
        return 'all' in user_permissions or permission in user_permissions

    # ✅ NUEVOS MÉTODOS JERÁRQUICOS
    def get_mis_asesores(self):
        """Obtiene los asesores asignados a este gerente"""
        if self.rol != 'gerente':
            return []
        return self.asesores.filter_by(is_active=True).all()
    
    @classmethod
    def get_gerentes_activos(cls):
        """Método estático para obtener todos los gerentes activos"""
        return cls.query.filter_by(rol='gerente', is_active=True).all()
    
    @classmethod
    def get_asesores_sin_gerente(cls):
        """Método estático para obtener asesores sin gerente asignado"""
        return cls.query.filter_by(rol='asesor', is_active=True, gerente_id=None).all()
    
    def asignar_asesor(self, asesor_id):
        """Asigna un asesor a este gerente"""
        if self.rol != 'gerente':
            return False
        
        asesor = Usuario.query.get(asesor_id)
        if asesor and asesor.rol == 'asesor' and asesor.is_active:
            asesor.gerente_id = self.id
            db.session.commit()
            return True
        return False
    
    def puede_ver_recluta(self, recluta):
        """Verifica si el usuario puede ver un recluta específico"""
        if self.rol == 'admin':
            return True
        elif self.rol == 'gerente':
            # Gerente puede ver reclutas asignados a él o a sus asesores
            if recluta.asesor_id == self.id:
                return True
            # Verificar si el recluta está asignado a alguno de sus asesores
            mis_asesores_ids = [asesor.id for asesor in self.get_mis_asesores()]
            return recluta.asesor_id in mis_asesores_ids
        elif self.rol == 'asesor':
            # Asesor solo puede ver sus propios reclutas
            return recluta.asesor_id == self.id
        return False

    def validate_hierarchical_assignment(self, asesor_id):
        """
        Valida si este usuario puede asignar reclutas a un asesor específico
        """
        if self.rol == 'admin':
            return True  # Admin puede asignar a cualquiera
        elif self.rol == 'gerente':
            # Gerente solo puede asignar a sus asesores
            mis_asesores_ids = [asesor.id for asesor in self.get_mis_asesores()]
            return asesor_id in mis_asesores_ids or asesor_id == self.id
        else:
            return False  # Asesores no pueden redistribuir

    def can_access_asesor(self, asesor_id):
        """
        Valida si el usuario puede acceder a información de un asesor específico
        """
        if self.rol == 'admin':
            return True
        elif self.rol == 'gerente':
            mis_asesores_ids = [asesor.id for asesor in self.get_mis_asesores()]
            return asesor_id in mis_asesores_ids
        else:
            return asesor_id == self.id  # Asesor solo puede ver su propia info

    def get_jerarquia_completa(self):
        """Para admin: obtiene la estructura jerárquica completa con detalle de equipo"""
        if self.rol != 'admin':
            return None

        from models.recluta import Recluta

        gerentes = (
            Usuario.query
            .filter_by(rol='gerente', is_active=True)
            .order_by(Usuario.nombre.asc(), Usuario.email.asc())
            .all()
        )

        jerarquia = []

        for gerente in gerentes:
            asesores_activos = [
                asesor
                for asesor in gerente.get_mis_asesores()
                if asesor.is_active and asesor.rol == 'asesor'
            ]

            equipo_ids = [gerente.id] + [asesor.id for asesor in asesores_activos]
            reclutas_equipo = []
            if equipo_ids:
                reclutas_equipo = (
                    Recluta.query
                    .filter(Recluta.asesor_id.in_(equipo_ids))
                    .order_by(Recluta.nombre.asc())
                    .all()
                )

            reclutas_por_usuario = {}
            for recluta in reclutas_equipo:
                reclutas_por_usuario.setdefault(recluta.asesor_id, []).append(recluta)

            reclutas_directos = reclutas_por_usuario.get(gerente.id, [])

            asesores_data = []
            for asesor in sorted(
                asesores_activos,
                key=lambda a: ((a.nombre or '').lower(), (a.email or '').lower())
            ):
                reclutas_asesor = reclutas_por_usuario.get(asesor.id, [])
                asesores_data.append({
                    **asesor.serialize(),
                    'total_reclutas': len(reclutas_asesor),
                    'reclutas': [recluta.serialize() for recluta in reclutas_asesor],
                    'resumen_estados': self._build_recluta_status_summary(reclutas_asesor)
                })

            jerarquia.append({
                'gerente': {
                    **gerente.serialize(),
                    'total_reclutas_directos': len(reclutas_directos),
                    'resumen_estados': self._build_recluta_status_summary(reclutas_directos)
                },
                'asesores': asesores_data,
                'reclutas_directos': [recluta.serialize() for recluta in reclutas_directos],
                'resumen_equipo': self._build_recluta_status_summary(reclutas_equipo),
                'reclutas_gerente': len(reclutas_directos),
                'reclutas_total': len(reclutas_equipo)
            })

        return jerarquia

    @staticmethod
    def _build_recluta_status_summary(reclutas):
        """Genera un resumen por estado para listas de reclutas"""
        resumen = {}
        for recluta in reclutas:
            estado = (recluta.estado or 'Sin estado').strip()
            resumen[estado] = resumen.get(estado, 0) + 1
        return resumen

    def _count_reclutas_gerente(self, gerente_id):
        """Cuenta reclutas asignados directamente al gerente"""
        from models.recluta import Recluta
        return Recluta.query.filter_by(asesor_id=gerente_id).count()

    def _count_reclutas_equipo(self, gerente_id):
        """Cuenta reclutas asignados al gerente y sus asesores"""
        from models.recluta import Recluta
        gerente = Usuario.query.get(gerente_id)
        if not gerente:
            return 0

        asesores_ids = [asesor.id for asesor in gerente.get_mis_asesores()]
        asesores_ids.append(gerente.id)

        return Recluta.query.filter(Recluta.asesor_id.in_(asesores_ids)).count()

    def save(self):
        """Guarda el usuario en la base de datos de forma segura"""
        try:
            # ✅ ASEGURAR ROL ANTES DE GUARDAR
            if not self.rol:
                self.rol = 'asesor'
                
            if not self.id:  # Si es un nuevo usuario
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar usuario: {str(e)}")
    
    def update_last_login(self):
        """Actualiza la fecha del último inicio de sesión"""
        try:
            self.last_login = datetime.now(timezone.utc)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al actualizar último login: {str(e)}")