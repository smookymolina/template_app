"""
Decoradores para control de acceso basado en roles
"""
from functools import wraps
from flask import jsonify, abort
from flask_login import current_user, login_required

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
    Decorador que requiere que el usuario sea asesor o administrador
    """
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Autenticación requerida"
            }), 401
            
        if not hasattr(current_user, 'rol') or current_user.rol not in ['admin', 'asesor', 'gerente']:
            return jsonify({
                "success": False,
                "message": "Acceso denegado. Se requieren permisos de asesor o administrador."
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