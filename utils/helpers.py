import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
from datetime import datetime, date
import json

def guardar_archivo(archivo, tipo):
    """
    Guarda un archivo en el servidor y devuelve la ruta relativa.
    tipo puede ser 'recluta' o 'usuario'
    
    Args:
        archivo: Objeto de archivo de Flask (request.files)
        tipo: Tipo de archivo ('recluta' o 'usuario')
        
    Returns:
        Ruta relativa del archivo guardado, o None si hay un error
    """
    if not archivo:
        return None
        
    try:
        # Generar nombre único para el archivo
        filename = secure_filename(archivo.filename)
        nombre_base, extension = os.path.splitext(filename)
        nombre_unico = f"{nombre_base}_{uuid.uuid4().hex}{extension}"
        
        # Crear subdirectorio si no existe
        directorio = os.path.join(current_app.config['UPLOAD_FOLDER'], tipo)
        if not os.path.exists(directorio):
            os.makedirs(directorio)
        
        # Guardar el archivo
        ruta_completa = os.path.join(directorio, nombre_unico)
        archivo.save(ruta_completa)
        
        # Devolver ruta relativa para guardar en BD
        return os.path.join(f"static/uploads/{tipo}", nombre_unico)
    except Exception as e:
        current_app.logger.error(f"Error al guardar archivo: {str(e)}")
        return None

def eliminar_archivo(ruta_relativa):
    """
    Elimina un archivo del servidor.
    
    Args:
        ruta_relativa: Ruta relativa del archivo a eliminar
        
    Returns:
        True si se elimina correctamente, False en caso contrario
    """
    if not ruta_relativa:
        return False
        
    try:
        ruta_completa = os.path.join(current_app.root_path, ruta_relativa)
        if os.path.exists(ruta_completa):
            os.remove(ruta_completa)
            return True
        return False
    except Exception as e:
        current_app.logger.error(f"Error al eliminar archivo: {str(e)}")
        return False

class JSONEncoder(json.JSONEncoder):
    """
    Codificador JSON personalizado para manejar tipos de datos específicos
    como datetime y date.
    """
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def format_date(date_string, output_format='%d/%m/%Y'):
    """
    Formatea una fecha en string al formato especificado.
    
    Args:
        date_string: String de fecha en formato ISO
        output_format: Formato de salida deseado
        
    Returns:
        String con la fecha formateada
    """
    try:
        if isinstance(date_string, (datetime, date)):
            return date_string.strftime(output_format)
            
        if isinstance(date_string, str):
            dt = datetime.fromisoformat(date_string.replace('Z', '+00:00'))
            return dt.strftime(output_format)
            
        return "Fecha no válida"
    except Exception:
        return "Fecha no válida"

def paginate_data(data, page, per_page):
    """
    Implementa paginación manual para una lista de datos.
    
    Args:
        data: Lista de datos a paginar
        page: Número de página (comienza en 1)
        per_page: Elementos por página
        
    Returns:
        Diccionario con datos paginados y metadatos
    """
    total = len(data)
    pages = (total + per_page - 1) // per_page  # Redondeo hacia arriba
    
    # Validar página
    page = max(1, min(page, pages if pages > 0 else 1))
    
    # Calcular índices
    start_idx = (page - 1) * per_page
    end_idx = min(start_idx + per_page, total)
    
    # Extraer elementos de la página actual
    items = data[start_idx:end_idx]
    
    return {
        'items': items,
        'page': page,
        'per_page': per_page,
        'total': total,
        'pages': pages,
        'has_prev': page > 1,
        'has_next': page < pages
    }