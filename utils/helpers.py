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

import openpyxl
from datetime import datetime
from models.recluta import Recluta
from models import db

def procesar_y_distribuir_excel(archivo, asesores):
    """
    Procesa archivo Excel y distribuye reclutas automáticamente entre asesores.
    
    Args:
        archivo: Archivo Excel uploadado
        asesores: Lista de usuarios asesores activos
        
    Returns:
        Dict con resultado del procesamiento
    """
    try:
        # Leer Excel
        workbook = openpyxl.load_workbook(archivo, data_only=True)
        sheet = workbook.active
        
        # Validar headers
        headers_esperados = ["Fecha de creación", "Nombre", "Teléfono"]
        headers_encontrados = [cell.value for cell in sheet[1]]
        
        if headers_encontrados != headers_esperados:
            return {
                "success": False,
                "message": f"Headers incorrectos. Esperados: {headers_esperados}, Encontrados: {headers_encontrados}"
            }
        
        # Extraer datos
        datos_excel = []
        errores = []
        telefonos_existentes = set()
        
        # Obtener teléfonos ya existentes en BD
        telefonos_bd = set(r[0] for r in db.session.query(Recluta.telefono).all())
        
        for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            fecha_str, nombre, telefono = row[:3]
            
            # Validaciones
            error_fila = None
            
            if not nombre or str(nombre).strip() == '':
                error_fila = "Nombre vacío"
            elif not telefono:
                error_fila = "Teléfono vacío"
            else:
                telefono_str = str(telefono).strip()
                if telefono_str in telefonos_bd or telefono_str in telefonos_existentes:
                    error_fila = "Teléfono duplicado"
                else:
                    telefonos_existentes.add(telefono_str)
            
            if error_fila:
                errores.append({"fila": row_num, "error": error_fila})
            else:
                # Procesar fecha
                fecha_procesada = None
                if fecha_str:
                    try:
                        if isinstance(fecha_str, datetime):
                            fecha_procesada = fecha_str
                        else:
                            # Intentar varios formatos
                            for formato in ["%d/%m/%Y %I:%M%p", "%d/%m/%Y", "%Y-%m-%d"]:
                                try:
                                    fecha_procesada = datetime.strptime(str(fecha_str), formato)
                                    break
                                except ValueError:
                                    continue
                    except:
                        pass
                
                datos_excel.append({
                    'nombre': str(nombre).strip(),
                    'telefono': str(telefono).strip(),
                    'fecha_registro': fecha_procesada or datetime.utcnow(),
                    'fila': row_num
                })
        
        # Distribuir entre asesores
        distribucion = distribuir_equitativamente(datos_excel, asesores)
        
        # Crear reclutas en BD
        reclutas_creados = 0
        errores_bd = []
        
        for asesor_email, reclutas_asignados in distribucion.items():
            asesor = next((a for a in asesores if a.email == asesor_email), None)
            if not asesor:
                continue
                
            for datos_recluta in reclutas_asignados:
                try:
                    nuevo_recluta = Recluta(
                        nombre=datos_recluta['nombre'],
                        email=f"temp_{datos_recluta['telefono']}@temp.com",  # Email temporal
                        telefono=datos_recluta['telefono'],
                        estado='En proceso',
                        asesor_id=asesor.id,
                        fecha_registro=datos_recluta['fecha_registro']
                    )
                    nuevo_recluta.save()
                    reclutas_creados += 1
                    
                except Exception as e:
                    errores_bd.append({
                        "fila": datos_recluta['fila'], 
                        "error": f"Error BD: {str(e)}"
                    })
        
        # Combinar todos los errores
        todos_errores = errores + errores_bd
        
        # Preparar reporte
        reporte_distribucion = {
            asesor.email: len(reclutas) 
            for asesor.email, reclutas in distribucion.items()
        }
        
        return {
            "success": True,
            "total_procesados": len(datos_excel) + len(errores),
            "exitosos": reclutas_creados,
            "errores": len(todos_errores),
            "distribucion": reporte_distribucion,
            "errores_detalle": todos_errores[:10]  # Máximo 10 errores para UI
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error al procesar Excel: {str(e)}"
        }

def distribuir_equitativamente(datos_excel, asesores):
    """
    Distribuye lista de datos equitativamente entre asesores.
    
    Args:
        datos_excel: Lista de datos de reclutas
        asesores: Lista de objetos Usuario asesor
        
    Returns:
        Dict con distribución por email de asesor
    """
    if not asesores or not datos_excel:
        return {}
    
    total_reclutas = len(datos_excel)
    num_asesores = len(asesores)
    
    # Calcular distribución base
    reclutas_por_asesor = total_reclutas // num_asesores
    sobrantes = total_reclutas % num_asesores
    
    # Distribuir
    distribucion = {}
    indice_actual = 0
    
    for i, asesor in enumerate(asesores):
        # Asignar cantidad base + 1 extra si hay sobrantes
        cantidad_asignar = reclutas_por_asesor + (1 if i < sobrantes else 0)
        
        # Tomar slice de datos
        reclutas_asesor = datos_excel[indice_actual:indice_actual + cantidad_asignar]
        distribucion[asesor.email] = reclutas_asesor
        
        indice_actual += cantidad_asignar
    
    return distribucion