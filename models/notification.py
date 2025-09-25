from datetime import datetime
from models import db, DatabaseError

class Notification(db.Model):
    """
    Modelo para las notificaciones del sistema.
    Específicamente para notificar a administradores sobre acciones de asesores/gerentes.
    """
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    mensaje = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(50), default='entrevista')  # entrevista, sistema, recordatorio
    accion = db.Column(db.String(50), nullable=False)  # crear, eliminar, actualizar

    # Usuario que realizó la acción
    usuario_origen_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)

    # Usuario que debe recibir la notificación (generalmente admin)
    usuario_destino_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)

    # ID del recurso relacionado (entrevista, recluta, etc.)
    recurso_id = db.Column(db.Integer, nullable=True)
    recurso_tipo = db.Column(db.String(50), nullable=True)  # entrevista, recluta

    # Estado de la notificación
    leida = db.Column(db.Boolean, default=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_lectura = db.Column(db.DateTime, nullable=True)

    # Relaciones
    usuario_origen = db.relationship('Usuario', foreign_keys=[usuario_origen_id], backref='notificaciones_enviadas')
    usuario_destino = db.relationship('Usuario', foreign_keys=[usuario_destino_id], backref='notificaciones_recibidas')

    def serialize(self):
        """Retorna una representación serializable de la notificación"""
        return {
            'id': self.id,
            'titulo': self.titulo,
            'mensaje': self.mensaje,
            'tipo': self.tipo,
            'accion': self.accion,
            'usuario_origen_id': self.usuario_origen_id,
            'usuario_origen_nombre': self.usuario_origen.nombre if self.usuario_origen else None,
            'usuario_origen_rol': self.usuario_origen.rol if self.usuario_origen else None,
            'usuario_destino_id': self.usuario_destino_id,
            'recurso_id': self.recurso_id,
            'recurso_tipo': self.recurso_tipo,
            'leida': self.leida,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_lectura': self.fecha_lectura.isoformat() if self.fecha_lectura else None,
            'tiempo_relativo': self._get_tiempo_relativo()
        }

    def _get_tiempo_relativo(self):
        """Calcula el tiempo relativo desde la creación de la notificación"""
        if not self.fecha_creacion:
            return "hace un momento"

        now = datetime.utcnow()
        diff = now - self.fecha_creacion

        if diff.days > 7:
            return f"hace {diff.days} días"
        elif diff.days > 0:
            return f"hace {diff.days} día{'s' if diff.days > 1 else ''}"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"hace {hours} hora{'s' if hours > 1 else ''}"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"hace {minutes} minuto{'s' if minutes > 1 else ''}"
        else:
            return "hace un momento"

    def marcar_como_leida(self):
        """Marca la notificación como leída"""
        try:
            self.leida = True
            self.fecha_lectura = datetime.utcnow()
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al marcar notificación como leída: {str(e)}")

    def save(self):
        """Guarda la notificación en la base de datos de forma segura"""
        try:
            if not self.id:  # Si es una nueva notificación
                db.session.add(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al guardar notificación: {str(e)}")

    def delete(self):
        """Elimina la notificación de la base de datos de forma segura"""
        try:
            db.session.delete(self)
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al eliminar notificación: {str(e)}")

    @classmethod
    def crear_notificacion_entrevista(cls, accion, usuario_origen_id, entrevista_id, recluta_nombre=None):
        """
        Método de conveniencia para crear notificaciones de entrevistas
        """
        from models.usuario import Usuario

        # Obtener todos los administradores
        administradores = Usuario.query.filter_by(rol='admin', is_active=True).all()
        usuario_origen = Usuario.query.get(usuario_origen_id)

        if not usuario_origen:
            return False

        # Mapear acciones a mensajes
        acciones_map = {
            'crear': {
                'titulo': 'Nueva entrevista programada',
                'mensaje': f'{usuario_origen.nombre} ({usuario_origen.role_alias}) ha programado una nueva entrevista'
            },
            'eliminar': {
                'titulo': 'Entrevista eliminada',
                'mensaje': f'{usuario_origen.nombre} ({usuario_origen.role_alias}) ha eliminado una entrevista'
            },
            'actualizar': {
                'titulo': 'Entrevista modificada',
                'mensaje': f'{usuario_origen.nombre} ({usuario_origen.role_alias}) ha modificado una entrevista'
            }
        }

        if accion not in acciones_map:
            return False

        info_accion = acciones_map[accion]
        if recluta_nombre:
            info_accion['mensaje'] += f' para {recluta_nombre}'

        # Crear notificación para cada administrador
        notificaciones_creadas = []
        for admin in administradores:
            try:
                notificacion = cls(
                    titulo=info_accion['titulo'],
                    mensaje=info_accion['mensaje'],
                    tipo='entrevista',
                    accion=accion,
                    usuario_origen_id=usuario_origen_id,
                    usuario_destino_id=admin.id,
                    recurso_id=entrevista_id,
                    recurso_tipo='entrevista'
                )

                if notificacion.save():
                    notificaciones_creadas.append(notificacion)
            except Exception as e:
                print(f"Error al crear notificación para admin {admin.id}: {str(e)}")
                continue

        return len(notificaciones_creadas) > 0

    @classmethod
    def get_for_user(cls, usuario_id, limit=20, solo_no_leidas=False):
        """Obtiene las notificaciones para un usuario específico"""
        query = cls.query.filter_by(usuario_destino_id=usuario_id)

        if solo_no_leidas:
            query = query.filter_by(leida=False)

        return query.order_by(cls.fecha_creacion.desc()).limit(limit).all()

    @classmethod
    def count_no_leidas(cls, usuario_id):
        """Cuenta las notificaciones no leídas para un usuario"""
        return cls.query.filter_by(usuario_destino_id=usuario_id, leida=False).count()

    @classmethod
    def marcar_todas_como_leidas(cls, usuario_id):
        """Marca todas las notificaciones de un usuario como leídas"""
        try:
            cls.query.filter_by(usuario_destino_id=usuario_id, leida=False).update({
                'leida': True,
                'fecha_lectura': datetime.utcnow()
            })
            db.session.commit()
            return True
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al marcar todas las notificaciones como leídas: {str(e)}")

    @classmethod
    def limpiar_antiguas(cls, dias=30):
        """Elimina notificaciones más antiguas que el número de días especificado"""
        try:
            from datetime import timedelta
            fecha_limite = datetime.utcnow() - timedelta(days=dias)
            notificaciones_antiguas = cls.query.filter(cls.fecha_creacion < fecha_limite).all()

            for notificacion in notificaciones_antiguas:
                db.session.delete(notificacion)

            db.session.commit()
            return len(notificaciones_antiguas)
        except Exception as e:
            db.session.rollback()
            raise DatabaseError(f"Error al limpiar notificaciones antiguas: {str(e)}")