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
    🔥 VERSIÓN CORREGIDA v1.4.1: Procesa archivo Excel y distribuye reclutas entre asesores.
    
    FIXES APLICADOS:
    - Vuelta a openpyxl para manejo robusto de Excel
    - Manejo correcto de columnas vacías iniciales
    - Validación mejorada de headers flexibles
    - Procesamiento seguro de diferentes tipos de datos
    - Manejo de errores específico y detallado
    
    Args:
        archivo: Archivo Excel uploadado
        asesores: Lista de usuarios asesores activos
        
    Returns:
        Dict con resultado detallado del procesamiento
    """
    try:
        # ✅ USAR OPENPYXL (más robusto que pandas para este caso)
        import openpyxl
        from datetime import datetime
        from models.recluta import Recluta
        from models import db
        
        current_app.logger.info("🔄 Iniciando procesamiento de Excel con openpyxl")
        
        # Cargar workbook
        workbook = openpyxl.load_workbook(archivo, data_only=True)
        sheet = workbook.active
        
        # ✅ OBTENER FILA DE HEADERS COMPLETA (maneja columnas vacías)
        primera_fila = list(sheet.iter_rows(min_row=1, max_row=1, values_only=True))[0]
        current_app.logger.info(f"📋 Headers detectados: {primera_fila}")
        
        # ✅ MAPEO ROBUSTO DE HEADERS (tolerante a columnas vacías)
        headers_requeridos = {
            'fecha_creacion': ['Fecha de creación', 'Fecha de Creación', 'fecha de creacion', 'FECHA DE CREACION'],
            'nombre': ['Nombre', 'NOMBRE', 'nombre', 'Candidato', 'CANDIDATO'],
            'telefono': ['Teléfono', 'Telefono', 'TELEFONO', 'TELÉFONO', 'telefono', 'Celular', 'CELULAR']
        }
        
        indices_encontrados = {}
        headers_disponibles = []
        
        # Buscar cada header requerido en la fila completa
        for i, celda in enumerate(primera_fila):
            # ✅ CONVERSIÓN SEGURA A STRING (maneja None, int, float, etc.)
            if celda is None:
                celda_str = ""
            elif isinstance(celda, (int, float)):
                celda_str = str(celda)
            else:
                celda_str = str(celda).strip()
            
            # Solo agregar headers no vacíos para el log
            if celda_str:
                headers_disponibles.append(celda_str)
            
            # Buscar coincidencias con headers requeridos
            for campo, posibles_nombres in headers_requeridos.items():
                if celda_str in posibles_nombres:
                    indices_encontrados[campo] = i
                    current_app.logger.info(f"✅ Header '{campo}' encontrado en columna {i}: '{celda_str}'")
                    break
        
        # ✅ VALIDACIÓN DE HEADERS REQUERIDOS
        campos_faltantes = [campo for campo in headers_requeridos.keys() if campo not in indices_encontrados]
        
        if campos_faltantes:
            mensaje_error = f"No se encontraron las siguientes columnas requeridas: {campos_faltantes}. "
            mensaje_error += f"Headers disponibles en el Excel: {headers_disponibles}. "
            mensaje_error += f"Se esperaban variaciones de: {dict(headers_requeridos)}"
            
            current_app.logger.error(f"❌ {mensaje_error}")
            
            return {
                "success": False,
                "message": mensaje_error,
                "headers_disponibles": headers_disponibles,
                "headers_esperados": headers_requeridos,
                "tipo_error": "headers_faltantes"
            }
        
        # ✅ PROCESAR DATOS FILA POR FILA
        datos_validos = []
        errores_detalle = []
        telefonos_existentes = set()
        
        # Obtener teléfonos existentes en BD para evitar duplicados
        try:
            telefonos_bd = set(r[0] for r in db.session.query(Recluta.telefono).all() if r[0])
            current_app.logger.info(f"📱 {len(telefonos_bd)} teléfonos existentes en BD")
        except Exception as e:
            current_app.logger.warning(f"⚠️ No se pudieron cargar teléfonos existentes: {str(e)}")
            telefonos_bd = set()
        
        # Procesar cada fila de datos (saltear header)
        total_filas = 0
        for row_num, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            total_filas += 1
            
            # ✅ EXTRACCIÓN SEGURA DE DATOS USANDO ÍNDICES CORRECTOS
            try:
                # Asegurar que la fila tenga suficientes columnas
                row_list = list(row) + [None] * 10  # Pad con None's por si acaso
                
                fecha_raw = row_list[indices_encontrados['fecha_creacion']] if indices_encontrados['fecha_creacion'] < len(row_list) else None
                nombre_raw = row_list[indices_encontrados['nombre']] if indices_encontrados['nombre'] < len(row_list) else None
                telefono_raw = row_list[indices_encontrados['telefono']] if indices_encontrados['telefono'] < len(row_list) else None
                
                # ✅ LIMPIEZA Y VALIDACIÓN DE DATOS
                nombre = str(nombre_raw).strip() if nombre_raw is not None else ""
                telefono = str(telefono_raw).strip() if telefono_raw is not None else ""
                
                # Remover caracteres especiales del teléfono pero mantener números
                telefono_limpio = ''.join(filter(lambda x: x.isdigit() or x in '+-() ', telefono))
                telefono_limpio = telefono_limpio.strip()
                
                current_app.logger.debug(f"Fila {row_num}: nombre='{nombre}', telefono='{telefono_limpio}', fecha='{fecha_raw}'")
                
                # ✅ VALIDACIONES MEJORADAS
                error_fila = None
                
                if not nombre or nombre.lower() in ['none', 'null', '']:
                    error_fila = "Nombre vacío o inválido"
                elif len(nombre) < 2:
                    error_fila = "Nombre demasiado corto"
                elif not telefono_limpio:
                    error_fila = "Teléfono vacío"
                elif len(telefono_limpio) < 8:  # Mínimo 8 dígitos para teléfono válido
                    error_fila = "Teléfono demasiado corto"
                elif telefono_limpio in telefonos_bd:
                    error_fila = f"Teléfono {telefono_limpio} ya existe en la base de datos"
                elif telefono_limpio in telefonos_existentes:
                    error_fila = f"Teléfono {telefono_limpio} está duplicado en el Excel"
                
                if error_fila:
                    errores_detalle.append({
                        "fila": row_num,
                        "error": error_fila,
                        "datos": {"nombre": nombre, "telefono": telefono_limpio}
                    })
                    current_app.logger.warning(f"⚠️ Fila {row_num}: {error_fila}")
                    continue
                
                # ✅ PROCESAMIENTO DE FECHA MEJORADO
                fecha_procesada = datetime.now()  # Default
                
                if fecha_raw:
                    try:
                        if isinstance(fecha_raw, datetime):
                            fecha_procesada = fecha_raw
                        elif isinstance(fecha_raw, str):
                            # Intentar múltiples formatos
                            formatos_fecha = [
                                '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y',
                                '%Y-%m-%d %H:%M:%S', '%d/%m/%Y %H:%M:%S',
                                '%d-%m-%Y', '%m-%d-%Y'
                            ]
                            for formato in formatos_fecha:
                                try:
                                    fecha_procesada = datetime.strptime(str(fecha_raw).strip(), formato)
                                    break
                                except ValueError:
                                    continue
                    except Exception as e:
                        current_app.logger.warning(f"⚠️ Error procesando fecha en fila {row_num}: {str(e)}")
                
                # ✅ AGREGAR A DATOS VÁLIDOS
                telefonos_existentes.add(telefono_limpio)
                datos_validos.append({
                    'nombre': nombre,
                    'telefono': telefono_limpio,
                    'fecha_registro': fecha_procesada,
                    'fila_origen': row_num
                })
                
            except Exception as e:
                errores_detalle.append({
                    "fila": row_num,
                    "error": f"Error procesando fila: {str(e)}",
                    "datos": {"error_detalle": str(e)}
                })
                current_app.logger.error(f"❌ Error en fila {row_num}: {str(e)}")
        
        current_app.logger.info(f"📊 Procesamiento completado: {len(datos_validos)} válidos, {len(errores_detalle)} errores de {total_filas} filas")
        
        # ✅ VALIDAR QUE HAY DATOS PARA PROCESAR
        if not datos_validos:
            return {
                "success": False,
                "message": f"No se encontraron datos válidos para procesar. Se procesaron {total_filas} filas con {len(errores_detalle)} errores.",
                "errores_detalle": errores_detalle[:10],  # Mostrar solo primeros 10 errores
                "total_procesados": total_filas,
                "tipo_error": "sin_datos_validos"
            }
        
        # ✅ DISTRIBUCIÓN EQUITATIVA ENTRE ASESORES
        if not asesores:
            return {
                "success": False,
                "message": "No hay asesores activos disponibles para la distribución",
                "tipo_error": "sin_asesores"
            }
        
        distribucion = {}
        reclutas_por_asesor = len(datos_validos) // len(asesores)
        sobrante = len(datos_validos) % len(asesores)
        
        indice_actual = 0
        for i, asesor in enumerate(asesores):
            cantidad_asignar = reclutas_por_asesor + (1 if i < sobrante else 0)
            reclutas_asesor = datos_validos[indice_actual:indice_actual + cantidad_asignar]
            distribucion[asesor.email] = {
                'reclutas': reclutas_asesor,
                'count': len(reclutas_asesor),
                'is_fixed': False  # Para compatibilidad con frontend
            }
            indice_actual += cantidad_asignar
            
            current_app.logger.info(f"📋 Asesor {asesor.email}: {len(reclutas_asesor)} reclutas asignados")
        
        # ✅ CREAR RECLUTAS EN BASE DE DATOS
        reclutas_creados = 0
        errores_bd = []
        
        try:
            for asesor in asesores:
                if asesor.email not in distribucion:
                    continue
                
                reclutas_asesor = distribucion[asesor.email]['reclutas']
                
                for datos_recluta in reclutas_asesor:
                    try:
                        # Generar email temporal único
                        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                        nombre_limpio = ''.join(c for c in datos_recluta['nombre'] if c.isalnum())[:10]
                        email_temp = f"{nombre_limpio.lower()}{timestamp}@temp.com"
                        
                        nuevo_recluta = Recluta(
                            nombre=datos_recluta['nombre'],
                            email=email_temp,
                            telefono=datos_recluta['telefono'],
                            estado='En proceso',
                            asesor_id=asesor.id,
                            fecha_registro=datos_recluta['fecha_registro']
                        )
                        
                        db.session.add(nuevo_recluta)
                        reclutas_creados += 1
                        
                    except Exception as e:
                        errores_bd.append({
                            "fila": datos_recluta.get('fila_origen', 'N/A'),
                            "error": f"Error BD: {str(e)}",
                            "datos": datos_recluta
                        })
                        current_app.logger.error(f"❌ Error creando recluta: {str(e)}")
            
            # Confirmar transacción
            db.session.commit()
            current_app.logger.info(f"✅ {reclutas_creados} reclutas creados exitosamente")
            
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"❌ Error crítico en BD: {str(e)}")
            return {
                "success": False,
                "message": f"Error crítico al guardar en base de datos: {str(e)}",
                "tipo_error": "error_bd"
            }
        
        # ✅ PREPARAR RESPUESTA FINAL
        todos_los_errores = errores_detalle + errores_bd
        
        # Preparar distribución para frontend (solo conteos)
        distribucion_frontend = {}
        for asesor in asesores:
            if asesor.email in distribucion:
                distribucion_frontend[asesor.email] = {
                    'count': distribucion[asesor.email]['count'],
                    'is_fixed': False
                }
        
        resultado_final = {
            "success": True,
            "total_procesados": total_filas,
            "exitosos": reclutas_creados,
            "errores": len(todos_los_errores),
            "distribucion": distribucion_frontend,
            "errores_detalle": todos_los_errores[:10] if todos_los_errores else [],
            "mensaje_exito": f"Se procesaron {reclutas_creados} reclutas exitosamente",
            "resumen": {
                "filas_total": total_filas,
                "datos_validos": len(datos_validos),
                "datos_invalidos": len(errores_detalle),
                "errores_bd": len(errores_bd),
                "asesores_utilizados": len([a for a in asesores if a.email in distribucion and distribucion[a.email]['count'] > 0])
            }
        }
        
        current_app.logger.info(f"🎉 Procesamiento completado exitosamente: {resultado_final['resumen']}")
        return resultado_final
        
    except Exception as e:
        current_app.logger.error(f"💥 Error crítico en procesamiento de Excel: {str(e)}")
        return {
            "success": False,
            "message": f"Error crítico al procesar el archivo Excel: {str(e)}",
            "tipo_error": "error_critico",
            "error_detalle": str(e)
        }