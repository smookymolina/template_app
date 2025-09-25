from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from models import db, DatabaseError
from models.notification import Notification
from utils.decorators import admin_required

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/notifications', methods=['GET'])
@login_required
def get_notifications():
    """
    Obtiene las notificaciones para el usuario actual.
    Solo los administradores pueden ver notificaciones.
    """
    try:
        # Solo administradores pueden ver notificaciones
        if not current_user.is_admin():
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Solo administradores pueden ver notificaciones."
            }), 403

        # Parámetros de consulta
        limit = request.args.get('limit', 20, type=int)
        solo_no_leidas = request.args.get('unread_only', 'false').lower() == 'true'

        # Obtener notificaciones
        notificaciones = Notification.get_for_user(
            usuario_id=current_user.id,
            limit=limit,
            solo_no_leidas=solo_no_leidas
        )

        # Contar no leídas
        count_no_leidas = Notification.count_no_leidas(current_user.id)

        return jsonify({
            "success": True,
            "notifications": [n.serialize() for n in notificaciones],
            "unread_count": count_no_leidas,
            "total": len(notificaciones)
        })

    except Exception as e:
        current_app.logger.error(f"Error al obtener notificaciones: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener notificaciones: {str(e)}"
        }), 500

@notifications_bp.route('/notifications/count', methods=['GET'])
@login_required
def get_notification_count():
    """
    Obtiene solo el conteo de notificaciones no leídas.
    Endpoint ligero para actualizaciones frecuentes.
    """
    try:
        if not current_user.is_admin():
            return jsonify({
                "success": False,
                "message": "Acceso denegado."
            }), 403

        count_no_leidas = Notification.count_no_leidas(current_user.id)

        return jsonify({
            "success": True,
            "unread_count": count_no_leidas
        })

    except Exception as e:
        current_app.logger.error(f"Error al obtener conteo de notificaciones: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener conteo: {str(e)}"
        }), 500

@notifications_bp.route('/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_as_read(notification_id):
    """
    Marca una notificación específica como leída.
    """
    try:
        if not current_user.is_admin():
            return jsonify({
                "success": False,
                "message": "Acceso denegado."
            }), 403

        # Buscar la notificación
        notificacion = Notification.query.filter_by(
            id=notification_id,
            usuario_destino_id=current_user.id
        ).first()

        if not notificacion:
            return jsonify({
                "success": False,
                "message": "Notificación no encontrada."
            }), 404

        # Marcar como leída
        if notificacion.marcar_como_leida():
            return jsonify({
                "success": True,
                "message": "Notificación marcada como leída.",
                "notification": notificacion.serialize()
            })
        else:
            return jsonify({
                "success": False,
                "message": "Error al marcar la notificación como leída."
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error al marcar notificación como leída: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500

@notifications_bp.route('/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_as_read():
    """
    Marca todas las notificaciones del usuario como leídas.
    """
    try:
        if not current_user.is_admin():
            return jsonify({
                "success": False,
                "message": "Acceso denegado."
            }), 403

        # Marcar todas como leídas
        if Notification.marcar_todas_como_leidas(current_user.id):
            return jsonify({
                "success": True,
                "message": "Todas las notificaciones han sido marcadas como leídas."
            })
        else:
            return jsonify({
                "success": False,
                "message": "Error al marcar las notificaciones como leídas."
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error al marcar todas las notificaciones como leídas: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500

@notifications_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@login_required
def delete_notification(notification_id):
    """
    Elimina una notificación específica.
    """
    try:
        if not current_user.is_admin():
            return jsonify({
                "success": False,
                "message": "Acceso denegado."
            }), 403

        # Buscar la notificación
        notificacion = Notification.query.filter_by(
            id=notification_id,
            usuario_destino_id=current_user.id
        ).first()

        if not notificacion:
            return jsonify({
                "success": False,
                "message": "Notificación no encontrada."
            }), 404

        # Eliminar la notificación
        if notificacion.delete():
            return jsonify({
                "success": True,
                "message": "Notificación eliminada correctamente."
            })
        else:
            return jsonify({
                "success": False,
                "message": "Error al eliminar la notificación."
            }), 500

    except Exception as e:
        current_app.logger.error(f"Error al eliminar notificación: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500

# Endpoint para limpiar notificaciones antiguas (solo para administradores)
@notifications_bp.route('/notifications/cleanup', methods=['POST'])
@admin_required
def cleanup_old_notifications():
    """
    Elimina notificaciones más antiguas que 30 días.
    Solo disponible para administradores.
    """
    try:
        dias = request.json.get('days', 30) if request.json else 30

        eliminadas = Notification.limpiar_antiguas(dias=dias)

        return jsonify({
            "success": True,
            "message": f"Se eliminaron {eliminadas} notificaciones antiguas.",
            "deleted_count": eliminadas
        })

    except Exception as e:
        current_app.logger.error(f"Error al limpiar notificaciones antiguas: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500