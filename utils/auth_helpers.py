from functools import wraps
from flask import abort, jsonify
from flask_login import current_user

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"success": False, "message": "Autenticación requerida"}), 401
        
        if not hasattr(current_user, 'rol') or current_user.rol != 'admin':
            return jsonify({"success": False, "message": "Permisos insuficientes"}), 403
            
        return f(*args, **kwargs)
    return decorated_function