from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, DatabaseError
from models.recluta import Recluta
from models.entrevista import Entrevista
from utils.helpers import guardar_archivo, eliminar_archivo
from utils.validators import validate_recluta_data, validate_entrevista_data, ValidationError
from datetime import datetime
import os

api_bp = Blueprint('api', __name__)

# ----- API DE RECLUTAS -----

@api_bp.route('/reclutas', methods=['GET'])
@login_required
def get_reclutas():
    """
    Obtiene la lista de reclutas con paginación y filtros.
    """
    try:
        # Parámetros de paginación y filtrado
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', current_app.config['DEFAULT_PAGE_SIZE'], type=int)
        search = request.args.get('search', '')
        estado = request.args.get('estado', '')
        sort_by = request.args.get('sort_by', 'id')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Limitar el tamaño de página para prevenir abuso
        per_page = min(per_page, current_app.config['MAX_PAGE_SIZE'])
        
        # Obtener reclutas paginados
        pagination = Recluta.get_all(
            page=page,
            per_page=per_page,
            search=search,
            estado=estado,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        return jsonify({
            "success": True,
            "reclutas": [r.serialize() for r in pagination.items],
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page,
            "per_page": per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener reclutas: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener reclutas: {str(e)}"}), 500

@api_bp.route('/reclutas/<int:id>', methods=['GET'])
@login_required
def get_recluta(id):
    """
    Obtiene los detalles de un recluta específico.
    """
    try:
        recluta = Recluta.get_by_id(id)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado"}), 404
            
        return jsonify({
            "success": True,
            "recluta": recluta.serialize()
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener recluta {id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener recluta: {str(e)}"}), 500

@api_bp.route('/reclutas', methods=['POST'])
@login_required
def add_recluta():
    """
    Crea un nuevo recluta.
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
    """
    try:
        recluta = Recluta.get_by_id(id)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado"}), 404
        
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            
        # Validar datos
        try:
            validated_data = validate_recluta_data(data, is_update=True)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400
        
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
    """
    try:
        recluta = Recluta.get_by_id(id)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado"}), 404
        
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
    """
    try:
        # Filtro opcional por recluta_id
        recluta_id = request.args.get('recluta_id', type=int)
        
        if recluta_id:
            entrevistas = Entrevista.get_for_recluta(recluta_id)
        else:
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
    """
    try:
        entrevista = Entrevista.get_by_id(id)
        if not entrevista:
            return jsonify({"success": False, "message": "Entrevista no encontrada"}), 404
            
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
    """
    try:
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_entrevista_data(data)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400
        
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
    """
    try:
        entrevista = Entrevista.get_by_id(id)
        if not entrevista:
            return jsonify({"success": False, "message": "Entrevista no encontrada"}), 404
        
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_entrevista_data(data, is_update=True)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400
        
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
    """
    try:
        entrevista = Entrevista.get_by_id(id)
        if not entrevista:
            return jsonify({"success": False, "message": "Entrevista no encontrada"}), 404
        
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