from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, DatabaseError
from models.recluta import Recluta
from models.usuario import Usuario
from models.entrevista import Entrevista  # Importación específica desde el módulo
from utils.helpers import guardar_archivo, eliminar_archivo
from utils.validators import validate_recluta_data, validate_entrevista_data, ValidationError
from datetime import datetime
import os

api_bp = Blueprint('api', __name__)

# ----- API DE RECLUTAS -----

@api_bp.route('/asesores', methods=['GET'])
@login_required
def get_asesores():
    """
    Obtiene la lista de usuarios que pueden ser asesores.
    """
    try:
        asesores = Usuario.query.filter_by(is_active=True).all()
        
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
        # Parámetros existentes...
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', current_app.config['DEFAULT_PAGE_SIZE'], type=int)
        search = request.args.get('search', '')
        estado = request.args.get('estado', '')
        sort_by = request.args.get('sort_by', 'id')
        sort_order = request.args.get('sort_order', 'asc')
        
        per_page = min(per_page, current_app.config['MAX_PAGE_SIZE'])
        
        # AGREGAR FILTRADO POR ROL
        if hasattr(current_user, 'rol') and current_user.rol == 'asesor':
            pagination = Recluta.get_all(
                page=page, per_page=per_page, search=search, estado=estado,
                sort_by=sort_by, sort_order=sort_order, current_user=current_user
            )
        else:
            pagination = Recluta.get_all(
                page=page, per_page=per_page, search=search, estado=estado,
                sort_by=sort_by, sort_order=sort_order
            )
        
        return jsonify({
            "success": True,
            "reclutas": [r.serialize() for r in pagination.items],
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page,
            "per_page": per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
            "user_role": getattr(current_user, 'rol', 'user')  # AGREGAR ROL
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

# BUSCAR en routes/api.py la función get_usuario_rol
# REEMPLAZAR completamente con:

@api_bp.route('/usuario/rol', methods=['GET'])
@login_required
def get_usuario_rol():
    """
    Obtiene información del rol del usuario autenticado.
    """
    try:
        # Obtener el rol del usuario actual
        rol = getattr(current_user, 'rol', 'admin')
        
        # Si no tiene rol definido, asignar admin por defecto
        if not rol:
            rol = 'admin'
            current_user.rol = rol
            db.session.commit()
            current_app.logger.info(f"Asignado rol por defecto 'admin' al usuario {current_user.email}")
        
        # Definir permisos según el rol
        permisos = {
            'admin': {
                "is_admin": True,
                "is_asesor": False,
                "can_assign_asesores": True,
                "can_see_all_reclutas": True,
                "can_upload_excel": True,
                "can_manage_users": True
            },
            'asesor': {
                "is_admin": False,
                "is_asesor": True,
                "can_assign_asesores": False,
                "can_see_all_reclutas": False,
                "can_upload_excel": False,
                "can_manage_users": False
            },
            'user': {
                "is_admin": False,
                "is_asesor": False,
                "can_assign_asesores": False,
                "can_see_all_reclutas": False,
                "can_upload_excel": False,
                "can_manage_users": False
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
    Obtiene estadísticas generales del sistema.
    """
    try:
        # Contar reclutas por estado
        total_reclutas = Recluta.query.count()
        reclutas_activos = Recluta.query.filter_by(estado='Activo').count()
        reclutas_proceso = Recluta.query.filter_by(estado='En proceso').count()
        reclutas_rechazados = Recluta.query.filter_by(estado='Rechazado').count()
        
        # Contar entrevistas por estado
        entrevistas_pendientes = Entrevista.query.filter_by(estado='pendiente').count()
        entrevistas_completadas = Entrevista.query.filter_by(estado='completada').count()
        entrevistas_canceladas = Entrevista.query.filter_by(estado='cancelada').count()
        
        # Obtener entrevistas próximas
        entrevistas_proximas = Entrevista.get_upcoming(limit=5)
        
        # Obtener distribución de entrevistas por mes para el año actual
        year = datetime.now().year
        entrevistas_por_mes = Entrevista.count_by_month(year)
        
        return jsonify({
            "success": True,
            "reclutas": {
                "total": total_reclutas,
                "activos": reclutas_activos,
                "en_proceso": reclutas_proceso,
                "rechazados": reclutas_rechazados
            },
            "entrevistas": {
                "pendientes": entrevistas_pendientes,
                "completadas": entrevistas_completadas,
                "canceladas": entrevistas_canceladas,
                "proximas": [e.serialize() for e in entrevistas_proximas],
                "por_mes": entrevistas_por_mes
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener estadísticas: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener estadísticas: {str(e)}"}), 500

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

# ✅ NUEVA RUTA: Importación masiva de reclutas desde Excel
@api_bp.route('/reclutas/import-excel', methods=['POST'])
@login_required
def import_reclutas_excel():
    """
    Importa reclutas masivamente desde un archivo Excel.
    Solo disponible para administradores.
    """
    try:
        # Verificar que el usuario sea administrador
        if hasattr(current_user, 'rol') and current_user.rol != 'admin':
            return jsonify({
                "success": False,
                "message": "Solo los administradores pueden importar reclutas desde Excel"
            }), 403
        
        # Verificar que se haya enviado un archivo
        if 'excel_file' not in request.files:
            return jsonify({
                "success": False,
                "message": "No se encontró el archivo Excel"
            }), 400
        
        file = request.files['excel_file']
        if file.filename == '':
            return jsonify({
                "success": False,
                "message": "No se seleccionó ningún archivo"
            }), 400
        
        # Validar extensión del archivo
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            return jsonify({
                "success": False,
                "message": "Solo se permiten archivos Excel (.xlsx, .xls)"
            }), 400
        
        # Procesar el archivo Excel
        results = process_excel_file(file)
        
        current_app.logger.info(f"Importación Excel completada: {results['imported']} reclutas importados, {results['errors']} errores")
        
        return jsonify({
            "success": True,
            "message": "Importación completada",
            "processed": results['processed'],
            "imported": results['imported'],
            "skipped": results['skipped'],
            "errors": results['errors'],
            "error_details": results['error_details']
        })
        
    except Exception as e:
        current_app.logger.error(f"Error en importación Excel: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al procesar el archivo Excel: {str(e)}"
        }), 500

def process_excel_file(file):
    """
    Procesa el archivo Excel y extrae los datos de reclutas.
    
    Args:
        file: Archivo Excel subido
        
    Returns:
        dict: Resultados del procesamiento
    """
    try:
        import pandas as pd
        from io import BytesIO
        
        # Leer el archivo Excel
        file_content = BytesIO(file.read())
        
        # Intentar leer con pandas
        try:
            df = pd.read_excel(file_content, engine='openpyxl')
        except:
            # Si falla openpyxl, intentar con xlrd para archivos .xls
            file_content.seek(0)
            df = pd.read_excel(file_content, engine='xlrd')
        
        # Normalizar nombres de columnas (minúsculas y sin espacios)
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # Verificar columnas requeridas
        required_columns = ['nombre', 'email', 'telefono']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Faltan las siguientes columnas requeridas: {', '.join(missing_columns)}")
        
        # Eliminar filas completamente vacías
        df = df.dropna(how='all')
        
        # Procesar cada fila
        results = {
            'processed': len(df),
            'imported': 0,
            'skipped': 0,
            'errors': 0,
            'error_details': []
        }
        
        for index, row in df.iterrows():
            try:
                # Extraer datos básicos
                recluta_data = {
                    'nombre': str(row['nombre']).strip() if pd.notna(row['nombre']) else '',
                    'email': str(row['email']).strip().lower() if pd.notna(row['email']) else '',
                    'telefono': str(row['telefono']).strip() if pd.notna(row['telefono']) else '',
                    'puesto': str(row.get('puesto', '')).strip() if pd.notna(row.get('puesto')) else '',
                    'estado': str(row.get('estado', 'En proceso')).strip() if pd.notna(row.get('estado')) else 'En proceso',
                    'notas': str(row.get('notas', '')).strip() if pd.notna(row.get('notas')) else ''
                }
                
                # Validaciones básicas
                if not recluta_data['nombre']:
                    results['error_details'].append(f"Fila {index + 2}: Nombre es requerido")
                    results['errors'] += 1
                    continue
                
                if not recluta_data['email']:
                    results['error_details'].append(f"Fila {index + 2}: Email es requerido")
                    results['errors'] += 1
                    continue
                
                if not recluta_data['telefono']:
                    results['error_details'].append(f"Fila {index + 2}: Teléfono es requerido")
                    results['errors'] += 1
                    continue
                
                # Validar formato de email
                import re
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if not re.match(email_pattern, recluta_data['email']):
                    results['error_details'].append(f"Fila {index + 2}: Email inválido ({recluta_data['email']})")
                    results['errors'] += 1
                    continue
                
                # Validar estado
                estados_validos = ['Activo', 'En proceso', 'Rechazado']
                if recluta_data['estado'] not in estados_validos:
                    recluta_data['estado'] = 'En proceso'  # Valor por defecto
                
                # Verificar si ya existe un recluta con este email
                existing_recluta = Recluta.query.filter_by(email=recluta_data['email']).first()
                if existing_recluta:
                    results['skipped'] += 1
                    continue
                
                # Crear nuevo recluta
                nuevo_recluta = Recluta(**recluta_data)
                
                # Guardar en base de datos
                try:
                    nuevo_recluta.save()
                    results['imported'] += 1
                except DatabaseError as e:
                    results['error_details'].append(f"Fila {index + 2}: Error al guardar - {str(e)}")
                    results['errors'] += 1
                    
            except Exception as e:
                results['error_details'].append(f"Fila {index + 2}: {str(e)}")
                results['errors'] += 1
                continue
        
        return results
        
    except Exception as e:
        current_app.logger.error(f"Error procesando archivo Excel: {str(e)}")
        raise ValueError(f"Error al procesar el archivo Excel: {str(e)}")

# ✅ NUEVA RUTA: Descargar plantilla Excel
@api_bp.route('/reclutas/plantilla-excel', methods=['GET'])
@login_required
def download_excel_template():
    """
    Genera y descarga una plantilla Excel para importar reclutas.
    Solo disponible para administradores.
    """
    try:
        # Verificar que el usuario sea administrador
        if hasattr(current_user, 'rol') and current_user.rol != 'admin':
            return jsonify({
                "success": False,
                "message": "Solo los administradores pueden descargar la plantilla"
            }), 403
        
        try:
            import pandas as pd
            from io import BytesIO
            from flask import send_file
            
            # Crear datos de ejemplo para la plantilla
            template_data = {
                'nombre': [
                    'Juan Pérez García',
                    'María Elena Rodríguez',
                    'Carlos Alberto Mendoza'
                ],
                'email': [
                    'juan.perez@email.com',
                    'maria.rodriguez@email.com', 
                    'carlos.mendoza@email.com'
                ],
                'telefono': [
                    '+52 55 1234-5678',
                    '55-9876-5432',
                    '5555551234'
                ],
                'puesto': [
                    'Desarrollador Frontend',
                    'Diseñadora UX/UI',
                    'Analista de Datos'
                ],
                'estado': [
                    'En proceso',
                    'Activo',
                    'En proceso'
                ],
                'notas': [
                    'Candidato con experiencia en React',
                    'Portfolio excelente, referencias positivas',
                    'Conocimientos en Python y SQL'
                ]
            }
            
            # Crear DataFrame
            df = pd.DataFrame(template_data)
            
            # Crear archivo Excel en memoria
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Reclutas', index=False)
                
                # Obtener el workbook y worksheet para formato
                workbook = writer.book
                worksheet = writer.sheets['Reclutas']
                
                # Ajustar ancho de columnas
                for idx, col in enumerate(df.columns):
                    max_length = max(
                        df[col].astype(str).map(len).max(),  # max length in column
                        len(col)  # length of column name
                    )
                    worksheet.column_dimensions[chr(65 + idx)].width = min(max_length + 2, 50)
                
                # Agregar hoja de instrucciones
                instructions_data = {
                    'Campo': ['nombre', 'email', 'telefono', 'puesto', 'estado', 'notas'],
                    'Requerido': ['SÍ', 'SÍ', 'SÍ', 'No', 'No', 'No'],
                    'Descripción': [
                        'Nombre completo del candidato',
                        'Correo electrónico válido',
                        'Número de teléfono',
                        'Puesto al que aplica',
                        'Estado: "Activo", "En proceso" o "Rechazado"',
                        'Notas adicionales sobre el candidato'
                    ],
                    'Ejemplo': [
                        'Juan Pérez García',
                        'juan@email.com',
                        '55-1234-5678',
                        'Desarrollador',
                        'En proceso',
                        'Experiencia en React'
                    ]
                }
                
                instructions_df = pd.DataFrame(instructions_data)
                instructions_df.to_excel(writer, sheet_name='Instrucciones', index=False)
                
                # Ajustar columnas de instrucciones
                inst_worksheet = writer.sheets['Instrucciones']
                for idx, col in enumerate(instructions_df.columns):
                    max_length = max(
                        instructions_df[col].astype(str).map(len).max(),
                        len(col)
                    )
                    inst_worksheet.column_dimensions[chr(65 + idx)].width = min(max_length + 2, 60)
            
            output.seek(0)
            
            return send_file(
                output,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name='plantilla_reclutas.xlsx'
            )
            
        except ImportError:
            return jsonify({
                "success": False,
                "message": "Pandas no está instalado. No se puede generar la plantilla Excel."
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error generando plantilla Excel: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar plantilla: {str(e)}"
        }), 500