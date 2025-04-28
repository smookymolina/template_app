from flask import Blueprint, jsonify, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from models.usuario import Usuario
from models.user_session import UserSession
from utils.validators import validate_login_data, ValidationError
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login_usuario():
    """
    Inicia sesión de usuario.
    """
    try:
        # Obtener datos del cuerpo de la petición
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Validar datos
        try:
            validated_data = validate_login_data(data)
        except ValidationError as errors:
            return jsonify({
                "success": False, 
                "message": "Error de validación", 
                "errors": errors.args[0]
            }), 400
        
        # Buscar usuario por email
        usuario = Usuario.query.filter_by(email=validated_data['email']).first()
        
        # Verificar credenciales
        if usuario and usuario.check_password(validated_data['password']):
            # Iniciar sesión
            login_user(usuario, remember=True)
            
            # Actualizar último login
            usuario.last_login = datetime.utcnow()
            usuario.save()
            
            # Crear sesión de usuario para rastreo
            try:
                ip_address = request.remote_addr
                user_agent = request.user_agent.string if request.user_agent else None
                
                session = UserSession(
                    usuario_id=usuario.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    session_token=request.cookies.get('session', ''),
                    expires_at=datetime.utcnow() + current_app.permanent_session_lifetime
                )
                session.save()
            except Exception as e:
                current_app.logger.warning(f"No se pudo registrar la sesión: {str(e)}")
            
            current_app.logger.info(f"Inicio de sesión exitoso: {usuario.email}")
            return jsonify({
                "success": True, 
                "message": "Inicio de sesión exitoso", 
                "usuario": usuario.serialize()
            }), 200
        else:
            current_app.logger.warning(f"Intento fallido de inicio de sesión: {validated_data['email']}")
            return jsonify({
                "success": False, 
                "message": "Credenciales incorrectas"
            }), 401
            
    except Exception as e:
        current_app.logger.error(f"Error en login: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Error en el servidor: {str(e)}"
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout_usuario():
    """
    Cierra sesión de usuario.
    """
    try:
        # Registrar sesión como inválida
        try:
            session_token = request.cookies.get('session', '')
            if session_token:
                user_session = UserSession.query.filter_by(
                    session_token=session_token,
                    usuario_id=current_user.id,
                    is_valid=True
                ).first()
                
                if user_session:
                    user_session.is_valid = False
                    user_session.save()
        except Exception as e:
            current_app.logger.warning(f"No se pudo invalidar la sesión: {str(e)}")
        
        # Cerrar sesión de Flask-Login
        logout_user()
        
        return jsonify({
            "success": True, 
            "message": "Sesión cerrada correctamente"
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error en logout: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Error al cerrar sesión: {str(e)}"
        }), 500

@auth_bp.route('/check-auth', methods=['GET'])
def check_auth():
    """
    Verifica el estado de autenticación del usuario actual.
    """
    if current_user.is_authenticated:
        return jsonify({
            "authenticated": True, 
            "usuario": current_user.serialize()
        }), 200
    else:
        return jsonify({
            "authenticated": False
        }), 401

@auth_bp.route('/cambiar-password', methods=['POST'])
@login_required
def cambiar_password():
    """
    Cambia la contraseña del usuario actual.
    """
    try:
        data = request.get_json()
        
        # Validar datos
        current_password = data.get('current_password', '')
        new_password = data.get('new_password', '')
        
        if not current_password or not new_password:
            return jsonify({
                "success": False, 
                "message": "La contraseña actual y la nueva son requeridas"
            }), 400
        
        # Verificar contraseña actual
        if not current_user.check_password(current_password):
            return jsonify({
                "success": False, 
                "message": "Contraseña actual incorrecta"
            }), 400
        
        # Validar nueva contraseña
        from utils.validators import validate_password
        valid, message = validate_password(new_password)
        if not valid:
            return jsonify({
                "success": False, 
                "message": message
            }), 400
        
        # Cambiar contraseña
        current_user.password = new_password
        current_user.save()
        
        current_app.logger.info(f"Contraseña cambiada para: {current_user.email}")
        return jsonify({
            "success": True, 
            "message": "Contraseña actualizada correctamente"
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error al cambiar contraseña: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Error al cambiar contraseña: {str(e)}"
        }), 500

@auth_bp.route('/sessions', methods=['GET'])
@login_required
def get_sessions():
    """
    Obtiene las sesiones activas del usuario actual.
    """
    try:
        sessions = UserSession.get_for_user(current_user.id)
        
        return jsonify({
            "success": True,
            "sessions": [s.serialize() for s in sessions]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error al obtener sesiones: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener sesiones: {str(e)}"
        }), 500

@auth_bp.route('/sessions/<int:id>', methods=['DELETE'])
@login_required
def delete_session(id):
    """
    Invalida una sesión específica del usuario actual.
    """
    try:
        session = UserSession.query.get(id)
        
        if not session:
            return jsonify({
                "success": False,
                "message": "Sesión no encontrada"
            }), 404
        
        # Verificar que la sesión pertenece al usuario actual
        if session.usuario_id != current_user.id:
            return jsonify({
                "success": False,
                "message": "No tienes permiso para cerrar esta sesión"
            }), 403
        
        # Invalidar la sesión
        session.invalidate()
        
        return jsonify({
            "success": True,
            "message": "Sesión cerrada correctamente"
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error al cerrar sesión {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al cerrar sesión: {str(e)}"
        }), 500