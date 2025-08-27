import os
import uuid
import hashlib
import logging
from PIL import Image
from werkzeug.utils import secure_filename
from flask import current_app, request
from datetime import datetime, date, timedelta
import json
import re
from collections import defaultdict

# Configuración de seguridad para archivos
ALLOWED_EXTENSIONS = {
    'image': {'jpg', 'jpeg', 'png', 'gif', 'webp'},
    'document': {'pdf', 'doc', 'docx', 'txt'},
    'excel': {'xlsx', 'xls', 'csv'}
}

MAX_FILE_SIZES = {
    'image': 5 * 1024 * 1024,
    'document': 10 * 1024 * 1024,
    'excel': 15 * 1024 * 1024
}

def validate_file_extension(filename, file_type):
    if not filename or '.' not in filename:
        return False
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS.get(file_type, set())

def guardar_archivo(archivo, tipo):
    if not archivo:
        return None
    try:
        filename = secure_filename(archivo.filename)
        nombre_base, extension = os.path.splitext(filename)
        nombre_unico = f'{nombre_base}_{uuid.uuid4().hex}{extension}'
        
        directorio = os.path.join(current_app.config['UPLOAD_FOLDER'], tipo)
        if not os.path.exists(directorio):
            os.makedirs(directorio)
        
        ruta_completa = os.path.join(directorio, nombre_unico)
        archivo.save(ruta_completa)
        
        return os.path.join(f'static/uploads/{tipo}', nombre_unico)
    except Exception as e:
        current_app.logger.error(f'Error al guardar archivo: {str(e)}')
        return None

def eliminar_archivo(ruta_relativa):
    if not ruta_relativa:
        return {'success': False, 'message': 'No se proporciono ruta de archivo.'}
    try:
        ruta_completa = os.path.join(current_app.root_path, ruta_relativa)
        upload_folder = os.path.join(current_app.root_path, current_app.config['UPLOAD_FOLDER'])
        if not os.path.abspath(ruta_completa).startswith(os.path.abspath(upload_folder)):
            return {'success': False, 'message': 'Ruta de archivo no valida.'}
        
        if os.path.exists(ruta_completa):
            os.remove(ruta_completa)
            return {'success': True, 'message': 'Archivo eliminado correctamente.'}
        else:
            return {'success': False, 'message': 'Archivo no encontrado.'}
    except Exception as e:
        return {'success': False, 'message': f'Error al eliminar archivo: {str(e)}'}

class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def format_date(date_string, output_format='%d/%m/%Y'):
    if not date_string:
        return None
    try:
        input_formats = ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S']
        parsed_date = None
        for fmt in input_formats:
            try:
                parsed_date = datetime.strptime(date_string, fmt)
                break
            except ValueError:
                continue
        if parsed_date:
            return parsed_date.strftime(output_format)
        else:
            return date_string
    except Exception as e:
        current_app.logger.warning(f'Error formateando fecha: {str(e)}')
        return date_string

def paginate_data(data, page, per_page):
    total = len(data)
    start = (page - 1) * per_page
    end = start + per_page
    items = data[start:end]
    
    return {
        'items': items,
        'total': total,
        'pages': (total + per_page - 1) // per_page,
        'current_page': page,
        'per_page': per_page
    }

def get_next_asesor(asesores, last_asesor_index):
    """
    Obtiene el siguiente asesor de la lista de forma circular.
    """
    if not asesores:
        return None, -1
    
    next_index = (last_asesor_index + 1) % len(asesores)
    return asesores[next_index], next_index

def procesar_y_distribuir_excel(archivo, asesores):
    """
    Procesa un archivo Excel de reclutas y los distribuye entre los asesores.
    """
    import pandas as pd
    from models import db
    from models.recluta import Recluta
    from flask import current_app
    from datetime import datetime

    column_mapping = {
        'nombre': ['nombre'],
        'telefono': ['telefono', 'teléfono'],
        'fecha_creacion': ['fecha de creacion', 'fecha de creación']
    }

    try:
        df = pd.read_excel(archivo, engine='openpyxl', header=1)

        # Clean column names (convert to string, lowercase and strip whitespace)
        cleaned_columns = {str(col).strip().lower(): col for col in df.columns}
        
        found_columns = {}
        for field, possible_names in column_mapping.items():
            for name in possible_names:
                if name in cleaned_columns:
                    found_columns[field] = cleaned_columns[name]
                    break
        
        required_fields = ['nombre', 'telefono', 'fecha_creacion']
        for field in required_fields:
            if field not in found_columns:
                return {"success": False, "message": f"No se encontró una columna para el campo requerido: '{field}'. Se esperaba una de: {column_mapping[field]}"}

        last_asesor_index = -1
        nuevos_reclutas = []

        for index, row in df.iterrows():
            # Generate temporary email
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            nombre_limpio = ''.join(e for e in row[found_columns['nombre']] if e.isalnum())
            temp_email = f"{nombre_limpio.lower()}{timestamp}@temp.com"

            nuevo_recluta = Recluta(
                nombre=row[found_columns['nombre']],
                email=temp_email,
                telefono=str(row[found_columns['telefono']]),
                fecha_registro=row[found_columns['fecha_creacion']],
                estado='En proceso'
            )

            asesor, last_asesor_index = get_next_asesor(asesores, last_asesor_index)
            if asesor:
                nuevo_recluta.asesor_id = asesor.id

            nuevos_reclutas.append(nuevo_recluta)

        db.session.add_all(nuevos_reclutas)
        db.session.commit()

        return {
            "success": True,
            "message": f"Se procesaron y distribuyeron {len(nuevos_reclutas)} reclutas exitosamente.",
            "total_procesados": len(nuevos_reclutas)
        }

    except Exception as e:
        current_app.logger.error(f"Error al procesar el archivo Excel: {str(e)}")
        return {"success": False, "message": f"Error al procesar el archivo Excel: {str(e)}"}