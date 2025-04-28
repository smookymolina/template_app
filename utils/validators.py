import re
from flask import request
from models.usuario import Usuario
from models.recluta import Recluta

class ValidationError(Exception):
    """Excepción para errores de validación"""
    pass

def validate_login_data(data):
    """
    Valida los datos de inicio de sesión.
    
    Args:
        data: Diccionario con los datos del formulario
        
    Returns:
        Datos validados
        
    Raises:
        ValidationError: Si hay errores de validación
    """
    errors = {}
    
    # Validar email
    email = data.get('email', '').strip()
    if not email:
        errors['email'] = 'El email es requerido'
    elif not validate_email(email):
        errors['email'] = 'El formato del email no es válido'
    
    # Validar contraseña
    password = data.get('password', '')
    if not password:
        errors['password'] = 'La contraseña es requerida'
    
    if errors:
        raise ValidationError(errors)
    
    return {
        'email': email,
        'password': password
    }

def validate_usuario_data(data, is_update=False):
    """
    Valida los datos de un usuario.
    
    Args:
        data: Diccionario con los datos del usuario
        is_update: Indica si es una actualización (algunos campos son opcionales)
        
    Returns:
        Datos validados
        
    Raises:
        ValidationError: Si hay errores de validación
    """
    errors = {}
    
    # Validar email
    email = data.get('email', '').strip()
    if not is_update or 'email' in data:
        if not email:
            errors['email'] = 'El email es requerido'
        elif not validate_email(email):
            errors['email'] = 'El formato del email no es válido'
        elif not is_update and Usuario.query.filter_by(email=email).first():
            errors['email'] = f'Ya existe un usuario con el email {email}'
    
    # Validar contraseña en creación
    if not is_update:
        password = data.get('password', '')
        if not password:
            errors['password'] = 'La contraseña es requerida'
        else:
            valid, message = validate_password(password)
            if not valid:
                errors['password'] = message
    
    # Validación opcional de otros campos
    nombre = data.get('nombre', '').strip()
    telefono = data.get('telefono', '').strip()
    
    if telefono and not validate_phone(telefono):
        errors['telefono'] = 'El formato del teléfono no es válido'
    
    if errors:
        raise ValidationError(errors)
    
    # Construir diccionario de datos validados
    validated_data = {'email': email}
    
    if not is_update:
        validated_data['password'] = password
    
    if nombre:
        validated_data['nombre'] = nombre
    
    if telefono:
        validated_data['telefono'] = telefono
    
    return validated_data

def validate_recluta_data(data, is_update=False):
    """
    Valida los datos de un recluta.
    
    Args:
        data: Diccionario con los datos del recluta
        is_update: Indica si es una actualización (algunos campos son opcionales)
        
    Returns:
        Datos validados
        
    Raises:
        ValidationError: Si hay errores de validación
    """
    errors = {}
    
    # Campos requeridos
    required_fields = ['nombre', 'email', 'telefono', 'estado'] if not is_update else []
    
    for field in required_fields:
        if not data.get(field, '').strip():
            errors[field] = f'El campo {field} es requerido'
    
    # Validar email si está presente
    email = data.get('email', '').strip()
    if email and not validate_email(email):
        errors['email'] = 'El formato del email no es válido'
    
    # Validar teléfono si está presente
    telefono = data.get('telefono', '').strip()
    if telefono and not validate_phone(telefono):
        errors['telefono'] = 'El formato del teléfono no es válido'
    
    # Validar estado si está presente
    estado = data.get('estado', '').strip()
    if estado and estado not in ['Activo', 'En proceso', 'Rechazado']:
        errors['estado'] = 'El estado debe ser Activo, En proceso o Rechazado'
    
    if errors:
        raise ValidationError(errors)
    
    # Construir diccionario de datos validados
    validated_data = {}
    
    for field in ['nombre', 'email', 'telefono', 'estado', 'puesto', 'notas']:
        if field in data and data[field] is not None:
            validated_data[field] = data[field].strip() if isinstance(data[field], str) else data[field]
    
    return validated_data

def validate_entrevista_data(data, is_update=False):
    """
    Valida los datos de una entrevista.
    
    Args:
        data: Diccionario con los datos de la entrevista
        is_update: Indica si es una actualización
        
    Returns:
        Datos validados
        
    Raises:
        ValidationError: Si hay errores de validación
    """
    errors = {}
    
    # Campos requeridos si no es actualización
    required_fields = ['recluta_id', 'fecha', 'hora'] if not is_update else []
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors[field] = f'El campo {field} es requerido'
    
    # Validar recluta_id
    if 'recluta_id' in data:
        recluta_id = data['recluta_id']
        if not Recluta.query.get(recluta_id):
            errors['recluta_id'] = 'El recluta especificado no existe'
    
    # Validar hora
    if 'hora' in data:
        hora = data.get('hora', '')
        if not validate_time_format(hora):
            errors['hora'] = 'Formato de hora inválido. Use HH:MM'
    
    # Validar duración
    if 'duracion' in data:
        duracion = data.get('duracion')
        try:
            duracion = int(duracion)
            if duracion <= 0:
                errors['duracion'] = 'La duración debe ser un número positivo'
        except (ValueError, TypeError):
            errors['duracion'] = 'La duración debe ser un número'
    
    # Validar tipo
    if 'tipo' in data:
        tipo = data.get('tipo', '')
        if tipo not in ['presencial', 'virtual', 'telefonica']:
            errors['tipo'] = 'El tipo debe ser presencial, virtual o telefonica'
    
    # Validar estado
    if 'estado' in data:
        estado = data.get('estado', '')
        if estado not in ['pendiente', 'completada', 'cancelada']:
            errors['estado'] = 'El estado debe ser pendiente, completada o cancelada'
    
    if errors:
        raise ValidationError(errors)
    
    # Construir diccionario de datos validados
    validated_data = {}
    
    fields = ['recluta_id', 'fecha', 'hora', 'duracion', 'tipo', 'ubicacion', 'notas', 'estado']
    for field in fields:
        if field in data and data[field] is not None:
            validated_data[field] = data[field]
    
    return validated_data

def validate_email(email):
    """
    Valida si un email tiene formato correcto.
    
    Args:
        email: Email a validar
        
    Returns:
        True si el email es válido, False si no
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_password(password):
    """
    Valida si una contraseña cumple los requisitos mínimos.
    
    Args:
        password: Contraseña a validar
        
    Returns:
        (bool, str): True y mensaje vacío si es válida, False y mensaje de error si no
    """
    if len(password) < 6:
        return False, "La contraseña debe tener al menos 6 caracteres"
    
    return True, ""

def validate_phone(phone):
    """
    Valida si un número de teléfono tiene formato correcto.
    
    Args:
        phone: Teléfono a validar
        
    Returns:
        True si el teléfono es válido, False si no
    """
    # Acepta números de teléfono en varios formatos
    pattern = r'^(\+\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$'
    return bool(re.match(pattern, phone))

def validate_time_format(time_str):
    """
    Valida si una hora tiene formato HH:MM.
    
    Args:
        time_str: String de hora a validar
        
    Returns:
        True si el formato es válido, False si no
    """
    pattern = r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
    return bool(re.match(pattern, time_str))

def validate_date_format(date_str):
    """
    Valida si una fecha tiene formato YYYY-MM-DD.
    
    Args:
        date_str: String de fecha a validar
        
    Returns:
        True si el formato es válido, False si no
    """
    pattern = r'^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    return bool(re.match(pattern, date_str))