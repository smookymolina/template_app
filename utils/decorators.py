"""
Decoradores para control de acceso basado en roles
"""
from functools import wraps
from flask import request, jsonify, current_app, session, abort
from flask_login import current_user, login_required
from datetime import datetime, timedelta
from flask_login import current_user
import logging

def check_metricas_rate_limit(user_id):
    """
    Dummy rate limit checker for metricas_admin_required.
    Replace with actual implementation as needed.
    """
    # TODO: Implement real rate limiting logic
    return True

def metricas_admin_required(f):
    """
    🎯 DECORADOR ESPECÍFICO: Solo administradores pueden acceder a métricas avanzadas
    
    Características:
    - Verifica rol de administrador
    - Registra accesos para auditoría
    - Permite configurar IPs específicas para métricas
    - Manejo de errores específico para métricas
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # 🔐 VERIFICAR AUTENTICACIÓN
            if not current_user.is_authenticated:
                current_app.logger.warning(f"🚫 Acceso no autenticado a métricas desde IP: {request.remote_addr}")
                return jsonify({
                    "success": False,
                    "message": "Autenticación requerida para acceder a métricas administrativas",
                    "error_code": "AUTH_REQUIRED"
                }), 401
            
            # 👑 VERIFICAR ROL DE ADMINISTRADOR O GERENTE
            if not hasattr(current_user, 'rol') or current_user.rol not in ['admin', 'gerente']:
                current_app.logger.warning(
                    f"🚫 Acceso denegado a métricas: Usuario {current_user.email} "
                    f"(rol: {getattr(current_user, 'rol', 'None')}) desde IP: {request.remote_addr}"
                )
                return jsonify({
                    "success": False,
                    "message": "Solo los administradores y gerentes pueden acceder a métricas avanzadas",
                    "error_code": "ADMIN_OR_GERENTE_REQUIRED"
                }), 403
            
            # 🌐 VERIFICAR IP AUTORIZADA (OPCIONAL)
            # Solo si está configurada la restricción de IPs para métricas
            metricas_ips = current_app.config.get('METRICAS_ADMIN_IPS', [])
            if metricas_ips and request.remote_addr not in metricas_ips:
                current_app.logger.warning(
                    f"🚫 IP no autorizada para métricas: {request.remote_addr} "
                    f"(Usuario: {current_user.email})"
                )
                return jsonify({
                    "success": False,
                    "message": "IP no autorizada para acceso a métricas administrativas",
                    "error_code": "IP_NOT_ALLOWED"
                }), 403
            
            # 📊 REGISTRAR ACCESO PARA AUDITORÍA
            current_app.logger.info(
                f"✅ Acceso autorizado a métricas: Usuario {current_user.email} "
                f"desde IP {request.remote_addr} - Endpoint: {request.endpoint}"
            )
            
            # 🎯 VERIFICAR LÍMITES DE TASA (Rate Limiting)
            if not check_metricas_rate_limit(current_user.id):
                return jsonify({
                    "success": False,
                    "message": "Demasiadas consultas de métricas. Intente en unos minutos.",
                    "error_code": "RATE_LIMIT_EXCEEDED"
                }), 429
            
            # ✅ EJECUTAR FUNCIÓN ORIGINAL
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"❌ Error en decorador metricas_admin_required: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Error interno del servidor en verificación de permisos",
                "error_code": "INTERNAL_ERROR"
            }), 500
    
    return decorated_function

def check_metricas_rate_limit(user_id, limit=10, window=300):
    """
    🚦 VERIFICAR LÍMITES DE TASA: Para consultas de métricas
    
    Args:
        user_id (int): ID del usuario
        limit (int): Número máximo de consultas permitidas
        window (int): Ventana de tiempo en segundos (default: 5 minutos)
    
    Returns:
        bool: True si está dentro del límite, False si excede
    """
    try:
        from datetime import datetime, timedelta
        import json
        
        # Usar session para almacenar límites temporalmente
        # En producción, esto debería usar Redis o una base de datos
        rate_limit_key = f"metricas_rate_limit_{user_id}"
        
        # Obtener datos de rate limit de session
        rate_data = session.get(rate_limit_key, {})
        
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window)
        
        # Filtrar requests dentro de la ventana de tiempo
        recent_requests = []
        if rate_data.get('requests'):
            for req_time_str in rate_data['requests']:
                req_time = datetime.fromisoformat(req_time_str)
                if req_time > window_start:
                    recent_requests.append(req_time_str)
        
        # Verificar si excede el límite
        if len(recent_requests) >= limit:
            current_app.logger.warning(
                f"🚦 Rate limit excedido para métricas: Usuario {user_id} "
                f"({len(recent_requests)}/{limit} requests en {window}s)"
            )
            return False
        
        # Agregar request actual
        recent_requests.append(now.isoformat())
        
        # Actualizar session
        session[rate_limit_key] = {
            'requests': recent_requests,
            'last_update': now.isoformat()
        }
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en check_metricas_rate_limit: {str(e)}")
        # En caso de error, permitir acceso (fail open)
        return True


def log_metricas_access(action="consulta"):
    """
    📝 DECORADOR: Registrar accesos específicos a métricas
    
    Args:
        action (str): Tipo de acción realizada
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = datetime.utcnow()
            
            try:
                # Ejecutar función
                result = f(*args, **kwargs)
                
                # Calcular tiempo de ejecución
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                
                # Log exitoso
                current_app.logger.info(
                    f"📊 Métricas {action}: Usuario {current_user.email} "
                    f"- Tiempo: {execution_time:.2f}s - IP: {request.remote_addr}"
                )
                
                return result
                
            except Exception as e:
                # Log error
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                current_app.logger.error(
                    f"❌ Error en métricas {action}: Usuario {current_user.email} "
                    f"- Error: {str(e)} - Tiempo: {execution_time:.2f}s"
                )
                raise
                
        return decorated_function
    return decorator


def cache_metricas(timeout=300):
    """
    💾 DECORADOR: Cache para métricas administrativas
    
    Args:
        timeout (int): Tiempo de cache en segundos (default: 5 minutos)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                # Generar clave de cache
                cache_key = f"metricas_{f.__name__}_{current_user.id}_{hash(str(request.args))}"
                
                # Intentar obtener del cache (session temporal)
                cached_result = session.get(cache_key)
                
                if cached_result:
                    cache_time = datetime.fromisoformat(cached_result.get('timestamp', ''))
                    if (datetime.utcnow() - cache_time).total_seconds() < timeout:
                        current_app.logger.info(f"💾 Cache hit para métricas: {f.__name__}")
                        return cached_result['data']
                
                # Cache miss - ejecutar función
                result = f(*args, **kwargs)
                
                # Guardar en cache
                session[cache_key] = {
                    'data': result,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                current_app.logger.info(f"💾 Cache miss para métricas: {f.__name__} - Resultado guardado")
                return result
                
            except Exception as e:
                current_app.logger.error(f"❌ Error en cache de métricas: {str(e)}")
                # En caso de error, ejecutar función sin cache
                return f(*args, **kwargs)
                
        return decorated_function
    return decorator


# ============================================================================
# 🔧 DECORADORES AUXILIARES PARA MÉTRICAS
# ============================================================================

def validate_metricas_params(f):
    """
    ✅ DECORADOR: Validar parámetros específicos para métricas
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Validar parámetros comunes de métricas
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)
            date_from = request.args.get('date_from')
            date_to = request.args.get('date_to')
            
            # Validaciones
            if page < 1:
                return jsonify({
                    "success": False,
                    "message": "El número de página debe ser mayor a 0",
                    "error_code": "INVALID_PAGE"
                }), 400
            
            if per_page < 1 or per_page > 100:
                return jsonify({
                    "success": False,
                    "message": "Items por página debe estar entre 1 y 100",
                    "error_code": "INVALID_PER_PAGE"
                }), 400
            
            # Validar fechas si están presentes
            if date_from:
                try:
                    datetime.strptime(date_from, '%Y-%m-%d')
                except ValueError:
                    return jsonify({
                        "success": False,
                        "message": "Formato de fecha inválido. Use YYYY-MM-DD",
                        "error_code": "INVALID_DATE_FORMAT"
                    }), 400
            
            if date_to:
                try:
                    datetime.strptime(date_to, '%Y-%m-%d')
                except ValueError:
                    return jsonify({
                        "success": False,
                        "message": "Formato de fecha inválido. Use YYYY-MM-DD",
                        "error_code": "INVALID_DATE_FORMAT"
                    }), 400
            
            # Validar rango de fechas
            if date_from and date_to:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                
                if date_from_obj > date_to_obj:
                    return jsonify({
                        "success": False,
                        "message": "La fecha de inicio no puede ser posterior a la fecha de fin",
                        "error_code": "INVALID_DATE_RANGE"
                    }), 400
            
            return f(*args, **kwargs)
            
        except Exception as e:
            current_app.logger.error(f"❌ Error en validación de parámetros de métricas: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Error en validación de parámetros",
                "error_code": "VALIDATION_ERROR"
            }), 500
    
    return decorated_function


def handle_metricas_errors(f):
    """
    🚨 DECORADOR: Manejo específico de errores para métricas
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
            
        except PermissionError as e:
            current_app.logger.error(f"🚫 Error de permisos en métricas: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Sin permisos para acceder a esta métrica",
                "error_code": "PERMISSION_DENIED"
            }), 403
            
        except ValueError as e:
            current_app.logger.error(f"⚠️ Error de validación en métricas: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Datos inválidos para generar métricas",
                "error_code": "INVALID_DATA"
            }), 400
            
        except TimeoutError as e:
            current_app.logger.error(f"⏱️ Timeout en métricas: {str(e)}")
            return jsonify({
                "success": False,
                "message": "La consulta de métricas tardó demasiado. Intente con un rango menor.",
                "error_code": "QUERY_TIMEOUT"
            }), 408
            
        except Exception as e:
            current_app.logger.error(f"❌ Error inesperado en métricas: {str(e)}")
            return jsonify({
                "success": False,
                "message": "Error interno al generar métricas",
                "error_code": "INTERNAL_ERROR"
            }), 500
    
    return decorated_function


# ============================================================================
# 🎯 DECORADOR COMPUESTO: Para rutas de métricas administrativas
# ============================================================================

def admin_metricas_endpoint(cache_timeout=300):
    """
    🎯 DECORADOR COMPUESTO: Combina todos los decoradores para métricas admin
    
    Args:
        cache_timeout (int): Tiempo de cache en segundos
    """
    def decorator(f):
        # Aplicar todos los decoradores en orden
        decorated = metricas_admin_required(f)
        decorated = log_metricas_access("consulta")(decorated)
        decorated = validate_metricas_params(decorated)
        decorated = handle_metricas_errors(decorated)
        decorated = cache_metricas(cache_timeout)(decorated)
        
        return decorated
    
    return decorator


# ============================================================================
# 🔧 FUNCIONES AUXILIARES
# ============================================================================

def is_metricas_admin(user):
    """
    🔍 VERIFICAR: Si un usuario puede acceder a métricas administrativas
    JERARQUÍA: Admin > Gerente > Asesor
    
    Args:
        user: Objeto usuario
    
    Returns:
        bool: True si puede acceder, False si no
    """
    return (
        user and 
        user.is_authenticated and 
        hasattr(user, 'rol') and 
        user.rol in ['admin', 'gerente']
    )


def get_metricas_permissions(user):
    """
    📋 OBTENER: Permisos específicos de métricas para un usuario
    JERARQUÍA: Admin > Gerente > Asesor
    
    Args:
        user: Objeto usuario
    
    Returns:
        dict: Diccionario con permisos específicos
    """
    if not user or not user.is_authenticated:
        return {
            "can_view_global_metrics": False,
            "can_view_asesor_metrics": False,
            "can_export_metrics": False,
            "can_view_detailed_metrics": False
        }
    
    # ADMIN: Máximos permisos
    if user.rol == 'admin':
        return {
            "can_view_global_metrics": True,
            "can_view_asesor_metrics": True,
            "can_export_metrics": True,
            "can_view_detailed_metrics": True
        }
    # GERENTE: Permisos intermedios
    elif user.rol == 'gerente':
        return {
            "can_view_global_metrics": True,
            "can_view_asesor_metrics": True,  # Puede ver métricas de asesores
            "can_export_metrics": True,
            "can_view_detailed_metrics": True
        }
    # ASESOR: Permisos mínimos
    elif user.rol == 'asesor':
        return {
            "can_view_global_metrics": False,
            "can_view_asesor_metrics": False,  # Solo sus propias métricas
            "can_export_metrics": False,
            "can_view_detailed_metrics": False
        }
    else:
        return {
            "can_view_global_metrics": False,
            "can_view_asesor_metrics": False,
            "can_export_metrics": False,
            "can_view_detailed_metrics": False
        }   

def admin_required(f):
    """
    Decorador que requiere que el usuario sea administrador
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Autenticación requerida"
            }), 401
            
        if not hasattr(current_user, 'rol') or current_user.rol != 'admin':
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Se requieren permisos de administrador."
            }), 403
            
        return f(*args, **kwargs)
    return decorated_function

def asesor_or_admin_required(f):
    """
    Decorador que requiere que el usuario sea asesor, gerente o administrador
    JERARQUÍA: Admin > Gerente > Asesor
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Autenticación requerida"
            }), 401
            
        if not hasattr(current_user, 'rol') or current_user.rol not in ['admin', 'gerente', 'asesor']:
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Se requieren permisos de asesor, gerente o administrador."
            }), 403
            
        return f(*args, **kwargs)
    return decorated_function

def gerente_or_admin_required(f):
    """
    Decorador que requiere que el usuario sea gerente o administrador
    JERARQUÍA: Admin > Gerente
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Autenticación requerida"
            }), 401
            
        if not hasattr(current_user, 'rol') or current_user.rol not in ['admin', 'gerente']:
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Se requieren permisos de gerente o administrador."
            }), 403
            
        return f(*args, **kwargs)
    return decorated_function

def gerente_required(f):
    """
    Decorador que requiere que el usuario sea específicamente gerente
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Autenticación requerida"
            }), 401
            
        if not hasattr(current_user, 'rol') or current_user.rol != 'gerente':
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Se requieren permisos de gerente."
            }), 403
            
        return f(*args, **kwargs)
    return decorated_function

def role_required(required_roles):
    """
    Decorador flexible que acepta una lista de roles requeridos
    
    Uso:
    @role_required(['admin'])
    @role_required(['admin', 'asesor'])
    """
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify({
                    "success": False,
                    "message": "Autenticación requerida"
                }), 401
                
            user_role = getattr(current_user, 'rol', None)
            if not user_role or user_role not in required_roles:
                return jsonify({
                    "success": False,
                    "message": f"Acceso denegado. Se requiere uno de los siguientes roles: {', '.join(required_roles)}"
                }), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def excel_upload_required(f):
    """
    Decorador específico para funcionalidades de Excel (solo admins)
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Autenticación requerida"
            }), 401
            
        if not hasattr(current_user, 'can_upload_excel') or not current_user.can_upload_excel():
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Solo los administradores pueden subir archivos Excel."
            }), 403
            
        return f(*args, **kwargs)
    return decorated_function

