from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, DatabaseError
from models.recluta import Recluta
from models.usuario import Usuario
from utils.decorators import admin_required, role_required
from models.entrevista import Entrevista  # Importación específica desde el módulo
from utils.helpers import guardar_archivo, eliminar_archivo
from utils.validators import validate_recluta_data, validate_entrevista_data, ValidationError
from sqlalchemy import func, case, extract, desc
from datetime import datetime, timedelta
from collections import defaultdict
import os
import calendar

api_bp = Blueprint('api', __name__)

# ----- API DE RECLUTAS -----

@api_bp.route('/asesores', methods=['GET'])
@login_required
def get_asesores():
    """
    Obtiene la lista de usuarios que pueden ser asesores.
    Solo devuelve usuarios con rol 'asesor' o 'gerente', no administradores.
    """
    try:
        # Filtrar solo usuarios con rol de asesor o gerente
        asesores = Usuario.query.filter(
            Usuario.is_active == True,
            Usuario.rol.in_(['asesor', 'gerente'])
        ).all()
        
        return jsonify({
            "success": True,
            "asesores": [a.serialize() for a in asesores]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener asesores: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener asesores: {str(e)}"}), 500

@api_bp.route('/reclutas', methods=['GET'])
@login_required
def get_reclutas():
    try:
        # Parámetros existentes
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', current_app.config['DEFAULT_PAGE_SIZE'], type=int)
        search = request.args.get('search', '')
        estado = request.args.get('estado', '')
        sort_by = request.args.get('sort_by', 'id')
        sort_order = request.args.get('sort_order', 'asc')
        
        # 🆕 NUEVO: Parámetro de filtro por asesor
        asesor_id = request.args.get('asesor_id', '')
        
        per_page = min(per_page, current_app.config['MAX_PAGE_SIZE'])
        
        # Construir query base
        query = Recluta.query
        
        # 🆕 NUEVO: Filtrar por rol del usuario actual
        if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            # Si es asesor, solo sus reclutas
            query = query.filter_by(asesor_id=current_user.id)
        elif hasattr(current_user, 'rol') and current_user.rol == 'admin' and asesor_id:
            # Si es admin y especifica un asesor, filtrar por ese asesor
            if asesor_id == 'sin_asignar':
                query = query.filter(Recluta.asesor_id.is_(None))
            elif asesor_id.isdigit():
                query = query.filter_by(asesor_id=int(asesor_id))
        
        # Aplicar filtros existentes
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Recluta.nombre.ilike(search_term),
                    Recluta.email.ilike(search_term),
                    Recluta.telefono.ilike(search_term),
                    Recluta.puesto.ilike(search_term),
                    Recluta.folio.ilike(search_term)
                )
            )
        
        if estado:
            query = query.filter_by(estado=estado)
        
        # Aplicar ordenamiento
        if hasattr(Recluta, sort_by):
            attr = getattr(Recluta, sort_by)
            if sort_order.lower() == 'desc':
                attr = attr.desc()
            query = query.order_by(attr)
        
        # Paginación
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            "success": True,
            "reclutas": [r.serialize() for r in pagination.items],
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page,
            "per_page": per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
            "user_role": getattr(current_user, 'rol', 'user'),
            "applied_filters": {  # 🆕 NUEVO: Información de filtros aplicados
                "asesor_id": asesor_id,
                "estado": estado,
                "search": search
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener reclutas: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener reclutas: {str(e)}"}), 500

@api_bp.route('/reclutas/<int:id>', methods=['GET'])
@login_required
def get_recluta(id):
    """
    Obtiene los detalles de un recluta específico.
    Para asesores, verifica que el recluta esté asignado a ellos.
    """
    try:
        recluta = Recluta.get_by_id(id, current_user=current_user)
        if not recluta:
            return jsonify({
                "success": False, 
                "message": "Recluta no encontrado"
            }), 404
            
        return jsonify({
            "success": True,
            "recluta": recluta.serialize()
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener recluta {id}: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Error al obtener recluta: {str(e)}"
        }), 500

@api_bp.route('/usuario/rol', methods=['GET'])
@login_required
def get_usuario_rol():
    """
    Obtiene información del rol del usuario autenticado.
    """
    try:
        # Obtener el rol del usuario actual
        rol = getattr(current_user, 'rol', 'asesor')  # ✅ CAMBIO: Default 'asesor'
        
        # Si no tiene rol definido, asignar asesor por defecto
        if not rol:
            rol = 'asesor'  # ✅ CAMBIO: Default 'asesor' en lugar de 'admin'
            current_user.rol = rol
            db.session.commit()
            current_app.logger.info(f"Asignado rol por defecto 'asesor' al usuario {current_user.email}")
        
        # ✅ PERMISOS ESPECÍFICOS MEJORADOS
        permisos = {
    'admin': {
        "is_admin": True,
        "is_asesor": False,
        "can_assign_asesores": True,
        "can_see_all_reclutas": True,
        "can_manage_users": True,
        "show_asesor_column": True
    },
    'asesor': {
        "is_admin": False,
        "is_asesor": True,
        "can_assign_asesores": False,
        "can_see_all_reclutas": False,
        "can_manage_users": False,
        "show_asesor_column": False
    },
    'gerente': {  # MANTENER ESTA SECCIÓN SIN CAMBIOS
        "is_admin": False,
        "is_asesor": True,
        "can_assign_asesores": False,
        "can_see_all_reclutas": False,
        "can_manage_users": False,
        "show_asesor_column": False
    },
    'user': {  # MANTENER ESTA SECCIÓN SIN CAMBIOS
        "is_admin": False,
        "is_asesor": False,
        "can_assign_asesores": False,
        "can_see_all_reclutas": False,
        "can_manage_users": False,
        "show_asesor_column": False
    }
}
        
        user_permisos = permisos.get(rol, permisos['user'])
        
        current_app.logger.info(f"Rol obtenido para usuario {current_user.email}: {rol}")
        
        return jsonify({
            "success": True,
            "rol": rol,
            "permisos": user_permisos
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener rol del usuario: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener rol: {str(e)}"}), 500

@api_bp.route('/reclutas', methods=['POST'])
@login_required
def add_recluta():
    """
    Crea un nuevo recluta.
    Para asesores, asigna automáticamente el recluta a él mismo ignorando cualquier asesor_id proporcionado.
    """
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            
        # Validar datos
        try:
            validated_data = validate_recluta_data(data)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400
        
        # Si el usuario es asesor, asignar automáticamente el recluta a él
        # e ignorar cualquier asesor_id proporcionado
        if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            validated_data['asesor_id'] = current_user.id
        
        # Crear nuevo recluta
        nuevo = Recluta(**validated_data)
        
        # Procesar foto si existe
        if 'foto' in request.files:
            archivo = request.files['foto']
            if archivo and archivo.filename:
                ruta_relativa = guardar_archivo(archivo, 'recluta')
                if ruta_relativa:
                    nuevo.foto_url = ruta_relativa
        
        # Guardar en base de datos
        try:
            nuevo.save()
            current_app.logger.info(f"Recluta creado: {nuevo.id} - {nuevo.nombre}")
            return jsonify({"success": True, "recluta": nuevo.serialize()}), 201
        except DatabaseError as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al crear recluta: {str(e)}")
        return jsonify({"success": False, "message": f"Error al crear recluta: {str(e)}"}), 500

@api_bp.route('/reclutas/<int:id>', methods=['PUT'])
@login_required
def update_recluta(id):
    """
    Actualiza un recluta existente.
    Para asesores, verifica que el recluta esté asignado a ellos.
    """
    try:
        recluta = Recluta.get_by_id(id)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado"}), 404
        
        # Verificar permisos según rol
        if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            if recluta.asesor_id != current_user.id:
                return jsonify({
                    "success": False, 
                    "message": "No tienes permisos para modificar este recluta"
                }), 403
        
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            
        # Validar datos
        try:
            validated_data = validate_recluta_data(data, is_update=True)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400
        
        # Para asesores, no permitir cambiar el asesor_id
        if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            if 'asesor_id' in validated_data:
                # Ignorar el asesor_id enviado y mantener el actual
                validated_data['asesor_id'] = current_user.id
        
        # Actualizar campos
        for key, value in validated_data.items():
            setattr(recluta, key, value)
        
        # Procesar foto si existe
        if 'foto' in request.files:
            archivo = request.files['foto']
            if archivo and archivo.filename:
                # Eliminar foto anterior si existe
                if recluta.foto_url:
                    eliminar_archivo(recluta.foto_url)
                    
                ruta_relativa = guardar_archivo(archivo, 'recluta')
                if ruta_relativa:
                    recluta.foto_url = ruta_relativa
        
        # Guardar cambios
        try:
            recluta.save()
            current_app.logger.info(f"Recluta actualizado: {recluta.id} - {recluta.nombre}")
            return jsonify({"success": True, "recluta": recluta.serialize()})
        except DatabaseError as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al actualizar recluta {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error al actualizar recluta: {str(e)}"}), 500

@api_bp.route('/reclutas/<int:id>', methods=['DELETE'])
@login_required
def delete_recluta(id):
    """
    Elimina un recluta existente.
    Para asesores, verifica que el recluta esté asignado a ellos.
    """
    try:
        recluta = Recluta.get_by_id(id)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado"}), 404
        
        # Verificar permisos según rol
        if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            if recluta.asesor_id != current_user.id:
                return jsonify({
                    "success": False, 
                    "message": "No tienes permisos para eliminar este recluta"
                }), 403
        
        # Guardar información antes de eliminar para el log
        recluta_info = f"ID: {recluta.id}, Nombre: {recluta.nombre}, Email: {recluta.email}"
        
        # Eliminar foto si existe
        if recluta.foto_url:
            eliminar_archivo(recluta.foto_url)
        
        # Eliminar recluta
        try:
            recluta.delete()
            current_app.logger.info(f"Recluta eliminado: {recluta_info}")
            return jsonify({"success": True, "message": "Recluta eliminado correctamente"})
        except DatabaseError as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al eliminar recluta {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error al eliminar recluta: {str(e)}"}), 500

# ----- API DE ENTREVISTAS -----

@api_bp.route('/entrevistas', methods=['GET'])
@login_required
def get_entrevistas():
    """
    Obtiene la lista de entrevistas.
    Para asesores, solo muestra las entrevistas de sus reclutas asignados.
    """
    try:
        # Filtro opcional por recluta_id
        recluta_id = request.args.get('recluta_id', type=int)
        
        if recluta_id:
            # Verificar que el usuario tenga acceso al recluta
            recluta = Recluta.get_by_id(recluta_id, current_user=current_user)
            if not recluta:
                return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos para acceder"}), 404
                
            entrevistas = Entrevista.get_for_recluta(recluta_id)
        else:
            # Si el usuario es asesor, filtrar solo sus reclutas
            if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
                # Obtener IDs de reclutas asignados al asesor
                reclutas_ids = [r.id for r in Recluta.query.filter_by(asesor_id=current_user.id).all()]
                entrevistas = Entrevista.query.filter(Entrevista.recluta_id.in_(reclutas_ids)).all()
            else:
                # Para admins, mostrar todas
                entrevistas = Entrevista.query.all()
            
        return jsonify({
            "success": True,
            "entrevistas": [e.serialize() for e in entrevistas]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener entrevistas: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener entrevistas: {str(e)}"}), 500

@api_bp.route('/entrevistas/<int:id>', methods=['GET'])
@login_required
def get_entrevista(id):
    """
    Obtiene los detalles de una entrevista específica.
    Verifica que el usuario tenga permisos para acceder a través del recluta asociado.
    """
    try:
        entrevista = Entrevista.get_by_id(id)
        if not entrevista:
            return jsonify({"success": False, "message": "Entrevista no encontrada"}), 404
        
        # Verificar que el usuario tenga acceso al recluta asociado
        if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            recluta = Recluta.get_by_id(entrevista.recluta_id, current_user=current_user)
            if not recluta:
                return jsonify({"success": False, "message": "No tienes permisos para acceder a esta entrevista"}), 403
            
        return jsonify({
            "success": True,
            "entrevista": entrevista.serialize()
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener entrevista {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener entrevista: {str(e)}"}), 500

@api_bp.route('/entrevistas', methods=['POST'])
@login_required
def add_entrevista():
    """
    Programa una nueva entrevista.
    Verifica que el usuario tenga permisos para acceder al recluta asociado.
    """
    try:
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_entrevista_data(data)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400
        
        # Verificar que el usuario tenga acceso al recluta
        recluta_id = validated_data.get('recluta_id')
        if recluta_id:
            recluta = Recluta.get_by_id(recluta_id, current_user=current_user)
            if not recluta:
                return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos para acceder"}), 404
        
        # Convertir la fecha de string a objeto Date si es necesario
        if 'fecha' in validated_data and isinstance(validated_data['fecha'], str):
            validated_data['fecha'] = datetime.strptime(validated_data['fecha'], '%Y-%m-%d').date()
        
        # Crear nueva entrevista
        nueva = Entrevista(**validated_data)
        
        # Guardar en base de datos
        try:
            nueva.save()
            current_app.logger.info(f"Entrevista creada: {nueva.id} - Recluta: {nueva.recluta_id} - Fecha: {nueva.fecha}")
            return jsonify({"success": True, "entrevista": nueva.serialize()}), 201
        except DatabaseError as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al crear entrevista: {str(e)}")
        return jsonify({"success": False, "message": f"Error al crear entrevista: {str(e)}"}), 500

@api_bp.route('/entrevistas/<int:id>', methods=['PUT'])
@login_required
def update_entrevista(id):
    """
    Actualiza una entrevista existente.
    Verifica que el usuario tenga permisos para acceder al recluta asociado.
    """
    try:
        entrevista = Entrevista.get_by_id(id)
        if not entrevista:
            return jsonify({"success": False, "message": "Entrevista no encontrada"}), 404
        
        # Verificar que el usuario tenga acceso al recluta asociado
        recluta = Recluta.get_by_id(entrevista.recluta_id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "No tienes permisos para actualizar esta entrevista"}), 403
        
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_entrevista_data(data, is_update=True)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400
        
        # Si se está cambiando el recluta_id, verificar también permisos para el nuevo recluta
        if 'recluta_id' in validated_data and validated_data['recluta_id'] != entrevista.recluta_id:
            nuevo_recluta = Recluta.get_by_id(validated_data['recluta_id'], current_user=current_user)
            if not nuevo_recluta:
                return jsonify({"success": False, "message": "No tienes permisos para asignar esta entrevista al recluta especificado"}), 403
        
        # Convertir la fecha de string a objeto Date si es necesario
        if 'fecha' in validated_data and isinstance(validated_data['fecha'], str):
            validated_data['fecha'] = datetime.strptime(validated_data['fecha'], '%Y-%m-%d').date()
        
        # Actualizar campos
        for key, value in validated_data.items():
            setattr(entrevista, key, value)
        
        # Guardar cambios
        try:
            entrevista.save()
            current_app.logger.info(f"Entrevista actualizada: {entrevista.id} - Fecha: {entrevista.fecha}")
            return jsonify({"success": True, "entrevista": entrevista.serialize()})
        except DatabaseError as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al actualizar entrevista {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error al actualizar entrevista: {str(e)}"}), 500

@api_bp.route('/entrevistas/<int:id>', methods=['DELETE'])
@login_required
def delete_entrevista(id):
    """
    Elimina una entrevista existente.
    Verifica que el usuario tenga permisos para acceder al recluta asociado.
    """
    try:
        entrevista = Entrevista.get_by_id(id)
        if not entrevista:
            return jsonify({"success": False, "message": "Entrevista no encontrada"}), 404
        
        # Verificar que el usuario tenga acceso al recluta asociado
        recluta = Recluta.get_by_id(entrevista.recluta_id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "No tienes permisos para eliminar esta entrevista"}), 403
        
        # Guardar información antes de eliminar para el log
        entrevista_info = f"ID: {entrevista.id}, Recluta: {entrevista.recluta_id}, Fecha: {entrevista.fecha}"
        
        # Eliminar entrevista
        try:
            entrevista.delete()
            current_app.logger.info(f"Entrevista eliminada: {entrevista_info}")
            return jsonify({"success": True, "message": "Entrevista eliminada correctamente"})
        except DatabaseError as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al eliminar entrevista {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error al eliminar entrevista: {str(e)}"}), 500

@api_bp.route('/documentos/<int:id>', methods=['DELETE'])
@login_required
def delete_documento(id):
    """
    Elimina un documento específico.
    Verifica que el usuario tenga permisos para acceder al documento a través del recluta asociado.
    """
    try:
        from models import Documento
        
        documento = Documento.query.get(id)
        if not documento:
            return jsonify({"success": False, "message": "Documento no encontrado"}), 404
        
        # Verificar que el usuario tenga acceso al recluta asociado al documento
        recluta = Recluta.get_by_id(documento.recluta_id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "No tienes permisos para eliminar este documento"}), 403
        
        # Eliminar archivo físico
        if documento.url:
            eliminar_archivo(documento.url)
        
        # Eliminar registro
        db.session.delete(documento)
        db.session.commit()
        
        return jsonify({"success": True, "message": "Documento eliminado correctamente"})
        
    except Exception as e:
        current_app.logger.error(f"Error al eliminar documento {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

# ----- API DE ESTADÍSTICAS -----

@api_bp.route('/estadisticas', methods=['GET'])
@login_required
def get_estadisticas():
    """
    📊 RUTA MEJORADA: Estadísticas adaptativas según rol de usuario
    
    - Administradores: Estadísticas globales completas + resumen de asesores
    - Asesores: Solo estadísticas de sus reclutas asignados
    """
    try:
        # Obtener filtros opcionales
        periodo = request.args.get('periodo', '30')  # días
        incluir_tendencias = request.args.get('tendencias', 'true').lower() == 'true'
        incluir_comparativas = request.args.get('comparativas', 'true').lower() == 'true'
        
        # Calcular rango de fechas
        fecha_fin = datetime.utcnow()
        try:
            dias = int(periodo)
            fecha_inicio = fecha_fin - timedelta(days=dias)
        except ValueError:
            dias = 30
            fecha_inicio = fecha_fin - timedelta(days=30)
        
        if current_user.rol == 'admin':
            # 👑 ESTADÍSTICAS PARA ADMINISTRADORES
            estadisticas = get_estadisticas_admin(fecha_inicio, fecha_fin, incluir_tendencias, incluir_comparativas)
        else:
            # 👥 ESTADÍSTICAS PARA ASESORES
            estadisticas = get_estadisticas_asesor(current_user.id, fecha_inicio, fecha_fin, incluir_tendencias)
        
        # Agregar metadatos
        estadisticas['metadata'] = {
            'periodo_dias': dias,
            'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d'),
            'fecha_fin': fecha_fin.strftime('%Y-%m-%d'),
            'usuario_rol': current_user.rol,
            'generado_en': datetime.utcnow().isoformat(),
            'incluye_tendencias': incluir_tendencias,
            'incluye_comparativas': incluir_comparativas
        }
        
        current_app.logger.info(f"📊 Estadísticas generadas para {current_user.email} (rol: {current_user.rol})")
        
        return jsonify({
            "success": True,
            "estadisticas": estadisticas
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al obtener estadísticas: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar estadísticas: {str(e)}"
        }), 500


def get_estadisticas_admin(fecha_inicio, fecha_fin, incluir_tendencias=True, incluir_comparativas=True):
    """
    👑 ESTADÍSTICAS COMPLETAS PARA ADMINISTRADORES
    """
    try:
        # 📊 ESTADÍSTICAS GLOBALES BÁSICAS
        query_base = Recluta.query.filter(
            Recluta.fecha_registro >= fecha_inicio,
            Recluta.fecha_registro <= fecha_fin
        )
        
        total_reclutas = query_base.count()
        reclutas_activos = query_base.filter_by(estado='Activo').count()
        reclutas_proceso = query_base.filter_by(estado='En proceso').count()
        reclutas_rechazados = query_base.filter_by(estado='Rechazado').count()
        
        # 📅 ENTREVISTAS EN EL PERÍODO
        entrevistas_pendientes = Entrevista.query.filter(
            Entrevista.fecha >= fecha_inicio.date(),
            Entrevista.fecha <= fecha_fin.date(),
            Entrevista.estado == 'pendiente'
        ).count()
        
        entrevistas_completadas = Entrevista.query.filter(
            Entrevista.fecha >= fecha_inicio.date(),
            Entrevista.fecha <= fecha_fin.date(),
            Entrevista.estado == 'completada'
        ).count()
        
        # 📈 MÉTRICAS CALCULADAS
        tasa_conversion = (reclutas_activos / total_reclutas * 100) if total_reclutas > 0 else 0
        tasa_rechazo = (reclutas_rechazados / total_reclutas * 100) if total_reclutas > 0 else 0
        
        # 👥 RESUMEN DE ASESORES (para vista rápida)
        resumen_asesores = db.session.query(
            Usuario.id,
            Usuario.nombre,
            Usuario.email,
            func.count(Recluta.id).label('total_reclutas'),
            func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('activos'),
            func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('proceso'),
            func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rechazados')
        ).outerjoin(
            Recluta, Usuario.id == Recluta.asesor_id
        ).filter(
            Usuario.rol.in_(['asesor', 'gerente']),
            Recluta.fecha_registro >= fecha_inicio,
            Recluta.fecha_registro <= fecha_fin
        ).group_by(
            Usuario.id, Usuario.nombre, Usuario.email
        ).all()
        
        # Procesar resumen de asesores
        asesores_resumen = []
        for asesor in resumen_asesores:
            total = asesor.total_reclutas or 0
            activos = asesor.activos or 0
            
            asesores_resumen.append({
                'id': asesor.id,
                'nombre': asesor.nombre or asesor.email,
                'total': total,
                'activos': activos,
                'proceso': asesor.proceso or 0,
                'rechazados': asesor.rechazados or 0,
                'tasa_exito': round(activos / total * 100, 1) if total > 0 else 0
            })
        
        # Ordenar por tasa de éxito
        asesores_resumen.sort(key=lambda x: x['tasa_exito'], reverse=True)
        
        estadisticas = {
            'globales': {
                'total_reclutas': total_reclutas,
                'reclutas_activos': reclutas_activos,
                'reclutas_proceso': reclutas_proceso,
                'reclutas_rechazados': reclutas_rechazados,
                'entrevistas_pendientes': entrevistas_pendientes,
                'entrevistas_completadas': entrevistas_completadas,
                'tasa_conversion': round(tasa_conversion, 1),
                'tasa_rechazo': round(tasa_rechazo, 1)
            },
            'asesores_resumen': asesores_resumen[:10],  # Top 10
            'total_asesores': len(asesores_resumen)
        }
        
        # 📈 TENDENCIAS TEMPORALES (opcional)
        if incluir_tendencias:
            estadisticas['tendencias'] = get_tendencias_temporales(fecha_inicio, fecha_fin)
        
        # 📊 COMPARATIVAS MENSUALES (opcional)
        if incluir_comparativas:
            estadisticas['comparativas'] = get_comparativas_mensuales()
        
        return estadisticas
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en estadísticas admin: {str(e)}")
        raise


def get_estadisticas_asesor(asesor_id, fecha_inicio, fecha_fin, incluir_tendencias=True):
    """
    👥 ESTADÍSTICAS PERSONALIZADAS PARA ASESORES
    """
    try:
        # 📊 ESTADÍSTICAS ESPECÍFICAS DEL ASESOR
        query_base = Recluta.query.filter(
            Recluta.asesor_id == asesor_id,
            Recluta.fecha_registro >= fecha_inicio,
            Recluta.fecha_registro <= fecha_fin
        )
        
        total_reclutas = query_base.count()
        reclutas_activos = query_base.filter_by(estado='Activo').count()
        reclutas_proceso = query_base.filter_by(estado='En proceso').count()
        reclutas_rechazados = query_base.filter_by(estado='Rechazado').count()
        
        # 📅 ENTREVISTAS DEL ASESOR
        mis_entrevistas = db.session.query(Entrevista).join(
            Recluta, Entrevista.recluta_id == Recluta.id
        ).filter(
            Recluta.asesor_id == asesor_id,
            Entrevista.fecha >= fecha_inicio.date(),
            Entrevista.fecha <= fecha_fin.date()
        )
        
        entrevistas_pendientes = mis_entrevistas.filter_by(estado='pendiente').count()
        entrevistas_completadas = mis_entrevistas.filter_by(estado='completada').count()
        
        # 📈 MÉTRICAS PERSONALES
        tasa_conversion = (reclutas_activos / total_reclutas * 100) if total_reclutas > 0 else 0
        productividad = total_reclutas / ((fecha_fin - fecha_inicio).days or 1)
        
        # 🎯 OBJETIVOS Y METAS (simulados - podrían venir de configuración)
        meta_mensual = 50  # Meta de reclutas por mes
        dias_transcurridos = (fecha_fin - fecha_inicio).days
        meta_periodo = (meta_mensual * dias_transcurridos) / 30
        progreso_meta = (total_reclutas / meta_periodo * 100) if meta_periodo > 0 else 0
        
        estadisticas = {
            'personales': {
                'total_reclutas': total_reclutas,
                'reclutas_activos': reclutas_activos,
                'reclutas_proceso': reclutas_proceso,
                'reclutas_rechazados': reclutas_rechazados,
                'entrevistas_pendientes': entrevistas_pendientes,
                'entrevistas_completadas': entrevistas_completadas,
                'tasa_conversion': round(tasa_conversion, 1),
                'productividad_diaria': round(productividad, 2),
                'progreso_meta': round(min(progreso_meta, 100), 1),
                'meta_periodo': round(meta_periodo, 0)
            }
        }
        
        # 📈 TENDENCIAS PERSONALES (opcional)
        if incluir_tendencias:
            estadisticas['tendencias_personales'] = get_tendencias_asesor(asesor_id, fecha_inicio, fecha_fin)
        
        # 📊 COMPARACIÓN CON PROMEDIO GENERAL (sin revelar datos de otros asesores)
        promedio_sistema = get_promedio_sistema_anonimo()
        estadisticas['comparacion_anonima'] = {
            'mi_tasa_conversion': round(tasa_conversion, 1),
            'promedio_sistema': promedio_sistema,
            'por_encima_promedio': tasa_conversion > promedio_sistema,
            'diferencia': round(tasa_conversion - promedio_sistema, 1)
        }
        
        return estadisticas
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en estadísticas asesor {asesor_id}: {str(e)}")
        raise


def get_tendencias_temporales(fecha_inicio, fecha_fin, granularidad='diaria'):
    """
    📈 GENERAR TENDENCIAS TEMPORALES
    """
    try:
        tendencias = []
        
        if granularidad == 'diaria':
            # Tendencias diarias
            current_date = fecha_inicio.date()
            while current_date <= fecha_fin.date():
                next_date = current_date + timedelta(days=1)
                
                reclutas_dia = Recluta.query.filter(
                    Recluta.fecha_registro >= current_date,
                    Recluta.fecha_registro < next_date
                ).count()
                
                tendencias.append({
                    'fecha': current_date.strftime('%Y-%m-%d'),
                    'reclutas': reclutas_dia,
                    'fecha_formatted': current_date.strftime('%d/%m')
                })
                
                current_date = next_date
                
        elif granularidad == 'semanal':
            # Tendencias semanales
            current_date = fecha_inicio.date()
            while current_date <= fecha_fin.date():
                week_end = min(current_date + timedelta(days=6), fecha_fin.date())
                
                reclutas_semana = Recluta.query.filter(
                    Recluta.fecha_registro >= current_date,
                    Recluta.fecha_registro <= week_end
                ).count()
                
                tendencias.append({
                    'periodo': f"{current_date.strftime('%d/%m')} - {week_end.strftime('%d/%m')}",
                    'reclutas': reclutas_semana,
                    'fecha_inicio': current_date.strftime('%Y-%m-%d'),
                    'fecha_fin': week_end.strftime('%Y-%m-%d')
                })
                
                current_date = week_end + timedelta(days=1)
        
        return tendencias
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en tendencias temporales: {str(e)}")
        return []


def get_comparativas_mensuales():
    """
    📊 COMPARATIVAS DE LOS ÚLTIMOS MESES
    """
    try:
        comparativas = []
        
        # Últimos 6 meses
        for i in range(6):
            # Calcular mes
            fecha_ref = datetime.utcnow() - timedelta(days=i*30)
            mes_inicio = fecha_ref.replace(day=1)
            
            # Último día del mes
            if mes_inicio.month == 12:
                mes_fin = mes_inicio.replace(year=mes_inicio.year + 1, month=1) - timedelta(days=1)
            else:
                mes_fin = mes_inicio.replace(month=mes_inicio.month + 1) - timedelta(days=1)
            
            # Consultar datos del mes
            reclutas_mes = Recluta.query.filter(
                Recluta.fecha_registro >= mes_inicio,
                Recluta.fecha_registro <= mes_fin
            ).count()
            
            activos_mes = Recluta.query.filter(
                Recluta.fecha_registro >= mes_inicio,
                Recluta.fecha_registro <= mes_fin,
                Recluta.estado == 'Activo'
            ).count()
            
            nombre_mes = calendar.month_name[mes_inicio.month]
            
            comparativas.append({
                'mes': f"{nombre_mes} {mes_inicio.year}",
                'mes_corto': mes_inicio.strftime('%m/%Y'),
                'total_reclutas': reclutas_mes,
                'reclutas_activos': activos_mes,
                'tasa_conversion': round(activos_mes / reclutas_mes * 100, 1) if reclutas_mes > 0 else 0
            })
        
        # Ordenar cronológicamente (más reciente primero)
        comparativas.reverse()
        
        return comparativas
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en comparativas mensuales: {str(e)}")
        return []


def get_tendencias_asesor(asesor_id, fecha_inicio, fecha_fin):
    """
    📈 TENDENCIAS ESPECÍFICAS PARA UN ASESOR
    """
    try:
        tendencias = []
        
        # Tendencias semanales del asesor
        current_date = fecha_inicio.date()
        semana = 1
        
        while current_date <= fecha_fin.date():
            week_end = min(current_date + timedelta(days=6), fecha_fin.date())
            
            reclutas_semana = Recluta.query.filter(
                Recluta.asesor_id == asesor_id,
                Recluta.fecha_registro >= current_date,
                Recluta.fecha_registro <= week_end
            ).count()
            
            activos_semana = Recluta.query.filter(
                Recluta.asesor_id == asesor_id,
                Recluta.fecha_registro >= current_date,
                Recluta.fecha_registro <= week_end,
                Recluta.estado == 'Activo'
            ).count()
            
            tendencias.append({
                'semana': semana,
                'periodo': f"Semana {semana}",
                'fecha_inicio': current_date.strftime('%d/%m'),
                'fecha_fin': week_end.strftime('%d/%m'),
                'total_reclutas': reclutas_semana,
                'reclutas_activos': activos_semana,
                'tasa_conversion': round(activos_semana / reclutas_semana * 100, 1) if reclutas_semana > 0 else 0
            })
            
            current_date = week_end + timedelta(days=1)
            semana += 1
        
        return tendencias
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en tendencias de asesor {asesor_id}: {str(e)}")
        return []


def get_promedio_sistema_anonimo():
    """
    📊 OBTENER PROMEDIO GENERAL DEL SISTEMA (sin revelar datos específicos)
    """
    try:
        # Calcular promedio de tasa de conversión del sistema
        total_reclutas = Recluta.query.count()
        total_activos = Recluta.query.filter_by(estado='Activo').count()
        
        promedio = (total_activos / total_reclutas * 100) if total_reclutas > 0 else 0
        
        return round(promedio, 1)
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en promedio sistema: {str(e)}")
        return 0.0

# ============================================================================
# Estadísticas en tiempo real (WebSocket-style con polling)
# ============================================================================

@api_bp.route('/estadisticas/tiempo-real', methods=['GET'])
@login_required
def get_estadisticas_tiempo_real():
    """
    ⏱️ ESTADÍSTICAS EN TIEMPO REAL
    Versión ligera para actualizaciones frecuentes
    """
    try:
        if current_user.rol == 'admin':
            # Estadísticas globales básicas
            estadisticas = {
                'timestamp': datetime.utcnow().isoformat(),
                'total_reclutas': Recluta.query.count(),
                'reclutas_activos': Recluta.query.filter_by(estado='Activo').count(),
                'reclutas_proceso': Recluta.query.filter_by(estado='En proceso').count(),
                'entrevistas_hoy': Entrevista.query.filter(
                    Entrevista.fecha == datetime.utcnow().date(),
                    Entrevista.estado == 'pendiente'
                ).count(),
                'nuevos_hoy': Recluta.query.filter(
                    func.date(Recluta.fecha_registro) == datetime.utcnow().date()
                ).count()
            }
        else:
            # Estadísticas del asesor
            estadisticas = {
                'timestamp': datetime.utcnow().isoformat(),
                'mis_reclutas': Recluta.query.filter_by(asesor_id=current_user.id).count(),
                'mis_activos': Recluta.query.filter_by(
                    asesor_id=current_user.id, 
                    estado='Activo'
                ).count(),
                'mis_entrevistas_hoy': db.session.query(Entrevista).join(
                    Recluta, Entrevista.recluta_id == Recluta.id
                ).filter(
                    Recluta.asesor_id == current_user.id,
                    Entrevista.fecha == datetime.utcnow().date(),
                    Entrevista.estado == 'pendiente'
                ).count()
            }
        
        return jsonify({
            "success": True,
            "estadisticas_tiempo_real": estadisticas
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en estadísticas tiempo real: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error en estadísticas tiempo real: {str(e)}"
        }), 500

# ============================================================================
# Rankings y competencias (solo admin)
# ============================================================================

@api_bp.route('/estadisticas/rankings', methods=['GET'])
@login_required
def get_rankings():
    """
    🏆 RANKINGS DE ASESORES (solo para administradores)
    """
    if current_user.rol != 'admin':
        return jsonify({
            "success": False,
            "message": "Solo administradores pueden acceder a rankings"
        }), 403
    
    try:
        periodo = request.args.get('periodo', '30')
        tipo_ranking = request.args.get('tipo', 'conversion')  # conversion, productividad, calidad
        
        # Calcular fechas
        dias = int(periodo) if periodo.isdigit() else 30
        fecha_inicio = datetime.utcnow() - timedelta(days=dias)
        
        # Query base para rankings
        rankings_query = db.session.query(
            Usuario.id,
            Usuario.nombre,
            Usuario.email,
            func.count(Recluta.id).label('total_reclutas'),
            func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('activos'),
            func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('proceso'),
            func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rechazados')
        ).outerjoin(
            Recluta, Usuario.id == Recluta.asesor_id
        ).filter(
            Usuario.rol.in_(['asesor', 'gerente']),
            Recluta.fecha_registro >= fecha_inicio
        ).group_by(
            Usuario.id, Usuario.nombre, Usuario.email
        ).having(
            func.count(Recluta.id) > 0  # Solo asesores con reclutas
        )
        
        rankings_data = rankings_query.all()
        
        # Procesar rankings según tipo
        rankings = []
        for asesor in rankings_data:
            total = asesor.total_reclutas or 0
            activos = asesor.activos or 0
            
            if tipo_ranking == 'conversion':
                score = (activos / total * 100) if total > 0 else 0
                ranking_label = "Tasa de Conversión"
                ranking_unit = "%"
            elif tipo_ranking == 'productividad':
                score = total / dias  # Reclutas por día
                ranking_label = "Productividad"
                ranking_unit = " reclutas/día"
            else:  # calidad (basado en ratio de activos)
                score = activos
                ranking_label = "Total de Activos"
                ranking_unit = " activos"
            
            rankings.append({
                'asesor_id': asesor.id,
                'nombre': asesor.nombre or asesor.email,
                'email': asesor.email,
                'score': round(score, 2),
                'total_reclutas': total,
                'activos': activos,
                'proceso': asesor.proceso or 0,
                'rechazados': asesor.rechazados or 0
            })
        
        # Ordenar por score
        rankings.sort(key=lambda x: x['score'], reverse=True)
        
        # Agregar posiciones
        for i, ranking in enumerate(rankings):
            ranking['posicion'] = i + 1
            
            # Agregar badges
            if i == 0:
                ranking['badge'] = 'oro'
            elif i == 1:
                ranking['badge'] = 'plata'
            elif i == 2:
                ranking['badge'] = 'bronce'
            else:
                ranking['badge'] = None
        
        return jsonify({
            "success": True,
            "rankings": {
                "tipo": tipo_ranking,
                "label": ranking_label,
                "unit": ranking_unit,
                "periodo_dias": dias,
                "total_participantes": len(rankings),
                "datos": rankings
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error en rankings: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar rankings: {str(e)}"
        }), 500

# ----- API DE SEGUIMIENTO DE FOLIOS -----

@api_bp.route('/tracking/<folio>', methods=['GET'])
def track_by_folio(folio):
    """
    Obtiene información básica y estado de un recluta por su folio.
    No requiere autenticación, pues es accesible públicamente.
    """
    try:
        recluta = Recluta.query.filter_by(folio=folio).first()
        
        if not recluta:
            return jsonify({"success": False, "message": "Folio no encontrado"}), 404
        
        # Devolver solo información limitada por seguridad
        tracking_info = {
            "nombre": recluta.nombre,
            "estado": recluta.estado,
            "fecha_registro": recluta.fecha_registro.strftime('%d/%m/%Y') if recluta.fecha_registro else None,
            "ultima_actualizacion": recluta.ultima_actualizacion.strftime('%d/%m/%Y') if recluta.ultima_actualizacion else None
        }
        
        # Obtener entrevistas próximas
        entrevistas = Entrevista.query.filter_by(
            recluta_id=recluta.id, 
            estado='pendiente'
        ).order_by(Entrevista.fecha).all()
        
        if entrevistas:
            tracking_info["proxima_entrevista"] = {
                "fecha": entrevistas[0].fecha.strftime('%d/%m/%Y'),
                "hora": entrevistas[0].hora,
                "tipo": entrevistas[0].tipo
            }
        
        return jsonify({"success": True, "tracking_info": tracking_info})
    except Exception as e:
        current_app.logger.error(f"Error al buscar por folio: {str(e)}")
        return jsonify({"success": False, "message": "Error al procesar la solicitud"}), 500

@api_bp.route('/tracking/<folio>/timeline', methods=['GET'])
def get_timeline_folio(folio):
    """
    Obtiene la información completa de la timeline para un recluta.
    Incluye todos los estados y fechas de cambio de estado.
    """
    try:
        recluta = Recluta.query.filter_by(folio=folio).first()
        
        if not recluta:
            return jsonify({"success": False, "message": "Folio no encontrado"}), 404
        
        # Mapear estado del sistema a estado de la timeline
        estados_timeline = {
            'En proceso': 'revision',
            'Activo': 'finalizada',
            'Rechazado': 'finalizada'
        }
        
        estado_timeline = estados_timeline.get(recluta.estado, 'recibida')
        
        # Definir la estructura completa de la timeline
        timeline_items = [
            {
                "id": "recibida",
                "title": "Recibida",
                "description": "Documentación recibida y registrada en el sistema.",
                "completed": True,
                "active": estado_timeline == 'recibida',
                "date": recluta.fecha_registro.strftime('%d/%m/%Y') if recluta.fecha_registro else None
            },
            {
                "id": "revision",
                "title": "En revisión",
                "description": "Evaluación inicial de requisitos y perfil.",
                "completed": estado_timeline in ['revision', 'entrevista', 'evaluacion', 'finalizada'],
                "active": estado_timeline == 'revision',
                "date": recluta.ultima_actualizacion.strftime('%d/%m/%Y') if recluta.ultima_actualizacion and estado_timeline != 'recibida' else None
            },
            {
                "id": "entrevista",
                "title": "Entrevista",
                "description": "Programación y realización de entrevistas.",
                "completed": estado_timeline in ['entrevista', 'evaluacion', 'finalizada'],
                "active": estado_timeline == 'entrevista',
                "date": None
            },
            {
                "id": "evaluacion",
                "title": "Evaluación",
                "description": "Análisis de resultados y toma de decisiones.",
                "completed": estado_timeline in ['evaluacion', 'finalizada'],
                "active": estado_timeline == 'evaluacion',
                "date": None
            },
            {
                "id": "finalizada",
                "title": "Finalizada",
                "description": "Proceso completado con decisión final.",
                "completed": estado_timeline == 'finalizada',
                "active": estado_timeline == 'finalizada',
                "date": None
            }
        ]
        
        # Obtener fechas de entrevistas si existen
        entrevistas = Entrevista.query.filter_by(recluta_id=recluta.id).order_by(Entrevista.fecha).all()
        
        for entrevista in entrevistas:
            # Si hay entrevista y está en estado completada, actualizar la fecha del ítem de entrevista
            if entrevista.estado == 'completada':
                for item in timeline_items:
                    if item["id"] == "entrevista":
                        item["date"] = entrevista.fecha.strftime('%d/%m/%Y')
                        break
        
        # Verificar si el estado es "finalizada" y actualizar la fecha correspondiente
        if estado_timeline == 'finalizada':
            for item in timeline_items:
                if item["id"] == "finalizada":
                    item["date"] = recluta.ultima_actualizacion.strftime('%d/%m/%Y') if recluta.ultima_actualizacion else None
        
        return jsonify({
            "success": True,
            "folio": folio,
            "nombre_candidato": recluta.nombre,
            "estado_actual": recluta.estado,
            "estado_timeline": estado_timeline,
            "timeline_items": timeline_items
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener timeline del folio: {str(e)}")
        return jsonify({"success": False, "message": "Error al procesar la solicitud"}), 500

@api_bp.route('/verificar-folio/<folio>', methods=['GET'])
def verificar_folio(folio):
    """
    Verifica si un folio existe en el sistema.
    Útil para validaciones rápidas sin devolver datos sensibles.
    """
    try:
        recluta = Recluta.query.filter_by(folio=folio).first()
        
        if not recluta:
            return jsonify({"success": False, "exists": False, "message": "Folio no encontrado"}), 404
        
        return jsonify({
            "success": True,
            "exists": True,
            "message": "Folio válido"
        })
    except Exception as e:
        current_app.logger.error(f"Error al verificar folio: {str(e)}")
        return jsonify({"success": False, "message": "Error al procesar la solicitud"}), 500

# ----- API DE PERFIL -----

@api_bp.route('/perfil', methods=['GET'])
@login_required
def get_perfil():
    """
    Obtiene el perfil del usuario actual.
    """
    try:
        return jsonify({
            "success": True,
            "usuario": current_user.serialize()
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener perfil: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener perfil: {str(e)}"}), 500

@api_bp.route('/perfil', methods=['PUT'])
@login_required
def update_perfil():
    """
    Actualiza el perfil del usuario actual.
    """
    try:
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Validar campos básicos
        usuario = current_user
        
        # Actualizar campos
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        
        if 'telefono' in data:
            usuario.telefono = data['telefono']
        
        # Procesar foto si existe
        if 'foto' in request.files:
            archivo = request.files['foto']
            if archivo and archivo.filename:
                # Eliminar foto anterior si existe
                if usuario.foto_url:
                    eliminar_archivo(usuario.foto_url)
                    
                ruta_relativa = guardar_archivo(archivo, 'usuario')
                if ruta_relativa:
                    usuario.foto_url = ruta_relativa
        
        # Guardar cambios
        try:
            usuario.save()
            current_app.logger.info(f"Perfil actualizado: {usuario.id} - {usuario.email}")
            return jsonify({
                "success": True,
                "usuario": usuario.serialize()
            })
        except DatabaseError as e:
            return jsonify({"success": False, "message": str(e)}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al actualizar perfil: {str(e)}")
        return jsonify({"success": False, "message": f"Error al actualizar perfil: {str(e)}"}), 500

@api_bp.route('/reclutas/<int:id>/documentos', methods=['GET'])
@login_required
def get_documentos_recluta(id):
    """
    Obtiene los documentos de un recluta específico.
    Verifica que el usuario tenga permisos para acceder al recluta.
    """
    try:
        # Verificar que el usuario tenga acceso al recluta
        recluta = Recluta.get_by_id(id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos para acceder"}), 404
            
        from models import Documento
        documentos = Documento.query.filter_by(recluta_id=id).all()
        
        return jsonify({
            "success": True,
            "documentos": [d.serialize() for d in documentos]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener documentos del recluta {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@api_bp.route('/usuario', methods=['GET'])
@login_required
def get_usuario_actual():
    """
    Obtiene información del usuario autenticado actualmente.
    """
    try:
        return jsonify(current_user.serialize())
    except Exception as e:
        current_app.logger.error(f"Error al obtener usuario actual: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@api_bp.route('/check-auth', methods=['GET'])
def check_auth():
    """
    Verifica si hay un usuario autenticado actualmente.
    """
    try:
        if current_user.is_authenticated:
            return jsonify({
                "authenticated": True,
                "usuario": current_user.serialize()
            })
        else:
            return jsonify({
                "authenticated": False
            })
    except Exception as e:
        current_app.logger.error(f"Error al verificar autenticación: {str(e)}")
        return jsonify({"authenticated": False, "error": str(e)}), 500
    
@api_bp.route('/check-auth', methods=['GET'])
def check_auth_api():
    """
    Endpoint alternativo para verificar autenticación desde la API.
    """
    try:
        from flask_login import current_user

        if current_user and current_user.is_authenticated:
            user_data = current_user.serialize()
            if not user_data.get('rol'):
                user_data['rol'] = 'admin'

            return jsonify({
                "authenticated": True,
                "usuario": user_data
            })
        else:
            return jsonify({
                "authenticated": False
            }), 401

    except Exception as e:
        current_app.logger.error(f"Error al verificar autenticación en API: {str(e)}")
        return jsonify({
            "authenticated": False, 
            "error": str(e)
        }), 500

@api_bp.route('/reclutas/<int:id>/documentos', methods=['POST'])
@login_required
def upload_documento_recluta(id):
    """
    Sube un documento PDF para un recluta específico.
    Verifica que el usuario tenga permisos para acceder al recluta.
    """
    try:
        # Verificar que el usuario tenga acceso al recluta
        recluta = Recluta.get_by_id(id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos para acceder"}), 404
            
        from models import Documento
        
        if 'documento' not in request.files:
            return jsonify({"success": False, "message": "No se encontró el archivo"}), 400
        
        archivo = request.files['documento']
        if archivo.filename == '':
            return jsonify({"success": False, "message": "No se seleccionó ningún archivo"}), 400
        
        # Validar que sea PDF
        if not archivo.filename.lower().endswith('.pdf'):
            return jsonify({"success": False, "message": "Solo se permiten archivos PDF"}), 400
        
        # Guardar archivo
        ruta_relativa = guardar_archivo(archivo, f'reclutas/{id}/documentos', tipos_permitidos=['pdf'])
        
        if ruta_relativa:
            # Crear registro en base de datos
            nuevo_documento = Documento(
                recluta_id=id,
                nombre=secure_filename(archivo.filename),
                url=ruta_relativa,
                tipo='pdf',
                tamaño=archivo.content_length
            )
            
            db.session.add(nuevo_documento)
            db.session.commit()
            
            return jsonify({
                "success": True,
                "documento": nuevo_documento.serialize()
            }), 201
        else:
            return jsonify({"success": False, "message": "Error al guardar el archivo"}), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al subir documento: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@api_bp.route('/recuperar-folio', methods=['POST'])
def recuperar_folio():
    """
    Recupera el folio de un recluta mediante su email y teléfono.
    Esta ruta es pública y no requiere autenticación.
    
    Returns:
        JSON con el folio si se encuentra, o un mensaje de error
    """
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data or 'email' not in data or 'telefono' not in data:
            return jsonify({
                "success": False,
                "message": "Se requiere email y teléfono para recuperar el folio"
            }), 400
        
        email = data.get('email', '').strip().lower()
        telefono = data.get('telefono', '').strip()
        
        # Validar formato básico de email
        import re
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({
                "success": False, 
                "message": "Formato de email inválido"
            }), 400
        
        # Buscar recluta por email y teléfono
        recluta = Recluta.query.filter_by(email=email, telefono=telefono).first()
        
        if not recluta:
            # No revelar si el email existe o no por seguridad, mensaje genérico
            return jsonify({
                "success": False,
                "message": "No se encontró ningún recluta con esos datos"
            }), 404
        
        # Recluta encontrado, devolver folio
        return jsonify({
            "success": True,
            "message": "Folio recuperado correctamente",
            "folio": recluta.folio,
            "nombre": recluta.nombre,
            "fecha_registro": recluta.fecha_registro.strftime('%d/%m/%Y') if recluta.fecha_registro else None
        })
            
    except Exception as e:
        current_app.logger.error(f"Error al recuperar folio: {str(e)}")
        return jsonify({
            "success": False, 
            "message": "Error al procesar la solicitud. Inténtelo más tarde."
        }), 500

@api_bp.route('/reclutas/distribuir-excel', methods=['POST'])
@admin_required
def distribuir_reclutas_excel():
    """
    Distribuye reclutas desde Excel automáticamente entre asesores activos.
    Solo disponible para administradores.
    """
    try:
        # Verificar que se subió un archivo
        if 'excel_file' not in request.files:
            return jsonify({"success": False, "message": "No se encontró archivo Excel"}), 400
        
        archivo = request.files['excel_file']
        if archivo.filename == '':
            return jsonify({"success": False, "message": "No se seleccionó archivo"}), 400
        
        # Validar extensión
        if not archivo.filename.lower().endswith(('.xlsx', '.xls')):
            return jsonify({"success": False, "message": "Solo se permiten archivos Excel (.xlsx, .xls)"}), 400
        
        # Obtener asesores activos
        asesores = Usuario.query.filter(
            Usuario.is_active == True,
            Usuario.rol.in_(['asesor', 'gerente'])
        ).all()
        
        if not asesores:
            return jsonify({
                "success": False, 
                "message": "No hay asesores activos para asignar reclutas"
            }), 400
        
        # Procesar Excel y distribuir
        from utils.helpers import procesar_y_distribuir_excel
        resultado = procesar_y_distribuir_excel(archivo, asesores)
        
        if resultado['success']:
            current_app.logger.info(f"Distribución Excel exitosa: {resultado['total_procesados']} reclutas")
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 400
            
    except Exception as e:
        current_app.logger.error(f"Error en distribución Excel: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Error al procesar distribución: {str(e)}"
        }), 500


