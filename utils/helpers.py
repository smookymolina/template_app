import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app
from datetime import datetime, date
import json

def guardar_archivo(archivo, subdirectorio='', tipos_permitidos=['jpg', 'jpeg', 'png', 'gif', 'pdf'], max_size=5 * 1024 * 1024):
    """
    Guarda un archivo en el sistema.
    
    Args:
        archivo: Archivo FileStorage de Flask
        subdirectorio: Subdirectorio dentro de uploads
        tipos_permitidos: Lista de extensiones permitidas (ahora incluye 'pdf')
        max_size: Tamaño máximo en bytes (default 5MB)
        
    Returns:
        str: Ruta relativa del archivo guardado o None si hay error
    """
    try:
        # Validar extensión
        if archivo.filename == '':
            return None
            
        extension = archivo.filename.rsplit('.', 1)[1].lower()
        if extension not in tipos_permitidos:
            raise ValueError(f"Tipo de archivo no permitido. Solo se permiten: {', '.join(tipos_permitidos)}")
        
        # Validar tamaño
        archivo.seek(0, os.SEEK_END)
        tamaño = archivo.tell()
        archivo.seek(0)
        
        if tamaño > max_size:
            raise ValueError(f"Archivo demasiado grande. Máximo {max_size / (1024*1024):.1f}MB")
        
        # Crear nombre único
        nombre_seguro = secure_filename(archivo.filename)
        nombre_unico = f"{uuid.uuid4().hex}_{nombre_seguro}"
        
        # Crear ruta completa
        upload_dir = current_app.config['UPLOAD_FOLDER']
        if subdirectorio:
            upload_dir = os.path.join(upload_dir, subdirectorio)
        
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        ruta_completa = os.path.join(upload_dir, nombre_unico)
        
        # Guardar archivo
        archivo.save(ruta_completa)
        
        # Devolver ruta relativa
        return os.path.join('static', 'uploads', subdirectorio, nombre_unico)
        
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