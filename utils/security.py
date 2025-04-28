import secrets
import hashlib
import re
from datetime import datetime, timedelta
from flask import request, current_app
from models.user_session import UserSession

def generate_token(length=32):
    """
    Genera un token aleatorio seguro.
    
    Args:
        length: Longitud del token en bytes
        
    Returns:
        Token aleatorio en formato hexadecimal
    """
    return secrets.token_hex(length)

def hash_password(password, salt=None):
    """
    Genera un hash seguro para una contraseña.
    
    Args:
        password: Contraseña a hashear
        salt: Salt opcional (se genera uno si no se proporciona)
        
    Returns:
        Tuple (salt, hash)
    """
    if salt is None:
        salt = secrets.token_hex(8)
    
    password_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return salt, password_hash

def verify_password(password, stored_hash):
    """
    Verifica una contraseña contra un hash almacenado.
    
    Args:
        password: Contraseña a verificar
        stored_hash: Hash almacenado en formato 'salt$hash'
        
    Returns:
        True si la contraseña coincide, False si no
    """
    if '$' not in stored_hash:
        return False
        
    salt, hash_value = stored_hash.split('$', 1)
    computed_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return computed_hash == hash_value

def create_user_session(usuario_id, ip_address=None, user_agent=None, days_valid=7):
    """
    Crea una nueva sesión de usuario.
    
    Args:
        usuario_id: ID del usuario
        ip_address: Dirección IP (opcional)
        user_agent: User-Agent del navegador (opcional)
        days_valid: Días de validez de la sesión
        
    Returns:
        Objeto UserSession creado
    """
    if ip_address is None:
        ip_address = request.remote_addr
        
    if user_agent is None and request.user_agent:
        user_agent = request.user_agent.string
    
    session = UserSession(
        usuario_id=usuario_id,
        ip_address=ip_address,
        user_agent=user_agent,
        session_token=generate_token(),
        expires_at=datetime.utcnow() + timedelta(days=days_valid)
    )
    
    session.save()
    return session

def get_client_ip():
    """
    Obtiene la dirección IP del cliente, considerando proxies.
    
    Returns:
        Dirección IP del cliente
    """
    if request.headers.get('X-Forwarded-For'):
        # Obtener la primera IP si hay múltiples (la original del cliente)
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr

def is_safe_url(url):
    """
    Verifica si una URL es segura para redireccionar.
    
    Args:
        url: URL a verificar
        
    Returns:
        True si la URL es segura, False si no
    """
    if url is None or url.strip() == '':
        return False
        
    # Verificar que sea una URL relativa o del mismo host
    pattern = r'^(\/[^\/]|https?:\/\/' + re.escape(request.host) + r')'
    return bool(re.match(pattern, url))

def is_valid_email(email):
    """
    Valida si un email tiene formato correcto.
    
    Args:
        email: Email a validar
        
    Returns:
        True si el email es válido, False si no
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def is_valid_password(password):
    """
    Valida si una contraseña cumple con los requisitos mínimos.
    
    Args:
        password: Contraseña a validar
        
    Returns:
        (bool, str): True y mensaje vacío si es válida, False y mensaje de error si no
    """
    if len(password) < 6:
        return False, "La contraseña debe tener al menos 6 caracteres"
    
    # Puedes agregar más validaciones según tus requisitos
    # Por ejemplo, requerir números, letras mayúsculas, símbolos, etc.
    
    return True, ""

def check_ip_allowed(ip_address, allowed_ips=None):
    """
    Verifica si una dirección IP está permitida.
    
    Args:
        ip_address: Dirección IP a verificar
        allowed_ips: Lista de IPs permitidas, si es None se usa la configuración de la aplicación
        
    Returns:
        True si la IP está permitida, False si no
    """
    if allowed_ips is None:
        allowed_ips = current_app.config.get('IPS_PERMITIDAS', ['127.0.0.1'])
    
    # Permitir localhost siempre en desarrollo
    if current_app.debug and ip_address in ['127.0.0.1', '::1']:
        return True
    
    return ip_address in allowed_ips

def require_api_key(api_key):
    """
    Verifica si una clave API es válida.
    
    Args:
        api_key: Clave API a verificar
        
    Returns:
        True si la clave API es válida, False si no
    """
    valid_api_key = current_app.config.get('API_KEY')
    if not valid_api_key:
        return False
    
    return api_key == valid_api_key