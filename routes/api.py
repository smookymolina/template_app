from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from models import db, DatabaseError
from models.recluta import Recluta
from models.usuario import Usuario
from utils.decorators import admin_required, role_required, gerente_or_admin_required, gerente_required
from models.entrevista import Entrevista  # Importación específica desde el módulo
from models.evento_recluta import EventoRecluta
from utils.helpers import guardar_archivo, eliminar_archivo
from utils.validators import (
    validate_recluta_data,
    validate_entrevista_data,
    validate_evento_timeline_data,
    ValidationError,
)
from sqlalchemy import func, case, extract, desc
from datetime import datetime, timedelta
from collections import defaultdict
import os
import calendar

api_bp = Blueprint('api', __name__)

@api_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """
    Crea un nuevo usuario.
    Solo disponible para administradores.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No se enviaron datos"}), 400

        nombre = data.get('nombre')
        email = data.get('email')
        password = data.get('password')
        rol = data.get('rol')

        if not all([nombre, email, password, rol]):
            return jsonify({"success": False, "message": "Todos los campos son requeridos"}), 400

        if Usuario.query.filter_by(email=email).first():
            return jsonify({"success": False, "message": "El correo electrónico ya está en uso"}), 409

        nuevo_usuario = Usuario(email=email, nombre=nombre, rol=rol)
        nuevo_usuario.set_password(password)
        nuevo_usuario.save()

        return jsonify({"success": True, "message": "Usuario creado exitosamente", "usuario": nuevo_usuario.serialize()}), 201

    except Exception as e:
        current_app.logger.error(f"Error al crear usuario: {str(e)}")
        return jsonify({"success": False, "message": f"Error al crear usuario: {str(e)}"}), 500

# ----- API DE RECLUTAS -----

@api_bp.route('/asesores', methods=['GET'])
@login_required
def get_asesores():
    """
    Obtiene la lista de usuarios según filtros jerárquicos.
    Permite solicitar solo gerentes, asesores o ambos y filtrar por asignación.
    """
    try:
        roles_param = request.args.get('rol')
        sin_gerente_param = request.args.get('sin_gerente', '')
        gerente_id = request.args.get('gerente_id', type=int)

        valid_roles = ['gerente', 'asesor']
        if roles_param:
            requested_roles = [role.strip().lower() for role in roles_param.split(',') if role.strip()]
            filtered_roles = []
            for role in requested_roles:
                if role in valid_roles and role not in filtered_roles:
                    filtered_roles.append(role)
        else:
            filtered_roles = valid_roles.copy()

        sin_gerente_param = (sin_gerente_param or '').strip().lower()
        sin_gerente_param = sin_gerente_param.replace('\u00ed', 'i')
        sin_gerente = sin_gerente_param in {'1', 'true', 'yes', 'si'}

        if not filtered_roles:
            return jsonify({
                "success": True,
                "asesores": [],
                "filters": {
                    "roles": [],
                    "sin_gerente": sin_gerente,
                    "gerente_id": gerente_id
                }
            })

        query = Usuario.query.filter(Usuario.rol.in_(filtered_roles))
        query = query.filter(Usuario.is_active.is_(True))

        if sin_gerente:
            query = query.filter(Usuario.gerente_id.is_(None))
        elif gerente_id is not None:
            query = query.filter(Usuario.gerente_id == gerente_id)

        query = query.order_by(Usuario.nombre.asc(), Usuario.email.asc())

        usuarios = query.all()
        return jsonify({
            "success": True,
            "asesores": [usuario.serialize() for usuario in usuarios],
            "total": len(usuarios),
            "filters": {
                "roles": filtered_roles,
                "sin_gerente": sin_gerente,
                "gerente_id": gerente_id
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener asesores: {str(e)}")
        return jsonify({"success": False, "message": f"Error al obtener asesores: {str(e)}"}), 500


@api_bp.route('/gerentes/mis-asesores', methods=['GET'])
@gerente_required
def get_mis_asesores():
    """
    Obtiene la lista de asesores asignados al gerente actual.
    """
    try:
        # El decorador @gerente_required ya ha validado el rol del usuario.
        # El método get_mis_asesores() se encuentra en el modelo Usuario.
        asesores = current_user.get_mis_asesores()
        return jsonify({
            "success": True,
            "asesores": [asesor.serialize() for asesor in asesores]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener los asesores del gerente: {str(e)}")
        return jsonify({"success": False, "message": "Error interno al obtener asesores"}), 500


@api_bp.route('/reclutas', methods=['GET'])
@login_required
def get_reclutas():
    try:
        # Debug logging
        current_app.logger.info(f"get_reclutas called - current_user: {current_user}")
        current_app.logger.info(f"current_user type: {type(current_user)}")
        current_app.logger.info(f"current_user.is_authenticated: {getattr(current_user, 'is_authenticated', 'No attribute')}")
        
        # Parámetros existentes
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', current_app.config.get('DEFAULT_PAGE_SIZE', 10), type=int)
        search = request.args.get('search', '')
        estado = request.args.get('estado', '')
        sort_by = request.args.get('sort_by', 'id')
        sort_order = request.args.get('sort_order', 'asc')
        
        # 🆕 NUEVO: Parámetro de filtro por asesor
        asesor_id = request.args.get('asesor_id', '')
        
        per_page = min(per_page, current_app.config.get('MAX_PAGE_SIZE', 50))
        
        # Construir query base
        query = Recluta.query
        
        # 🆕 NUEVO: Filtrar por rol del usuario actual (JERARQUÍA: Admin > Gerente > Asesor)
        user_role = getattr(current_user, 'rol', None)
        user_id = getattr(current_user, 'id', None)
        
        current_app.logger.info(f"User role: {user_role}, User ID: {user_id}")
        
        if user_role == 'asesor':
            # Si es asesor, solo sus reclutas
            query = query.filter_by(asesor_id=user_id)
        elif user_role == 'gerente':
            # Si es gerente, puede ver:
            # 1. Sus propios reclutas (asignados directamente)
            # 2. Los reclutas de sus asesores
            mis_asesores_ids = [asesor.id for asesor in current_user.get_mis_asesores()]
            
            if asesor_id:
                # Si especifica un asesor, debe ser uno de los suyos
                if asesor_id == 'sin_asignar':
                    # Reclutas suyos sin asignar a asesores
                    query = query.filter(
                        Recluta.asesor_id == user_id
                    )
                elif asesor_id.isdigit() and (int(asesor_id) == user_id or int(asesor_id) in mis_asesores_ids):
                    query = query.filter_by(asesor_id=int(asesor_id))
                else:
                    # No puede ver ese asesor, retornar vacío
                    query = query.filter(False)
            else:
                # Ver todos: sus reclutas + reclutas de sus asesores
                query = query.filter(
                    db.or_(
                        Recluta.asesor_id == user_id,  # Sus reclutas directos
                        Recluta.asesor_id.in_(mis_asesores_ids)  # Reclutas de sus asesores
                    )
                )
        elif user_role == 'admin' and asesor_id:
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
        
        current_app.logger.info(f"Query executed successfully, found {pagination.total} total reclutas")
        
        return jsonify({
            "success": True,
            "reclutas": [r.serialize() for r in pagination.items],
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page,
            "per_page": per_page,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
            "user_role": user_role or 'user',
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
            return jsonify({
                "success": False,
                "message": "Los asesores no tienen permisos para eliminar reclutas."
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

# ----- API DE TIMELINE PERSONALIZADO POR RECLUTA -----

@api_bp.route('/debug/timeline-setup', methods=['GET'])
@login_required
def debug_timeline_setup():
    """
    Ruta de diagnóstico para verificar el estado de la tabla de timeline
    """
    try:
        from models.evento_recluta import EventoRecluta
        from sqlalchemy import text
        
        debug_info = {
            "model_imported": True,
            "table_exists": False,
            "can_query": False,
            "can_create": False,
            "error_details": None
        }
        
        try:
            # Intentar hacer una consulta simple
            EventoRecluta.query.count()
            debug_info["table_exists"] = True
            debug_info["can_query"] = True
        except Exception as query_error:
            debug_info["error_details"] = str(query_error)
            
            # Intentar crear las tablas
            try:
                db.create_all()
                debug_info["can_create"] = True
                
                # Intentar la consulta de nuevo
                EventoRecluta.query.count()
                debug_info["table_exists"] = True
                debug_info["can_query"] = True
                
            except Exception as create_error:
                debug_info["error_details"] = f"Query: {str(query_error)} | Create: {str(create_error)}"
        
        return jsonify({"success": True, "debug_info": debug_info})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@api_bp.route('/reclutas/<int:recluta_id>/timeline', methods=['GET'])
@login_required
def get_timeline_recluta(recluta_id):
    """
    Lista los eventos de timeline personalizados de un recluta.
    """
    try:
        recluta = Recluta.get_by_id(recluta_id, current_user=current_user)
        if not recluta:
            current_app.logger.warning(f"Timeline solicitado para recluta inexistente o sin permisos: {recluta_id}")
            return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos"}), 404

        try:
            eventos = EventoRecluta.get_for_recluta(recluta_id)
            current_app.logger.info(f"Timeline recluta {recluta_id}: {len(eventos)} eventos encontrados")
            return jsonify({
                "success": True, 
                "items": [e.serialize() for e in eventos],
                "count": len(eventos),
                "recluta_id": recluta_id
            })
        except Exception as db_error:
            current_app.logger.error(f"Error de BD obteniendo timeline recluta {recluta_id}: {str(db_error)}")
            # Crear las tablas si no existen y reintentar
            try:
                db.create_all()
                current_app.logger.info("Tablas creadas, reintentando consulta de timeline")
                eventos = EventoRecluta.get_for_recluta(recluta_id)
                return jsonify({
                    "success": True, 
                    "items": [e.serialize() for e in eventos],
                    "count": len(eventos),
                    "recluta_id": recluta_id,
                    "recovered": True
                })
            except Exception as retry_error:
                current_app.logger.error(f"Error persistente en timeline recluta {recluta_id}: {str(retry_error)}")
                return jsonify({
                    "success": False, 
                    "message": f"Error de base de datos: {str(retry_error)}",
                    "items": [],
                    "count": 0
                }), 500
                
    except Exception as e:
        current_app.logger.error(f"Error general en timeline de recluta {recluta_id}: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Error interno: {str(e)}",
            "items": [],
            "count": 0
        }), 500


@api_bp.route('/reclutas/<int:recluta_id>/timeline', methods=['POST'])
@login_required
def create_timeline_event(recluta_id):
    """
    Crea un evento de timeline para un recluta.
    """
    try:
        recluta = Recluta.get_by_id(recluta_id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos"}), 404

        data = request.get_json() or {}
        data['recluta_id'] = recluta_id

        # Validación básica sin usar el validador complejo temporalmente
        required_fields = ['date', 'status', 'title']
        missing_fields = [f for f in required_fields if not data.get(f)]
        if missing_fields:
            return jsonify({
                "success": False, 
                "message": "Campos requeridos faltantes", 
                "errors": {f: f"El campo {f} es requerido" for f in missing_fields}
            }), 400

        try:
            # Intentar crear y guardar el evento
            from datetime import datetime
            try:
                fecha_obj = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"success": False, "message": "Formato de fecha inválido. Use YYYY-MM-DD"}), 400
                
            ev = EventoRecluta(
                recluta_id=recluta_id,
                fecha=fecha_obj,
                estado=data['status'],
                titulo=data['title'],
                descripcion=data.get('description', ''),
            )
            
            try:
                ev.save()
                return jsonify({"success": True, "item": ev.serialize()}), 201
            except Exception as save_error:
                current_app.logger.error(f"Error guardando evento: {str(save_error)}")
                # Intentar crear la tabla y volver a intentar
                try:
                    db.create_all()
                    current_app.logger.info("Tablas creadas, reintentando guardado...")
                    ev.save()
                    return jsonify({"success": True, "item": ev.serialize()}), 201
                except Exception as retry_error:
                    current_app.logger.error(f"Error en segundo intento: {str(retry_error)}")
                    return jsonify({"success": False, "message": "Error persistente de base de datos"}), 500
                
        except Exception as creation_error:
            current_app.logger.error(f"Error creando objeto evento: {str(creation_error)}")
            return jsonify({"success": False, "message": f"Error creando evento: {str(creation_error)}"}), 500
                
    except Exception as e:
        current_app.logger.error(f"Error general al crear evento timeline para recluta {recluta_id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@api_bp.route('/reclutas/<int:recluta_id>/timeline/<int:event_id>', methods=['PUT'])
@login_required
def update_timeline_event(recluta_id, event_id):
    """
    Actualiza un evento de timeline para un recluta.
    """
    try:
        recluta = Recluta.get_by_id(recluta_id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos"}), 404

        ev = EventoRecluta.get_by_id(event_id)
        if not ev or ev.recluta_id != recluta_id:
            return jsonify({"success": False, "message": "Evento no encontrado"}), 404

        data = request.get_json() or {}
        # No permitimos cambiar recluta_id por seguridad
        data['recluta_id'] = recluta_id

        try:
            validated = validate_evento_timeline_data(data, is_update=True)
        except ValidationError as e:
            return jsonify({"success": False, "message": "Error de validación", "errors": e.args[0]}), 400

        if 'date' in validated:
            ev.fecha = validated['date']
        if 'status' in validated:
            ev.estado = validated['status']
        if 'title' in validated:
            ev.titulo = validated['title']
        if 'description' in validated:
            ev.descripcion = validated['description']

        ev.save()
        return jsonify({"success": True, "item": ev.serialize()})
    except Exception as e:
        current_app.logger.error(f"Error al actualizar evento {event_id} del recluta {recluta_id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@api_bp.route('/reclutas/<int:recluta_id>/timeline/<int:event_id>', methods=['DELETE'])
@login_required
def delete_timeline_event(recluta_id, event_id):
    """
    Elimina un evento de timeline para un recluta.
    """
    try:
        recluta = Recluta.get_by_id(recluta_id, current_user=current_user)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado o sin permisos"}), 404

        ev = EventoRecluta.get_by_id(event_id)
        if not ev or ev.recluta_id != recluta_id:
            return jsonify({"success": False, "message": "Evento no encontrado"}), 404

        ev.delete()
        return jsonify({"success": True, "message": "Evento eliminado"})
    except Exception as e:
        current_app.logger.error(f"Error al eliminar evento {event_id} del recluta {recluta_id}: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

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
    📊 ENDPOINT CORREGIDO para obtener estadísticas
    """
    try:
        from flask_login import current_user
        
        # ✅ VERIFICAR autenticación
        if not current_user or not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Usuario no autenticado"
            }), 401
        
        # ✅ ASEGURAR que current_user tenga rol
        user_rol = getattr(current_user, 'rol', 'admin')
        
        # Parámetros de consulta
        dias = request.args.get('dias', 30, type=int)
        incluir_tendencias = request.args.get('tendencias', 'false').lower() == 'true'
        incluir_comparativas = request.args.get('comparativas', 'false').lower() == 'true'
        
        # Calcular fechas
        fecha_fin = datetime.utcnow()
        fecha_inicio = fecha_fin - timedelta(days=dias)
        
        # ✅ GENERAR estadísticas según rol (JERARQUÍA: Admin > Gerente > Asesor)
        if user_rol in ['admin', 'gerente']:
            estadisticas = get_estadisticas_admin(
                fecha_inicio, fecha_fin, incluir_tendencias, incluir_comparativas
            )
        else:
            estadisticas = get_estadisticas_asesor(
                current_user.id, fecha_inicio, fecha_fin
            )
        
        # ✅ AGREGAR metadatos
        estadisticas['metadata'] = {
            'periodo_dias': dias,
            'fecha_inicio': fecha_inicio.strftime('%Y-%m-%d'),
            'fecha_fin': fecha_fin.strftime('%Y-%m-%d'),
            'usuario_rol': user_rol,
            'generado_en': datetime.utcnow().isoformat()
        }
        
        current_app.logger.info(f"📊 Estadísticas generadas para {current_user.email} (rol: {user_rol})")
        
        # ✅ RESPUESTA JSON asegurada
        response = jsonify({
            "success": True,
            "estadisticas": estadisticas
        })
        response.headers['Content-Type'] = 'application/json'
        return response
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al obtener estadísticas: {str(e)}")
        
        # ✅ RESPUESTA de error también en JSON
        response = jsonify({
            "success": False,
            "message": f"Error al generar estadísticas: {str(e)}"
        })
        response.headers['Content-Type'] = 'application/json'
        return response, 500

@api_bp.route('/metricas/admin', methods=['GET'])
@login_required
def get_metricas_admin():
    """
    👑 ENDPOINT para métricas administrativas avanzadas
    """
    try:
        from flask_login import current_user
        
        # ✅ VERIFICAR permisos de administrador
        if not current_user or not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Usuario no autenticado"
            }), 401
        
        if getattr(current_user, 'rol', 'asesor') != 'admin':
            return jsonify({
                "success": False,
                "message": "Sin permisos para acceder a métricas administrativas"
            }), 403
        
        # Generar métricas administrativas completas
        fecha_fin = datetime.utcnow()
        fecha_inicio = fecha_fin - timedelta(days=30)
        
        metricas = get_estadisticas_admin(fecha_inicio, fecha_fin, True, True)
        
        # ✅ RESPUESTA JSON asegurada
        response = jsonify({
            "success": True,
            "metricas_asesores": metricas.get('asesores', []),
            "metricas_globales": metricas.get('globales', {}),
            "insights": metricas.get('insights', {}),
            "metadata": {
                'generado_en': datetime.utcnow().isoformat(),
                'usuario': current_user.email
            }
        })
        response.headers['Content-Type'] = 'application/json'
        return response
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al obtener métricas admin: {str(e)}")
        
        response = jsonify({
            "success": False,
            "message": f"Error al generar métricas administrativas: {str(e)}"
        })
        response.headers['Content-Type'] = 'application/json'
        return response, 500

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
        if current_user.rol in ['admin', 'gerente']:
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
        
        # Obtener solo eventos personalizados creados por el asesor
        try:
            personalizados = EventoRecluta.get_for_recluta(recluta.id)
            custom_events = [e.serialize() for e in personalizados]
            current_app.logger.info(f"Timeline folio {folio}: {len(custom_events)} eventos encontrados")
        except Exception as db_error:
            current_app.logger.error(f"Error de BD obteniendo eventos para folio {folio}: {str(db_error)}")
            custom_events = []
        
        return jsonify({
            "success": True,
            "folio": folio,
            "nombre_candidato": recluta.nombre,
            "estado_actual": recluta.estado,
            "custom_events": custom_events,
            "has_custom_events": len(custom_events) > 0,
            "custom_events_count": len(custom_events)
        })
    except Exception as e:
        current_app.logger.error(f"Error general al obtener timeline del folio {folio}: {str(e)}")
        return jsonify({
            "success": False, 
            "message": "Error al procesar la solicitud",
            "custom_events": [],
            "has_custom_events": False,
            "custom_events_count": 0
        }), 500

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
        ruta_relativa = guardar_archivo(archivo, 'docs', tipos_permitidos=['pdf'])
        
        if ruta_relativa:
            # Crear registro en base de datos
            nuevo_documento = Documento(
                recluta_id=id,
                nombre=secure_filename(archivo.filename),
                url=ruta_relativa,
                tipo='pdf',
                tamano=getattr(archivo, 'content_length', None)
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

@api_bp.route('/tracking/<folio>/documents', methods=['GET'])
def download_documentos_by_folio(folio):
    """
    Descarga todos los documentos de un recluta por su folio.
    Esta ruta es pública y no requiere autenticación.
    Devuelve un ZIP con todos los documentos del recluta.
    """
    try:
        import os
        import zipfile
        from io import BytesIO
        from flask import send_file
        from models.documento import Documento
        
        # Buscar recluta por folio
        recluta = Recluta.get_by_folio(folio)
        if not recluta:
            return jsonify({
                "success": False,
                "message": "Folio no encontrado"
            }), 404
        
        # Obtener todos los documentos del recluta
        documentos = Documento.query.filter_by(recluta_id=recluta.id).all()
        
        if not documentos:
            return jsonify({
                "success": False,
                "message": "No hay documentos disponibles para este folio"
            }), 404
        
        # Crear ZIP en memoria
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            documentos_agregados = 0
            
            for documento in documentos:
                try:
                    # Construir la ruta completa del archivo
                    if documento.url.startswith('uploads/'):
                        # Ruta relativa desde la raíz del proyecto
                        ruta_archivo = os.path.join(current_app.root_path, documento.url)
                    else:
                        # Ruta dentro de uploads
                        ruta_archivo = os.path.join(current_app.config['UPLOAD_FOLDER'], documento.url)
                    
                    # Verificar que el archivo existe
                    if os.path.exists(ruta_archivo):
                        # Crear nombre limpio para el archivo en el ZIP
                        nombre_limpio = f"{documento.id}_{documento.nombre}"
                        
                        # Agregar archivo al ZIP
                        zip_file.write(ruta_archivo, nombre_limpio)
                        documentos_agregados += 1
                        
                        current_app.logger.info(f"Documento agregado al ZIP: {nombre_limpio}")
                    else:
                        current_app.logger.warning(f"Archivo no encontrado: {ruta_archivo}")
                        
                except Exception as e:
                    current_app.logger.error(f"Error procesando documento {documento.id}: {str(e)}")
                    continue
        
        if documentos_agregados == 0:
            return jsonify({
                "success": False,
                "message": "No se pudieron encontrar los archivos de documentos"
            }), 404
        
        # Preparar el buffer para envío
        zip_buffer.seek(0)
        
        # Crear nombre del archivo ZIP
        nombre_zip = f"documentos_{folio}_{recluta.nombre.replace(' ', '_')}.zip"
        
        current_app.logger.info(f"Enviando ZIP con {documentos_agregados} documentos para folio {folio}")
        
        return send_file(
            zip_buffer,
            as_attachment=True,
            download_name=nombre_zip,
            mimetype='application/zip'
        )
        
    except Exception as e:
        current_app.logger.error(f"Error al descargar documentos por folio {folio}: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno al procesar la descarga"
        }), 500

@api_bp.route('/reclutas/distribuir-excel', methods=['POST'])
@gerente_or_admin_required
def distribuir_reclutas_excel():
    """
    Distribuye reclutas desde Excel automáticamente entre asesores activos.
    Disponible para administradores y gerentes.
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
        
        # ✅ MODIFICADO: Obtener gerentes activos para distribución inicial (admin → gerentes)
        if current_user.rol == 'admin':
            # Admin distribuye a gerentes
            asesores = Usuario.query.filter(
                Usuario.is_active == True,
                Usuario.rol == 'gerente'
            ).all()
            
            if not asesores:
                return jsonify({
                    "success": False, 
                    "message": "No hay gerentes activos para asignar reclutas"
                }), 400
        else:
            # Gerente distribuye a sus asesores
            asesores = current_user.get_mis_asesores()
            
            if not asesores:
                return jsonify({
                    "success": False, 
                    "message": "No tienes asesores asignados para distribuir reclutas"
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


@api_bp.route('/reclutas/distribuir-dual', methods=['POST'])
@admin_required
def distribuir_reclutas_dual():
    """
    Distribución dual: permite asignar reclutas por separado a gerentes y asesores.
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

        # Obtener tipo de distribución del form data
        distribution_type = request.form.get('distribution_type', 'dual')
        current_app.logger.info(f"🎯 Distribución dual iniciada, tipo: {distribution_type}")

        # Obtener usuarios según el tipo de distribución
        gerentes = []
        asesores = []

        if distribution_type in ['dual', 'gerentes']:
            gerentes = Usuario.query.filter(
                Usuario.is_active == True,
                Usuario.rol == 'gerente'
            ).all()

        if distribution_type in ['dual', 'asesores']:
            asesores = Usuario.query.filter(
                Usuario.is_active == True,
                Usuario.rol == 'asesor'
            ).all()

        # Validar que hay usuarios disponibles
        if not gerentes and not asesores:
            return jsonify({
                "success": False,
                "message": f"No hay usuarios activos disponibles para distribución tipo '{distribution_type}'"
            }), 400

        # Procesar Excel y distribuir usando nueva función dual
        from utils.helpers import procesar_y_distribuir_dual
        resultado = procesar_y_distribuir_dual(archivo, gerentes, asesores, distribution_type)

        if resultado['success']:
            current_app.logger.info(f"Distribución dual exitosa: {resultado['total_procesados']} reclutas")
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 400

    except Exception as e:
        current_app.logger.error(f"Error en distribución dual: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al procesar distribución dual: {str(e)}"
        }), 500


@api_bp.route('/reclutas/redistribuir-manual', methods=['POST'])
@gerente_or_admin_required
def redistribuir_reclutas_manual():
    """
    🔄 NUEVA RUTA: Redistribuye reclutas existentes según cantidades manuales.
    Disponible para administradores y gerentes.
    """
    try:
        # Importar dependencias necesarias
        from models import Usuario, db
        from datetime import datetime, date
        import random
        
        data = request.get_json()
        
        if not data or 'distribution' not in data:
            return jsonify({
                "success": False,
                "message": "Datos de distribución requeridos"
            }), 400
        
        redistribucion_nueva = data['distribution']
        filtros = data.get('filters', {})
        
        current_app.logger.info(f"Iniciando redistribución manual: {redistribucion_nueva}")
        
        # 🔍 Construir query base de reclutas
        query_reclutas = Recluta.query.filter(Recluta.estado != 'Rechazado')
        
        # Aplicar filtros opcionales
        if filtros.get('fecha_desde'):
            try:
                fecha_desde = datetime.fromisoformat(filtros['fecha_desde'].replace('Z', '+00:00'))
                query_reclutas = query_reclutas.filter(Recluta.fecha_registro >= fecha_desde)
            except ValueError:
                current_app.logger.warning(f"Formato de fecha inválido para fecha_desde: {filtros['fecha_desde']}")
                return jsonify({"success": False, "message": "Formato de fecha inválido para fecha_desde"}), 400
        
        if filtros.get('fecha_hasta'):
            try:
                fecha_hasta = datetime.fromisoformat(filtros['fecha_hasta'].replace('Z', '+00:00'))
                query_reclutas = query_reclutas.filter(Recluta.fecha_registro <= fecha_hasta)
            except ValueError:
                current_app.logger.warning(f"Formato de fecha inválido para fecha_hasta: {filtros['fecha_hasta']}")
                return jsonify({"success": False, "message": "Formato de fecha inválido para fecha_hasta"}), 400
        
        if filtros.get('estado'):
            query_reclutas = query_reclutas.filter(Recluta.estado == filtros['estado'])
        
        if filtros.get('solo_importados_hoy'):
            hoy = date.today()
            query_reclutas = query_reclutas.filter(
                db.func.date(Recluta.fecha_registro) == hoy
            )
        
        # Obtener reclutas disponibles
        reclutas_disponibles = query_reclutas.all()
        total_disponible = len(reclutas_disponibles)
        
        # Validar y sumar el total solicitado de la nueva distribución
        total_solicitado = 0
        for asesor_id_str, data_item in redistribucion_nueva.items():
            try:
                count = int(data_item['count'])
                if count < 0:
                    raise ValueError("Cantidad no puede ser negativa")
                total_solicitado += count
            except (ValueError, KeyError):
                return jsonify({
                    "success": False,
                    "message": f"Datos de distribución inválidos para asesor {asesor_id_str}. Se esperaba un número entero positivo."
                }), 400
        
        current_app.logger.info(f"Reclutas disponibles: {total_disponible}, solicitados: {total_solicitado}")
        
        # ✅ Validación de totales
        if total_solicitado != total_disponible:
            return jsonify({
                "success": False,
                "message": f"Error: Total solicitado ({total_solicitado}) no coincide con disponible ({total_disponible}). Ajuste las cantidades."
            }), 400
        
        # 🔍 Validar asesores y construir mapeo
        asesor_ids_solicitados = [int(aid) for aid in redistribucion_nueva.keys()]
        asesores_validos = Usuario.query.filter(
            Usuario.id.in_(asesor_ids_solicitados),
            Usuario.is_active == True,
            Usuario.rol.in_(['asesor', 'gerente'])
        ).all()
        
        if len(asesores_validos) != len(asesor_ids_solicitados):
            valid_ids = {a.id for a in asesores_validos}
            invalid_ids = [aid for aid in asesor_ids_solicitados if aid not in valid_ids]
            return jsonify({
                "success": False,
                "message": f"Asesores inválidos o inactivos encontrados: {invalid_ids}"
            }), 400
        
        asesor_map = {asesor.id: asesor for asesor in asesores_validos}
        
        # 🔄 Preparar lista de asignaciones
        nuevas_asignaciones = []
        for asesor_id_str, data_item in redistribucion_nueva.items():
            asesor_id = int(asesor_id_str)
            cantidad = int(data_item['count'])
            is_fixed = data_item.get('is_fixed', False) # No se usa directamente para la asignación, pero se mantiene
            
            if asesor_id in asesor_map and cantidad > 0:
                nuevas_asignaciones.extend([asesor_id] * cantidad)
        
        # 🎲 Barajar para distribución aleatoria
        random.shuffle(nuevas_asignaciones)
        
        # 🔄 Aplicar redistribución
        cambios_realizados = []
        for i, recluta in enumerate(reclutas_disponibles):
            nuevo_asesor_id = nuevas_asignaciones[i]
            
            if recluta.asesor_id != nuevo_asesor_id:
                asesor_anterior = recluta.asesor.email if recluta.asesor else "Sin asignar"
                nuevo_asesor = asesor_map.get(nuevo_asesor_id)
                
                if nuevo_asesor:
                    cambios_realizados.append({
                        "recluta_id": recluta.id,
                        "folio": recluta.folio,
                        "nombre": recluta.nombre,
                        "asesor_anterior": asesor_anterior,
                        "asesor_nuevo": nuevo_asesor.email
                    })
                    
                    recluta.asesor_id = nuevo_asesor_id
        
        # 💾 Confirmar cambios en base de datos
        try:
            db.session.commit()
            current_app.logger.info(f"Redistribución exitosa: {len(cambios_realizados)} cambios aplicados")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error al confirmar cambios en DB: {str(e)}")
            return jsonify({"success": False, "message": f"Error al guardar cambios en la base de datos: {str(e)}"}), 500
        
        # 📊 Generar reporte final (basado en la redistribución_nueva enviada por el frontend)
        reporte_final = {}
        for asesor_id_str, data_item in redistribucion_nueva.items():
            asesor_id = int(asesor_id_str)
            if asesor_id in asesor_map:
                reporte_final[asesor_map[asesor_id].email] = {
                    "count": data_item['count'],
                    "is_fixed": data_item.get('is_fixed', False)
                }
        
        return jsonify({
            "success": True,
            "message": f"Redistribución completada exitosamente",
            "total_redistribuidos": len(cambios_realizados),
            "total_procesados": total_disponible, # Renombrado para consistencia con frontend
            "distribucion": reporte_final, # Renombrado para consistencia con frontend
            "cambios_detalle": cambios_realizados[:10],  # Primeros 10 para UI
            "resumen": {
                "reclutas_afectados": len(cambios_realizados),
                "asesores_involucrados": len(asesores_validos),
                "filtros_aplicados": filtros
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error en redistribución manual: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al redistribuir: {str(e)}"
        }), 500


@api_bp.route('/reclutas/lote-reciente', methods=['GET'])
@admin_required
def obtener_lote_reciente():
    """
    🔍 NUEVA RUTA: Obtiene información del lote más reciente de reclutas importados.
    
    Útil para mostrar en la interfaz qué reclutas están disponibles 
    para redistribución después de una importación Excel.
    """
    try:
        # Obtener parámetros de consulta
        horas_atras = request.args.get('horas', 2, type=int)  # Últimas 2 horas por defecto
        

        fecha_limite = datetime.now() - timedelta(hours=horas_atras)
        
        # Consultar reclutas recientes
        reclutas_recientes = Recluta.query.filter(
            Recluta.fecha_registro >= fecha_limite,
            Recluta.activo == True
        ).order_by(Recluta.fecha_registro.desc()).all()
        
        if not reclutas_recientes:
            return jsonify({
                "success": True,
                "total_recientes": 0,
                "distribucion_actual": {},
                "message": f"No hay reclutas importados en las últimas {horas_atras} horas"
            })
        
        # Agrupar por asesor actual
        from collections import defaultdict
        distribucion_actual = defaultdict(int)
        asesor_info = {}
        
        for recluta in reclutas_recientes:
            if recluta.asesor:
                email = recluta.asesor.email
                distribucion_actual[email] += 1
                asesor_info[email] = {
                    "nombre_completo": recluta.asesor.nombre_completo,
                    "rol": recluta.asesor.rol
                }
        
        return jsonify({
            "success": True,
            "total_recientes": len(reclutas_recientes),
            "distribucion_actual": dict(distribucion_actual),
            "asesor_info": asesor_info,
            "periodo_consulta": f"Últimas {horas_atras} horas",
            "fecha_limite": fecha_limite.isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error obteniendo lote reciente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al consultar lote reciente: {str(e)}"
        }), 500


@api_bp.route('/usuarios/asesores-info', methods=['GET'])
@gerente_or_admin_required
def obtener_asesores_info():
    """
    🔍 NUEVA RUTA: Obtiene información básica de todos los asesores activos.
    Disponible para administradores y gerentes.
    """
    try:
        # Importar modelos necesarios
        from models import Usuario
        
        # Obtener asesores activos
        asesores = Usuario.query.filter(
            Usuario.is_active == True,
            Usuario.rol.in_(['asesor', 'gerente'])
        ).all()
        
        # Construir diccionario de información
        info_asesores = {}
        for asesor in asesores:
            info_asesores[asesor.email] = {
                "id": asesor.id,
                "nombre_completo": asesor.nombre_completo,
                "rol": asesor.rol,
                "activo": asesor.is_active,
                "email": asesor.email
            }
        
        current_app.logger.info(f"Información de asesores solicitada: {len(asesores)} encontrados")
        
        return jsonify({
            "success": True,
            "asesores": info_asesores
        })
        
    except Exception as e:
        current_app.logger.error(f"Error obteniendo la informacion de los asesores: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500

# ===============================================================================
# 🆕 NUEVOS ENDPOINTS JERÁRQUICOS - Sistema Gerente -> Asesor
# ===============================================================================

@api_bp.route('/usuarios/jerarquia', methods=['GET'])
@admin_required
def get_jerarquia_completa():
    """
    Obtiene la estructura jerárquica completa para administradores
    """
    try:
        current_app.logger.info("Obteniendo jerarquía completa para admin")
        
        jerarquia = current_user.get_jerarquia_completa()
        
        if jerarquia is None:
            return jsonify({
                "success": False,
                "message": "No tienes permisos para ver la jerarquía completa"
            }), 403
        
        return jsonify({
            "success": True,
            "jerarquia": jerarquia,
            "total_gerentes": len(jerarquia),
            "total_asesores": sum(len(item['asesores']) for item in jerarquia)
        })
        
    except Exception as e:
        current_app.logger.error(f"Error obteniendo jerarquía: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener jerarquía: {str(e)}"
        }), 500

@api_bp.route('/usuarios/mis-asesores', methods=['GET'])
@role_required('gerente')
def get_usuarios_mis_asesores():
    """
    Obtiene los asesores asignados al gerente actual
    """
    try:
        current_app.logger.info(f"Gerente {current_user.id} obteniendo sus asesores")
        
        asesores = current_user.get_mis_asesores()
        
        # Obtener estadísticas de reclutas para cada asesor
        asesores_data = []
        for asesor in asesores:
            from models.recluta import Recluta
            total_reclutas = Recluta.query.filter_by(asesor_id=asesor.id).count()
            
            asesores_data.append({
                **asesor.serialize(),
                "total_reclutas": total_reclutas
            })
        
        return jsonify({
            "success": True,
            "asesores": asesores_data,
            "total_asesores": len(asesores),
            "gerente": current_user.serialize()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error obteniendo asesores del gerente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener asesores: {str(e)}"
        }), 500

@api_bp.route('/reclutas/distribuir-a-asesores', methods=['POST'])
@role_required('gerente')
def distribuir_reclutas_a_asesores():
    """
    Redistribuye reclutas del gerente a sus asesores
    """
    try:
        data = request.get_json()
        
        if not data or 'distribution' not in data:
            return jsonify({
                "success": False,
                "message": "Datos de distribución requeridos"
            }), 400
        
        distribution = data['distribution']
        current_app.logger.info(f"Gerente {current_user.id} redistribuyendo a asesores: {distribution}")
        
        # Verificar que todos los asesores pertenecen al gerente actual
        mis_asesores_ids = [asesor.id for asesor in current_user.get_mis_asesores()]
        
        redistribucion_resultado = {}
        total_redistribuidos = 0
        
        for asesor_id_str, cantidad in distribution.items():
            asesor_id = int(asesor_id_str)
            cantidad = int(cantidad)
            
            # Usar nueva función de validación
            if not current_user.validate_hierarchical_assignment(asesor_id):
                return jsonify({
                    "success": False,
                    "message": f"El asesor {asesor_id} no pertenece a tu equipo"
                }), 403
            
            # Obtener reclutas del gerente sin asignar o reasignar
            from models.recluta import Recluta
            reclutas_disponibles = Recluta.query.filter_by(asesor_id=current_user.id).limit(cantidad).all()
            
            reclutas_reasignados = 0
            for recluta in reclutas_disponibles:
                recluta.asesor_id = asesor_id
                reclutas_reasignados += 1
            
            redistribucion_resultado[asesor_id] = reclutas_reasignados
            total_redistribuidos += reclutas_reasignados
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Se redistribuyeron {total_redistribuidos} reclutas",
            "redistribucion": redistribucion_resultado,
            "total_redistribuidos": total_redistribuidos
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error redistribuyendo a asesores: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error en redistribución: {str(e)}"
        }), 500

@api_bp.route('/reclutas/dashboard-gerente', methods=['GET'])
@role_required('gerente')
def get_dashboard_gerente():
    """
    Vista consolidada para gerente: reclutas propios + estadísticas de asesores
    """
    try:
        current_app.logger.info(f"Obteniendo dashboard para gerente {current_user.id}")
        
        from models.recluta import Recluta
        
        # Reclutas asignados directamente al gerente (sin asignar a asesores)
        mis_reclutas = Recluta.query.filter_by(asesor_id=current_user.id).all()
        
        # Estadísticas de asesores
        asesores = current_user.get_mis_asesores()
        estadisticas_asesores = []
        
        total_reclutas_equipo = len(mis_reclutas)
        
        for asesor in asesores:
            reclutas_asesor = Recluta.query.filter_by(asesor_id=asesor.id).all()
            total_reclutas_equipo += len(reclutas_asesor)
            
            # Estadísticas por estado
            estados = {}
            for recluta in reclutas_asesor:
                estado = recluta.estado or 'Sin estado'
                estados[estado] = estados.get(estado, 0) + 1
            
            estadisticas_asesores.append({
                **asesor.serialize(),
                "total_reclutas": len(reclutas_asesor),
                "estados": estados,
                "reclutas": [r.serialize() for r in reclutas_asesor]
            })
        
        return jsonify({
            "success": True,
            "gerente": current_user.serialize(),
            "mis_reclutas": [r.serialize() for r in mis_reclutas],
            "total_mis_reclutas": len(mis_reclutas),
            "asesores": estadisticas_asesores,
            "total_asesores": len(asesores),
            "total_reclutas_equipo": total_reclutas_equipo
        })
        
    except Exception as e:
        current_app.logger.error(f"Error obteniendo dashboard gerente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener dashboard: {str(e)}"
        }), 500


# ===============================================================================
# 🆕 NUEVOS ENDPOINTS PARA GESTIÓN JERÁRQUICA DE GERENTES
# ===============================================================================

def validate_hierarchical_permissions(user, action, target_id=None):
    """Valida permisos jerárquicos para acciones específicas"""
    if action == 'view_gerente_data' and user.rol != 'admin':
        return False
    
    if action == 'redistribute_to_asesor' and user.rol == 'gerente':
        # Verificar que el asesor pertenece al gerente
        if target_id:
            asesor = Usuario.query.get(target_id)
            return asesor and asesor.gerente_id == user.id
        return False
    
    if action == 'view_all_hierarchy' and user.rol != 'admin':
        return False
    
    if action == 'assign_asesor' and user.rol != 'admin':
        return False
    
    if action == 'view_mis_asesores' and user.rol != 'gerente':
        return False
    
    return True

@api_bp.route('/gerentes/jerarquia', methods=['GET'])
@admin_required
def get_gerentes_jerarquia():
    """
    Devuelve estructura jerárquica completa para administradores.
    Gerentes con sus asesores y cantidad de reclutas.
    """
    try:
        # Validación jerárquica adicional
        if not validate_hierarchical_permissions(current_user, 'view_all_hierarchy'):
            return jsonify({
                "success": False,
                "message": "No tienes permisos para ver toda la jerarquía"
            }), 403
        
        current_app.logger.info(f"Admin {current_user.id} consultando jerarquía completa")
        
        # Usar el método existente en el modelo Usuario
        jerarquia = current_user.get_jerarquia_completa()
        
        if jerarquia is None:
            return jsonify({
                "success": False,
                "message": "Solo los administradores pueden ver la jerarquía completa"
            }), 403
        
        return jsonify({
            "success": True,
            "jerarquia": jerarquia,
            "total_gerentes": len(jerarquia),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        current_app.logger.error(f"Error obteniendo jerarquía completa: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error obteniendo jerarquía: {str(e)}"
        }), 500

@api_bp.route('/gerentes/mis-asesores', methods=['GET'])
@role_required('gerente')
def get_gerentes_mis_asesores():
    """
    Devuelve asesores asignados al gerente actual.
    Solo para usuarios con rol 'gerente'.
    """
    try:
        # Validación jerárquica adicional
        if not validate_hierarchical_permissions(current_user, 'view_mis_asesores'):
            return jsonify({
                "success": False,
                "message": "No tienes permisos para ver asesores"
            }), 403
        
        current_app.logger.info(f"Gerente {current_user.id} consultando sus asesores")
        
        # Usar el método existente en el modelo Usuario
        mis_asesores = current_user.get_mis_asesores()
        
        return jsonify({
            "success": True,
            "gerente": current_user.serialize(),
            "asesores": [asesor.serialize() for asesor in mis_asesores],
            "total_asesores": len(mis_asesores)
        })
        
    except Exception as e:
        current_app.logger.error(f"Error obteniendo asesores del gerente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error obteniendo asesores: {str(e)}"
        }), 500

@api_bp.route('/gerentes/asignar-asesor', methods=['POST'])
@admin_required
def asignar_gerentes_asesor():
    """
    Asigna un asesor a un gerente específico.
    Solo para administradores.
    Body: {"gerente_id": int, "asesor_id": int}
    """
    try:
        # Validación jerárquica adicional
        if not validate_hierarchical_permissions(current_user, 'assign_asesor'):
            return jsonify({
                "success": False,
                "message": "No tienes permisos para asignar asesores"
            }), 403
        
        data = request.get_json()
        
        if not data or 'gerente_id' not in data or 'asesor_id' not in data:
            return jsonify({
                "success": False,
                "message": "gerente_id y asesor_id son requeridos"
            }), 400
        
        gerente_id = data['gerente_id']
        asesor_id = data['asesor_id']
        
        # Validaciones de negocio
        gerente = Usuario.query.get(gerente_id)
        asesor = Usuario.query.get(asesor_id)
        
        if not gerente or gerente.rol != 'gerente' or not gerente.is_active:
            return jsonify({
                "success": False,
                "message": "Gerente no válido o inactivo"
            }), 400
        
        if not asesor or asesor.rol != 'asesor' or not asesor.is_active:
            return jsonify({
                "success": False,
                "message": "Asesor no válido o inactivo"
            }), 400
        
        # Verificar si el asesor ya tiene gerente
        if asesor.gerente_id and asesor.gerente_id != gerente_id:
            gerente_actual = Usuario.query.get(asesor.gerente_id)
            return jsonify({
                "success": False,
                "message": f"El asesor ya está asignado al gerente {gerente_actual.nombre if gerente_actual else 'desconocido'}"
            }), 400
        
        # Asignar asesor al gerente
        result = gerente.asignar_asesor(asesor_id)
        
        if not result:
            return jsonify({
                "success": False,
                "message": "No se pudo realizar la asignación"
            }), 400
        
        current_app.logger.info(f"Admin {current_user.id} asignó asesor {asesor_id} al gerente {gerente_id}")
        
        return jsonify({
            "success": True,
            "message": f"Asesor {asesor.nombre or asesor.email} asignado exitosamente al gerente {gerente.nombre or gerente.email}",
            "asesor": asesor.serialize(),
            "gerente": gerente.serialize()
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error asignando asesor a gerente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error en asignación: {str(e)}"
        }), 500

@api_bp.route('/gerentes/redistribuir-reclutas', methods=['POST'])
@role_required('gerente')
def redistribuir_reclutas_gerente():
    """
    Permite al gerente redistribuir SUS reclutas a SUS asesores.
    Solo puede asignar a sus propios asesores.
    Body: {"recluta_ids": [list], "asesor_id": int}
    """
    try:
        data = request.get_json()
        
        if not data or 'recluta_ids' not in data or 'asesor_id' not in data:
            return jsonify({
                "success": False,
                "message": "recluta_ids y asesor_id son requeridos"
            }), 400
        
        recluta_ids = data['recluta_ids']
        asesor_id = data['asesor_id']
        
        if not isinstance(recluta_ids, list) or not recluta_ids:
            return jsonify({
                "success": False,
                "message": "recluta_ids debe ser una lista no vacía"
            }), 400
        
        # Validación jerárquica adicional
        if not validate_hierarchical_permissions(current_user, 'redistribute_to_asesor', asesor_id):
            return jsonify({
                "success": False,
                "message": "No tienes permisos para redistribuir a este asesor"
            }), 403
        
        # Validar que el asesor destino pertenece al gerente actual
        if not current_user.validate_hierarchical_assignment(asesor_id):
            return jsonify({
                "success": False,
                "message": "No tienes permisos para asignar reclutas a este asesor"
            }), 403
        
        # Validar que todos los reclutas pertenecen al gerente actual
        reclutas = Recluta.query.filter(Recluta.id.in_(recluta_ids)).all()
        
        if len(reclutas) != len(recluta_ids):
            return jsonify({
                "success": False,
                "message": "Algunos reclutas no fueron encontrados"
            }), 404
        
        # Verificar ownership de todos los reclutas
        for recluta in reclutas:
            if not current_user.puede_ver_recluta(recluta):
                return jsonify({
                    "success": False,
                    "message": f"No tienes permisos para redistribuir el recluta {recluta.nombre}"
                }), 403
        
        # Realizar la redistribución
        redistribuidos = 0
        for recluta in reclutas:
            recluta.asesor_id = asesor_id
            redistribuidos += 1
        
        db.session.commit()
        
        asesor = Usuario.query.get(asesor_id)
        current_app.logger.info(f"Gerente {current_user.id} redistribuyó {redistribuidos} reclutas al asesor {asesor_id}")
        
        return jsonify({
            "success": True,
            "message": f"{redistribuidos} reclutas redistribuidos exitosamente a {asesor.nombre or asesor.email}",
            "redistribuidos": redistribuidos,
            "asesor": asesor.serialize(),
            "reclutas": [r.serialize() for r in reclutas]
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error redistribuyendo reclutas del gerente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error en redistribución: {str(e)}"
        }), 500



@api_bp.route('/gerentes/mis-asesores', methods=['GET'])
@gerente_required
def get_my_asesores():
    """Devuelve los asesores asignados al gerente que realiza la petición."""
    try:
        # El decorador @gerente_required ya nos da el usuario en current_user
        asesores = [asesor.to_dict(rules=('-gerente', '-reclutas_asignados')) for asesor in current_user.asesores if asesor.is_active]
        return jsonify({'success': True, 'asesores': asesores})

    except Exception as e:
        current_app.logger.error(f"Error al obtener mis asesores: {str(e)}")
        return jsonify({'success': False, 'message': f'Error interno: {str(e)}'}), 500


@api_bp.route('/gerentes/reasignar-asesor', methods=['POST'])
@admin_required
def reasignar_asesor_gerente():
    """
    Reasigna un asesor de un gerente a otro.
    Solo para administradores.
    Body: {"asesor_id": int, "nuevo_gerente_id": int}
    """
    try:
        data = request.get_json()
        asesor_id = data.get('asesor_id')
        nuevo_gerente_id = data.get('nuevo_gerente_id')

        if not asesor_id or not nuevo_gerente_id:
            return jsonify({"success": False, "message": "asesor_id y nuevo_gerente_id son requeridos"}), 400

        asesor = Usuario.query.get(asesor_id)
        nuevo_gerente = Usuario.query.get(nuevo_gerente_id)

        if not asesor or asesor.rol != 'asesor':
            return jsonify({"success": False, "message": "Asesor no válido"}), 404
        
        if not nuevo_gerente or nuevo_gerente.rol != 'gerente':
            return jsonify({"success": False, "message": "Nuevo gerente no válido"}), 404

        gerente_anterior_id = asesor.gerente_id
        asesor.gerente_id = nuevo_gerente_id
        db.session.commit()

        gerente_anterior = Usuario.query.get(gerente_anterior_id) if gerente_anterior_id else None
        
        current_app.logger.info(f"Admin {current_user.id} reasignó asesor {asesor_id} del gerente {gerente_anterior_id} al gerente {nuevo_gerente_id}")

        return jsonify({
            "success": True,
            "message": f"Asesor {asesor.nombre} reasignado de {gerente_anterior.nombre if gerente_anterior else 'Sin Asignar'} a {nuevo_gerente.nombre}"
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error reasignando asesor: {str(e)}")
        return jsonify({"success": False, "message": f"Error en reasignación: {str(e)}"}), 500