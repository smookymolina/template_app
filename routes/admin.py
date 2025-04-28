from flask import Blueprint, jsonify, request, current_app, render_template
from flask_login import login_required, current_user
from models.usuario import Usuario
from models.user_session import UserSession
from models import db, DatabaseError
from utils.security import check_ip_allowed
from utils.validators import validate_usuario_data, ValidationError
from functools import wraps
import os
import logging
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    """
    Decorador que verifica si el usuario tiene permisos de administrador.
    También comprueba si la IP está en la lista de permitidas.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Verificar si la IP está permitida
        ip_address = request.remote_addr
        if not check_ip_allowed(ip_address, current_app.config.get('IPS_PERMITIDAS')):
            current_app.logger.warning(f"Intento de acceso administrativo desde IP no permitida: {ip_address}")
            return jsonify({
                "success": False,
                "message": "Acceso no autorizado desde esta IP"
            }), 403
        
        # Aquí podríamos verificar si el usuario tiene rol de admin
        # Por ahora, todos los usuarios autenticados son considerados admin
        
        return f(*args, **kwargs)
    return login_required(decorated_function)

@admin_bp.route('/usuarios', methods=['GET'])
@admin_required
def get_usuarios():
    """
    Obtiene la lista de usuarios administradores.
    """
    try:
        usuarios = Usuario.query.all()
        
        return jsonify({
            "success": True,
            "usuarios": [u.serialize() for u in usuarios]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener usuarios: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener usuarios: {str(e)}"
        }), 500

@admin_bp.route('/usuarios/<int:id>', methods=['GET'])
@admin_required
def get_usuario(id):
    """
    Obtiene los detalles de un usuario específico.
    """
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
            
        return jsonify({
            "success": True,
            "usuario": usuario.serialize()
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener usuario {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener usuario: {str(e)}"
        }), 500

@admin_bp.route('/usuarios', methods=['POST'])
@admin_required
def add_usuario():
    """
    Crea un nuevo usuario administrador.
    """
    try:
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_usuario_data(data)
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": "Error de validación",
                "errors": e.args[0]
            }), 400
        
        # Verificar si ya existe el email
        if Usuario.query.filter_by(email=validated_data['email']).first():
            return jsonify({
                "success": False,
                "message": f"Ya existe un usuario con el email {validated_data['email']}"
            }), 400
        
        # Crear nuevo usuario
        nuevo = Usuario(**validated_data)
        
        # Guardar en base de datos
        try:
            nuevo.save()
            current_app.logger.info(f"Usuario creado: {nuevo.id} - {nuevo.email}")
            return jsonify({
                "success": True,
                "usuario": nuevo.serialize()
            }), 201
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al crear usuario: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al crear usuario: {str(e)}"
        }), 500

@admin_bp.route('/usuarios/<int:id>', methods=['PUT'])
@admin_required
def update_usuario(id):
    """
    Actualiza un usuario existente.
    """
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
        
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_usuario_data(data, is_update=True)
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": "Error de validación",
                "errors": e.args[0]
            }), 400
        
        # Verificar si se está intentando actualizar el email y ya existe
        if 'email' in validated_data and validated_data['email'] != usuario.email:
            if Usuario.query.filter_by(email=validated_data['email']).first():
                return jsonify({
                    "success": False,
                    "message": f"Ya existe un usuario con el email {validated_data['email']}"
                }), 400
        
        # Actualizar campos
        for key, value in validated_data.items():
            setattr(usuario, key, value)
        
        # Guardar cambios
        try:
            usuario.save()
            current_app.logger.info(f"Usuario actualizado: {usuario.id} - {usuario.email}")
            return jsonify({
                "success": True,
                "usuario": usuario.serialize()
            })
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al actualizar usuario {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al actualizar usuario: {str(e)}"
        }), 500

@admin_bp.route('/usuarios/<int:id>', methods=['DELETE'])
@admin_required
def delete_usuario(id):
    """
    Elimina un usuario existente.
    """
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
        
        # No permitir eliminar al propio usuario actual
        if usuario.id == current_user.id:
            return jsonify({
                "success": False,
                "message": "No puedes eliminar tu propio usuario"
            }), 400
        
        # Guardar información antes de eliminar para el log
        usuario_info = f"ID: {usuario.id}, Email: {usuario.email}"
        
        # Eliminar usuario
        try:
            db.session.delete(usuario)
            db.session.commit()
            current_app.logger.info(f"Usuario eliminado: {usuario_info}")
            return jsonify({
                "success": True,
                "message": "Usuario eliminado correctamente"
            })
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al eliminar usuario {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al eliminar usuario: {str(e)}"
        }), 500

@admin_bp.route('/logs', methods=['GET'])
@admin_required
def get_logs():
    """
    Obtiene los últimos registros de actividad.
    """
    try:
        log_file = current_app.config.get('LOG_FILE', 'app.log')
        
        if not os.path.exists(log_file):
            return jsonify({
                "success": False,
                "message": "El archivo de logs no existe"
            }), 404
        
        # Obtener las últimas líneas del archivo de logs
        limit = request.args.get('limit', 100, type=int)
        with open(log_file, 'r') as f:
            lines = f.readlines()
        
        # Limitar la cantidad de líneas
        last_lines = lines[-limit:] if len(lines) > limit else lines
        
        return jsonify({
            "success": True,
            "logs": last_lines
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener logs: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener logs: {str(e)}"
        }), 500

@admin_bp.route('/sessions', methods=['GET'])
@admin_required
def get_all_sessions():
    """
    Obtiene todas las sesiones activas de usuarios.
    """
    try:
        # Obtener solo sesiones activas y no expiradas
        now = datetime.utcnow()
        sessions = UserSession.query.filter(
            UserSession.is_valid == True,
            UserSession.expires_at > now
        ).all()
        
        return jsonify({
            "success": True,
            "sessions": [s.serialize() for s in sessions]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener sesiones: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener sesiones: {str(e)}"
        }), 500

@admin_bp.route('/sessions/cleanup', methods=['POST'])
@admin_required
def cleanup_sessions():
    """
    Limpia las sesiones expiradas de la base de datos.
    """
    try:
        count = UserSession.cleanup_expired()
        
        return jsonify({
            "success": True,
            "message": f"Se limpiaron {count} sesiones expiradas"
        })
    except Exception as e:
        current_app.logger.error(f"Error al limpiar sesiones: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al limpiar sesiones: {str(e)}"
        }), 500

@admin_bp.route('/sessions/<int:id>', methods=['DELETE'])
@admin_required
def invalidate_session(id):
    """
    Invalida una sesión específica.
    """
    try:
        session = UserSession.query.get(id)
        if not session:
            return jsonify({
                "success": False,
                "message": "Sesión no encontrada"
            }), 404
        
        # Invalidar la sesión
        session.invalidate()
        
        return jsonify({
            "success": True,
            "message": "Sesión invalidada correctamente"
        })
    except Exception as e:
        current_app.logger.error(f"Error al invalidar sesión {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al invalidar sesión: {str(e)}"
        }), 500

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """
    Renderiza el panel de administración.
    """
    return render_template('admin/dashboard.html')