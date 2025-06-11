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
    ✅ VERSIÓN CORREGIDA: Procesa archivo Excel y distribuye reclutas automáticamente entre asesores.
    
    FIXES APLICADOS:
    - Mapeo correcto de columnas respetando celdas vacías
    - Búsqueda directa en fila completa sin filtrado
    - Validación robusta de headers flexibles
    - Manejo mejorado de errores con detalles específicos
    
    Args:
        archivo: Archivo Excel uploadado
        asesores: Lista de usuarios asesores activos
        
    Returns:
        Dict con resultado detallado del procesamiento
    """
    try:
        # Leer Excel
        workbook = openpyxl.load_workbook(archivo, data_only=True)
        sheet = workbook.active
        
        # Obtener fila completa de headers (SIN FILTRAR)
        primera_fila = list(sheet.iter_rows(min_row=1, max_row=1, values_only=True))[0]
        
        # ✅ BÚSQUEDA DIRECTA EN FILA COMPLETA (respeta columnas vacías)
        headers_requeridos = ["Fecha de creación", "Nombre", "Teléfono"]
        indices_encontrados = {}
        headers_disponibles = []
        
        # Mapear cada header requerido a su posición real en el Excel
        for i, cell in enumerate(primera_fila):
            cell_value = str(cell).strip() if cell is not None else ""
            if cell_value:  # Solo agregar headers no vacíos para logging
                headers_disponibles.append(cell_value)
            
            # Buscar headers requeridos por su posición exacta
            for header_req in headers_requeridos:
                if cell_value == header_req:
                    indices_encontrados[header_req] = i
                    break
        
        # Validar que se encontraron todos los headers requeridos
        headers_faltantes = [h for h in headers_requeridos if h not in indices_encontrados]
        if headers_faltantes:
            return {
                "success": False,
                "message": f"Headers faltantes: {headers_faltantes}. Disponibles: {headers_disponibles}",
                "headers_disponibles": headers_disponibles,
                "headers_requeridos": headers_requeridos
            }
        
        # ✅ USAR ÍNDICES REALES PARA ACCESO A DATOS
        indice_fecha = indices_encontrados["Fecha de creación"]
        indice_nombre = indices_encontrados["Nombre"]
        indice_telefono = indices_encontrados["Teléfono"]
        
        print(f"🔍 DEBUG - Índices mapeados: Fecha={indice_fecha}, Nombre={indice_nombre}, Teléfono={indice_telefono}")
        
        # Extraer y validar datos
        datos_excel = []
        errores = []
        telefonos_existentes = set()
        
        # Obtener teléfonos ya existentes en BD para evitar duplicados
        telefonos_bd = set(r[0] for r in db.session.query(Recluta.telefono).all())
        
        for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            # ✅ ACCESO SEGURO CON ÍNDICES CORRECTOS
            fecha_str = row[indice_fecha] if len(row) > indice_fecha and row[indice_fecha] is not None else None
            nombre = row[indice_nombre] if len(row) > indice_nombre and row[indice_nombre] is not None else None
            telefono = row[indice_telefono] if len(row) > indice_telefono and row[indice_telefono] is not None else None
            
            # Limpiar y validar datos
            nombre = str(nombre).strip() if nombre is not None else ""
            telefono = str(telefono).strip() if telefono is not None else ""
            
            # Validaciones mejoradas
            error_fila = None
            
            if not nombre:
                error_fila = "Nombre vacío o inválido"
            elif not telefono:
                error_fila = "Teléfono vacío o inválido"
            elif telefono in telefonos_bd:
                error_fila = f"Teléfono {telefono} ya existe en BD"
            elif telefono in telefonos_existentes:
                error_fila = f"Teléfono {telefono} duplicado en Excel"
            
            if error_fila:
                errores.append({
                    "fila": row_num, 
                    "error": error_fila,
                    "datos": {"nombre": nombre, "telefono": telefono}
                })
            else:
                # Agregar a dataset válido
                telefonos_existentes.add(telefono)
                
                # Procesar fecha con múltiples formatos
                fecha_procesada = None
                if fecha_str:
                    try:
                        if isinstance(fecha_str, datetime):
                            fecha_procesada = fecha_str
                        elif isinstance(fecha_str, str):
                            # Intentar múltiples formatos de fecha
                            formatos_fecha = [
                                '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', 
                                '%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M'
                            ]
                            for formato in formatos_fecha:
                                try:
                                    fecha_procesada = datetime.strptime(fecha_str.strip(), formato)
                                    break
                                except ValueError:
                                    continue
                    except Exception as e:
                        print(f"⚠️ Error procesando fecha fila {row_num}: {str(e)}")
                
                # Usar fecha actual si no se pudo procesar
                if not fecha_procesada:
                    fecha_procesada = datetime.now()
                
                datos_excel.append({
                    'nombre': nombre,
                    'telefono': telefono,
                    'fecha_registro': fecha_procesada,
                    'fila': row_num
                })
        
        # ✅ DISTRIBUCIÓN EQUITATIVA MEJORADA
        if not datos_excel:
            return {
                "success": False,
                "message": "No hay datos válidos para procesar",
                "errores_detalle": errores[:10]
            }
        
        # Distribuir entre asesores activos
        distribucion = distribuir_equitativamente(datos_excel, asesores)
        
        # Crear reclutas en BD con manejo de errores robusto
        reclutas_creados = 0
        errores_bd = []
        
        for asesor in asesores:
            reclutas_asesor = distribucion.get(asesor.email, [])
            
            for datos_recluta in reclutas_asesor:
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
                        "error": f"Error BD: {str(e)}",
                        "datos": datos_recluta
                    })
        
        # Preparar reporte final detallado
        todos_errores = errores + errores_bd
        
        reporte_distribucion = {
            asesor.email: len(distribucion.get(asesor.email, []))
            for asesor in asesores
        }
        
        return {
            "success": True,
            "total_procesados": len(datos_excel) + len(errores),
            "exitosos": reclutas_creados,
            "errores": len(todos_errores),
            "distribucion": reporte_distribucion,
            "errores_detalle": todos_errores[:10],  # Primeros 10 errores para UI
            "resumen": {
                "filas_excel": row_num - 1,  # Total de filas procesadas
                "datos_validos": len(datos_excel),
                "datos_invalidos": len(errores),
                "errores_bd": len(errores_bd),
                "asesores_utilizados": len([a for a in asesores if a.email in distribucion])
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "message": f"Error crítico al procesar Excel: {str(e)}",
            "tipo_error": "error_sistema"
        }


def distribuir_equitativamente(datos_excel, asesores):
    """
    ✅ FUNCIÓN MEJORADA: Distribuye lista de datos equitativamente entre asesores.
    
    Args:
        datos_excel: Lista de datos de reclutas validados
        asesores: Lista de objetos Usuario asesor activos
        
    Returns:
        Dict con distribución por email de asesor
    """
    if not asesores or not datos_excel:
        return {}
    
    total_reclutas = len(datos_excel)
    num_asesores = len(asesores)
    
    # Cálculo de distribución equitativa
    reclutas_por_asesor = total_reclutas // num_asesores
    sobrantes = total_reclutas % num_asesores
    
    # Distribuir con algoritmo round-robin optimizado
    distribucion = {}
    indice_actual = 0
    
    for i, asesor in enumerate(asesores):
        # Asignar cantidad base + 1 extra para los primeros N asesores (sobrantes)
        cantidad_asignar = reclutas_por_asesor + (1 if i < sobrantes else 0)
        
        # Extraer slice correspondiente
        reclutas_asesor = datos_excel[indice_actual:indice_actual + cantidad_asignar]
        distribucion[asesor.email] = reclutas_asesor
        
        indice_actual += cantidad_asignar
        
        print(f"📊 Asesor {asesor.email}: {len(reclutas_asesor)} reclutas asignados")

    return distribucion