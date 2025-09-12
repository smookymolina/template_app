from flask import Blueprint, jsonify, request, current_app
from flask_login import login_user, logout_user, login_required, current_user
from models.usuario import Usuario
from models.user_session import UserSession
from models.user_settings import UserSettings
from utils.validators import validate_login_data, ValidationError
from utils.helpers import guardar_archivo, eliminar_archivo
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
            
            # Preparar datos del usuario
            user_data = usuario.serialize()
            
            # Asegurar que el rol esté presente
            if 'rol' not in user_data or not user_data['rol']:
                user_data['rol'] = 'admin'  # Default seguro
            
            current_app.logger.info(f"Login exitoso - Usuario: {usuario.email}, Rol: {user_data['rol']}")
            return jsonify({
                "success": True, 
                "message": "Inicio de sesión exitoso", 
                "usuario": user_data
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
    🔐 ENDPOINT CORREGIDO para verificar autenticación
    """
    try:
        from flask_login import current_user
        
        if current_user and current_user.is_authenticated:
            # ✅ ASEGURAR que el usuario tenga un rol
            user_data = current_user.serialize()
            if not user_data.get('rol'):
                user_data['rol'] = 'admin'  # Valor por defecto seguro
            
            current_app.logger.info(f"✅ Usuario autenticado: {user_data.get('email')} (rol: {user_data.get('rol')})")
            
            # ✅ RESPUESTA JSON asegurada
            response = jsonify({
                "authenticated": True, 
                "usuario": user_data
            })
            response.headers['Content-Type'] = 'application/json'
            return response, 200
        else:
            # ✅ RESPUESTA JSON para no autenticado
            response = jsonify({
                "authenticated": False,
                "message": "No hay usuario autenticado"
            })
            response.headers['Content-Type'] = 'application/json'
            return response, 200
            
    except Exception as e:
        current_app.logger.error(f"❌ Error al verificar autenticación: {str(e)}")
        
        # ✅ RESPUESTA de error en JSON
        response = jsonify({
            "authenticated": False,
            "error": "Error interno del servidor",
            "message": str(e)
        })
        response.headers['Content-Type'] = 'application/json'
        return response, 200

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

@auth_bp.route('/profile', methods=['PUT'])
@login_required
def update_profile():
    """
    Actualiza el perfil del usuario actual.
    """
    try:
        data = request.get_json()
        
        # Campos permitidos para actualizar
        allowed_fields = ['nombre', 'email', 'telefono']
        
        # Validar que al menos un campo esté presente
        if not any(field in data for field in allowed_fields):
            return jsonify({
                "success": False,
                "message": "No hay campos para actualizar"
            }), 400
        
        # Validar email si está presente
        if 'email' in data and data['email']:
            from utils.validators import validate_email
            if not validate_email(data['email']):
                return jsonify({
                    "success": False,
                    "message": "Formato de email inválido"
                }), 400
            
            # Verificar que el email no esté en uso por otro usuario
            existing_user = Usuario.query.filter(
                Usuario.email == data['email'],
                Usuario.id != current_user.id
            ).first()
            
            if existing_user:
                return jsonify({
                    "success": False,
                    "message": "El email ya está en uso por otro usuario"
                }), 400
        
        # Validar teléfono si está presente
        if 'telefono' in data and data['telefono']:
            from utils.validators import validate_phone
            if not validate_phone(data['telefono']):
                return jsonify({
                    "success": False,
                    "message": "Formato de teléfono inválido"
                }), 400
        
        # Actualizar campos
        updated_fields = []
        for field in allowed_fields:
            if field in data and data[field] is not None:
                setattr(current_user, field, data[field])
                updated_fields.append(field)
        
        # Guardar cambios
        current_user.save()
        
        current_app.logger.info(f"Perfil actualizado para: {current_user.email} - Campos: {updated_fields}")
        
        return jsonify({
            "success": True,
            "message": "Perfil actualizado correctamente",
            "user": current_user.serialize()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al actualizar perfil: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al actualizar perfil: {str(e)}"
        }), 500

@auth_bp.route('/user-settings', methods=['GET'])
@login_required
def get_user_settings():
    """
    Obtiene la configuración y datos del usuario actual.
    """
    try:
        # Obtener configuraciones del usuario desde la base de datos
        settings = UserSettings.get_user_settings(current_user.id)
        
        return jsonify({
            "success": True,
            "user": current_user.serialize(),
            "settings": settings
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al obtener configuración: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener configuración: {str(e)}"
        }), 500

@auth_bp.route('/user-sessions', methods=['GET'])
@login_required
def get_user_sessions():
    """
    Obtiene las sesiones del usuario actual.
    """
    try:
        sessions = UserSession.get_for_user(current_user.id)
        
        return jsonify({
            "success": True,
            "sessions": [s.serialize() for s in sessions]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al obtener sesiones de usuario: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener sesiones: {str(e)}"
        }), 500

@auth_bp.route('/terminate-session/<int:session_id>', methods=['POST'])
@login_required
def terminate_session(session_id):
    """
    Termina una sesión específica del usuario actual.
    """
    try:
        session = UserSession.query.get(session_id)
        
        if not session:
            return jsonify({
                "success": False,
                "message": "Sesión no encontrada"
            }), 404
        
        if session.usuario_id != current_user.id:
            return jsonify({
                "success": False,
                "message": "No tienes permisos para terminar esta sesión"
            }), 403
        
        session.invalidate()
        
        return jsonify({
            "success": True,
            "message": "Sesión terminada correctamente"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al terminar sesión {session_id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al terminar sesión: {str(e)}"
        }), 500

@auth_bp.route('/save-setting', methods=['POST'])
@login_required
def save_setting():
    """
    Guarda una configuración específica del usuario.
    """
    try:
        data = request.get_json()
        key = data.get('key')
        value = data.get('value')
        
        if not key:
            return jsonify({
                "success": False,
                "message": "La clave de configuración es requerida"
            }), 400
        
        # Guardar configuración en la base de datos usando UserSettings
        UserSettings.set_user_setting(current_user.id, key, value)
        current_app.logger.info(f"Configuración guardada para {current_user.email}: {key} = {value}")
        
        return jsonify({
            "success": True,
            "message": "Configuración guardada correctamente"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al guardar configuración: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al guardar configuración: {str(e)}"
        }), 500

import os
from werkzeug.utils import secure_filename

from flask import url_for

@auth_bp.route('/upload-profile-photo', methods=['POST'])
@login_required
def upload_profile_photo():
    """
    Sube o actualiza la foto de perfil para el usuario actual.
    """
    if 'foto' not in request.files:
        return jsonify({"success": False, "message": "No se encontró el archivo de imagen."}), 400

    file = request.files['foto']

    if file.filename == '':
        return jsonify({"success": False, "message": "No se seleccionó ningún archivo."}), 400

    if file:
        filename = secure_filename(file.filename)
        unique_filename = f"{current_user.id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
        upload_folder = current_app.config['PROFILE_IMG_FOLDER']
        save_path = os.path.join(upload_folder, unique_filename)

        try:
            if current_user.foto_url:
                old_photo_path = os.path.join(upload_folder, current_user.foto_url)
                if os.path.exists(old_photo_path):
                    os.remove(old_photo_path)

            file.save(save_path)
            current_user.foto_url = unique_filename
            current_user.save()

            # Construir la URL completa para devolver al frontend
            photo_url = url_for('main.serve_profile_image', filename=unique_filename)

            current_app.logger.info(f"Foto de perfil actualizada para {current_user.email}: {photo_url}")

            return jsonify({
                "success": True, 
                "message": "Foto de perfil actualizada correctamente",
                "foto_url": photo_url
            }), 200

        except Exception as e:
            current_app.logger.error(f"Error al guardar la foto de perfil: {str(e)}")
            return jsonify({"success": False, "message": "Ocurrió un error en el servidor al guardar la imagen."}), 500

    return jsonify({"success": False, "message": "Tipo de archivo no permitido."}), 400

@auth_bp.route('/remove-profile-photo', methods=['DELETE'])
@login_required  
def remove_profile_photo():
    """
    Elimina la foto de perfil del usuario actual.
    """
    try:
        if not current_user.foto_url:
            return jsonify({
                "success": False,
                "message": "No hay foto de perfil para eliminar"
            }), 400
        
        # Eliminar archivo
        eliminar_archivo(current_user.foto_url)
        
        # Actualizar usuario
        current_user.foto_url = None
        current_user.save()
        
        return jsonify({
            "success": True,
            "message": "Foto de perfil eliminada correctamente"
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error al eliminar foto de perfil: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al eliminar foto: {str(e)}"
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """
    Cambia la contraseña del usuario actual (ruta alternativa).
    """
    return cambiar_password()