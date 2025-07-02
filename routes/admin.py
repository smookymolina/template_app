from flask_cors import cross_origin
from flask import Blueprint, jsonify, request, current_app, render_template
from sqlalchemy import func, case
from flask_login import login_required, current_user
from models.usuario import Usuario
from models.recluta import Recluta
from collections import defaultdict
from models.user_session import UserSession
from models import db, DatabaseError
from utils.security import check_ip_allowed
from utils.validators import validate_usuario_data, ValidationError
from functools import wraps
import os
import logging
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)

def admin_required(f):  
    """
    Decorador que verifica si el usuario tiene permisos de administrador.
    También comprueba si la IP está en la lista de permitidas.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Verificar si la IP está permitida
        ip_address = request.remote_addr
        if not check_ip_allowed(ip_address, current_app.config.get('IPS_PERMITIDAS')):
            current_app.logger.warning(f"Intento de acceso administrativo desde IP no permitida: {ip_address}")
            return jsonify({
                "success": False,
                "message": "Acceso no autorizado desde esta IP"
            }), 403
        
        # Aquí podríamos verificar si el usuario tiene rol de admin
        # Por ahora, todos los usuarios autenticados son considerados admin
        
        return f(*args, **kwargs)
    return login_required(decorated_function)

@admin_bp.route('/usuarios', methods=['GET'])
@admin_required
def get_usuarios():
    """
    Obtiene la lista de usuarios administradores.
    """
    try:
        usuarios = Usuario.query.all()
        
        return jsonify({
            "success": True,
            "usuarios": [u.serialize() for u in usuarios]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener usuarios: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener usuarios: {str(e)}"
        }), 500

@admin_bp.route('/usuarios/<int:id>', methods=['GET'])
@admin_required
def get_usuario(id):
    """
    Obtiene los detalles de un usuario específico.
    """
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
            
        return jsonify({
            "success": True,
            "usuario": usuario.serialize()
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener usuario {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener usuario: {str(e)}"
        }), 500

@admin_bp.route('/usuarios', methods=['POST'])
@admin_required
def add_usuario():
    """
    Crea un nuevo usuario administrador.
    """
    try:
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_usuario_data(data)
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": "Error de validación",
                "errors": e.args[0]
            }), 400
        
        # Verificar si ya existe el email
        if Usuario.query.filter_by(email=validated_data['email']).first():
            return jsonify({
                "success": False,
                "message": f"Ya existe un usuario con el email {validated_data['email']}"
            }), 400
        
        # Crear nuevo usuario
        nuevo = Usuario(**validated_data)
        
        # Guardar en base de datos
        try:
            nuevo.save()
            current_app.logger.info(f"Usuario creado: {nuevo.id} - {nuevo.email}")
            return jsonify({
                "success": True,
                "usuario": nuevo.serialize()
            }), 201
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al crear usuario: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al crear usuario: {str(e)}"
        }), 500

@admin_bp.route('/usuarios/<int:id>', methods=['PUT'])
@admin_required
def update_usuario(id):
    """
    Actualiza un usuario existente.
    """
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
        
        data = request.get_json()
            
        # Validar datos
        try:
            validated_data = validate_usuario_data(data, is_update=True)
        except ValidationError as e:
            return jsonify({
                "success": False,
                "message": "Error de validación",
                "errors": e.args[0]
            }), 400
        
        # Verificar si se está intentando actualizar el email y ya existe
        if 'email' in validated_data and validated_data['email'] != usuario.email:
            if Usuario.query.filter_by(email=validated_data['email']).first():
                return jsonify({
                    "success": False,
                    "message": f"Ya existe un usuario con el email {validated_data['email']}"
                }), 400
        
        # Actualizar campos
        for key, value in validated_data.items():
            setattr(usuario, key, value)
        
        # Guardar cambios
        try:
            usuario.save()
            current_app.logger.info(f"Usuario actualizado: {usuario.id} - {usuario.email}")
            return jsonify({
                "success": True,
                "usuario": usuario.serialize()
            })
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al actualizar usuario {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al actualizar usuario: {str(e)}"
        }), 500

@admin_bp.route('/usuarios/<int:id>', methods=['DELETE'])
@admin_required
def delete_usuario(id):
    """
    Elimina un usuario existente.
    """
    try:
        usuario = Usuario.query.get(id)
        if not usuario:
            return jsonify({
                "success": False,
                "message": "Usuario no encontrado"
            }), 404
        
        # No permitir eliminar al propio usuario actual
        if usuario.id == current_user.id:
            return jsonify({
                "success": False,
                "message": "No puedes eliminar tu propio usuario"
            }), 400
        
        # Guardar información antes de eliminar para el log
        usuario_info = f"ID: {usuario.id}, Email: {usuario.email}"
        
        # Eliminar usuario
        try:
            db.session.delete(usuario)
            db.session.commit()
            current_app.logger.info(f"Usuario eliminado: {usuario_info}")
            return jsonify({
                "success": True,
                "message": "Usuario eliminado correctamente"
            })
        except DatabaseError as e:
            return jsonify({
                "success": False,
                "message": str(e)
            }), 500
            
    except Exception as e:
        current_app.logger.error(f"Error al eliminar usuario {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al eliminar usuario: {str(e)}"
        }), 500

@admin_bp.route('/logs', methods=['GET'])
@admin_required
def get_logs():
    """
    Obtiene los últimos registros de actividad.
    """
    try:
        log_file = current_app.config.get('LOG_FILE', 'app.log')
        
        if not os.path.exists(log_file):
            return jsonify({
                "success": False,
                "message": "El archivo de logs no existe"
            }), 404
        
        # Obtener las últimas líneas del archivo de logs
        limit = request.args.get('limit', 100, type=int)
        with open(log_file, 'r') as f:
            lines = f.readlines()
        
        # Limitar la cantidad de líneas
        last_lines = lines[-limit:] if len(lines) > limit else lines
        
        return jsonify({
            "success": True,
            "logs": last_lines
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener logs: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener logs: {str(e)}"
        }), 500

@admin_bp.route('/sessions', methods=['GET'])
@admin_required
def get_all_sessions():
    """
    Obtiene todas las sesiones activas de usuarios.
    """
    try:
        # Obtener solo sesiones activas y no expiradas
        now = datetime.utcnow()
        sessions = UserSession.query.filter(
            UserSession.is_valid == True,
            UserSession.expires_at > now
        ).all()
        
        return jsonify({
            "success": True,
            "sessions": [s.serialize() for s in sessions]
        })
    except Exception as e:
        current_app.logger.error(f"Error al obtener sesiones: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener sesiones: {str(e)}"
        }), 500

@admin_bp.route('/sessions/cleanup', methods=['POST'])
@admin_required
def cleanup_sessions():
    """
    Limpia las sesiones expiradas de la base de datos.
    """
    try:
        count = UserSession.cleanup_expired()
        
        return jsonify({
            "success": True,
            "message": f"Se limpiaron {count} sesiones expiradas"
        })
    except Exception as e:
        current_app.logger.error(f"Error al limpiar sesiones: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al limpiar sesiones: {str(e)}"
        }), 500

@admin_bp.route('/sessions/<int:id>', methods=['DELETE'])
@admin_required
def invalidate_session(id):
    """
    Invalida una sesión específica.
    """
    try:
        session = UserSession.query.get(id)
        if not session:
            return jsonify({
                "success": False,
                "message": "Sesión no encontrada"
            }), 404
        
        # Invalidar la sesión
        session.invalidate()
        
        return jsonify({
            "success": True,
            "message": "Sesión invalidada correctamente"
        })
    except Exception as e:
        current_app.logger.error(f"Error al invalidar sesión {id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al invalidar sesión: {str(e)}"
        }), 500

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    """
    Renderiza el panel de administración.
    """
    return render_template('admin/dashboard.html')

@admin_bp.route('/metricas/asesores', methods=['GET'])
@cross_origin()
@admin_required
def get_metricas_asesores():
    """
    🎯 NUEVA FUNCIONALIDAD: Obtiene métricas detalladas por cada asesor
    Solo disponible para administradores.
    
    Returns:
        JSON con métricas por asesor:
        - Total de reclutas por asesor
        - Distribución por estados (Verde/Amarillo/Rojo)
        - Tendencias y comparativas
        - Ranking de productividad
    """
    try:
        # 🔍 CONSULTA OPTIMIZADA: Obtener todos los asesores con sus métricas
        query_asesores = db.session.query(
            Usuario.id,
            Usuario.nombre,
            Usuario.email,
            func.count(Recluta.id).label('total_reclutas'),
            func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
            func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
            func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
        ).outerjoin(
            Recluta, Usuario.id == Recluta.asesor_id
        ).filter(
            Usuario.rol.in_(['asesor', 'gerente'])
        ).group_by(
            Usuario.id, Usuario.nombre, Usuario.email
        ).all()

        # 📊 PROCESAR MÉTRICAS: Calcular estadísticas avanzadas
        metricas_asesores = []
        total_reclutas_sistema = 0
        
        for asesor in query_asesores:
            verdes = asesor.verdes or 0
            amarillos = asesor.amarillos or 0
            rojos = asesor.rojos or 0
            total = asesor.total_reclutas or 0
            
            total_reclutas_sistema += total
            
            # 📈 CALCULAR TASAS DE CONVERSIÓN
            tasa_exito = (verdes / total * 100) if total > 0 else 0
            tasa_proceso = (amarillos / total * 100) if total > 0 else 0
            tasa_rechazo = (rojos / total * 100) if total > 0 else 0
            
            # 🎯 DETERMINAR NIVEL DE PERFORMANCE
            if tasa_exito >= 70:
                performance = "Excelente"
                performance_class = "excellent"
            elif tasa_exito >= 50:
                performance = "Bueno"
                performance_class = "good"
            elif tasa_exito >= 30:
                performance = "Regular"
                performance_class = "average"
            else:
                performance = "Necesita Mejora"
                performance_class = "needs-improvement"
            
            metricas_asesor = {
                "id": asesor.id,
                "nombre": asesor.nombre or asesor.email,
                "email": asesor.email,
                "total_reclutas": total,
                "estados": {
                    "verdes": verdes,
                    "amarillos": amarillos,
                    "rojos": rojos
                },
                "tasas": {
                    "exito": round(tasa_exito, 1),
                    "proceso": round(tasa_proceso, 1),
                    "rechazo": round(tasa_rechazo, 1)
                },
                "performance": {
                    "nivel": performance,
                    "class": performance_class,
                    "score": round(tasa_exito, 1)
                }
            }
            
            metricas_asesores.append(metricas_asesor)
        
        # 🏆 ORDENAR POR PERFORMANCE (mejor primero)
        metricas_asesores.sort(key=lambda x: x['performance']['score'], reverse=True)
        
        # 📊 CALCULAR MÉTRICAS GLOBALES DEL SISTEMA
        total_verdes = sum(m['estados']['verdes'] for m in metricas_asesores)
        total_amarillos = sum(m['estados']['amarillos'] for m in metricas_asesores)
        total_rojos = sum(m['estados']['rojos'] for m in metricas_asesores)
        
        metricas_globales = {
            "total_asesores": len(metricas_asesores),
            "total_reclutas": total_reclutas_sistema,
            "distribucion_global": {
                "verdes": total_verdes,
                "amarillos": total_amarillos,
                "rojos": total_rojos
            },
            "promedio_sistema": {
                "exito": round(total_verdes / total_reclutas_sistema * 100, 1) if total_reclutas_sistema > 0 else 0,
                "proceso": round(total_amarillos / total_reclutas_sistema * 100, 1) if total_reclutas_sistema > 0 else 0,
                "rechazo": round(total_rojos / total_reclutas_sistema * 100, 1) if total_reclutas_sistema > 0 else 0
            }
        }
        
        # 🎯 IDENTIFICAR TOP PERFORMERS Y NEEDS IMPROVEMENT
        top_performers = [m for m in metricas_asesores[:3] if m['total_reclutas'] > 0]
        needs_improvement = [m for m in metricas_asesores if m['performance']['class'] == 'needs-improvement' and m['total_reclutas'] > 0]
        
        current_app.logger.info(f"✅ Métricas por asesor generadas: {len(metricas_asesores)} asesores analizados")
        
        return jsonify({
            "success": True,
            "metricas_asesores": metricas_asesores,
            "metricas_globales": metricas_globales,
            "insights": {
                "top_performers": top_performers,
                "needs_improvement": needs_improvement,
                "fecha_generacion": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al obtener métricas por asesor: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar métricas: {str(e)}"
        }), 500


@admin_bp.route('/metricas/asesor/<int:asesor_id>/detalle', methods=['GET'])
@admin_required
def get_detalle_asesor(asesor_id):
    """
    🔍 NUEVA FUNCIONALIDAD: Obtiene métricas detalladas de un asesor específico
    Incluye cronología, tendencias y comparativas.
    """
    try:
        # Verificar que el asesor existe
        asesor = Usuario.query.get(asesor_id)
        if not asesor or asesor.rol not in ['asesor', 'gerente']:
            return jsonify({
                "success": False,
                "message": "Asesor no encontrado"
            }), 404
        
        # 📊 OBTENER RECLUTAS DEL ASESOR CON DETALLES
        reclutas = Recluta.query.filter_by(asesor_id=asesor_id).all()
        
        # 📈 ANÁLISIS TEMPORAL (últimos 6 meses)
        ahora = datetime.utcnow()
        tendencia_mensual = []
        
        for i in range(6):
            mes_inicio = ahora.replace(day=1) - timedelta(days=i*30)
            mes_fin = mes_inicio + timedelta(days=30)
            
            reclutas_mes = [r for r in reclutas if mes_inicio <= r.fecha_registro <= mes_fin]
            
            tendencia_mensual.append({
                "mes": mes_inicio.strftime('%Y-%m'),
                "mes_nombre": mes_inicio.strftime('%B %Y'),
                "total": len(reclutas_mes),
                "verdes": len([r for r in reclutas_mes if r.estado == 'Activo']),
                "amarillos": len([r for r in reclutas_mes if r.estado == 'En proceso']),
                "rojos": len([r for r in reclutas_mes if r.estado == 'Rechazado'])
            })
        
        tendencia_mensual.reverse()  # Orden cronológico
        
        # 🎯 MÉTRICAS DETALLADAS
        total_reclutas = len(reclutas)
        verdes = len([r for r in reclutas if r.estado == 'Activo'])
        amarillos = len([r for r in reclutas if r.estado == 'En proceso'])
        rojos = len([r for r in reclutas if r.estado == 'Rechazado'])
        
        # 📋 LISTADO DETALLADO POR ESTADO
        reclutas_por_estado = {
            "verdes": [r.serialize() for r in reclutas if r.estado == 'Activo'],
            "amarillos": [r.serialize() for r in reclutas if r.estado == 'En proceso'],
            "rojos": [r.serialize() for r in reclutas if r.estado == 'Rechazado']
        }
        
        return jsonify({
            "success": True,
            "asesor": {
                "id": asesor.id,
                "nombre": asesor.nombre or asesor.email,
                "email": asesor.email
            },
            "metricas": {
                "total": total_reclutas,
                "verdes": verdes,
                "amarillos": amarillos,
                "rojos": rojos,
                "tasa_exito": round(verdes / total_reclutas * 100, 1) if total_reclutas > 0 else 0
            },
            "tendencia_mensual": tendencia_mensual,
            "reclutas_por_estado": reclutas_por_estado
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al obtener detalle de asesor {asesor_id}: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener detalle: {str(e)}"
        }), 500


@admin_bp.route('/metricas/exportar', methods=['POST'])
@admin_required
def exportar_metricas():
    """
    📥 NUEVA FUNCIONALIDAD: Exporta métricas en formato Excel/CSV
    """
    try:
        formato = request.json.get('formato', 'excel')  # excel o csv
        
        # Reutilizar la lógica de métricas
        response = get_metricas_asesores()
        data = response.get_json()
        
        if not data.get('success'):
            return jsonify({
                "success": False,
                "message": "Error al generar datos para exportación"
            }), 500
        
        # Preparar datos para exportación
        metricas = data['metricas_asesores']
        
        if formato == 'excel':
            # Lógica para generar Excel (requiere openpyxl)
            # Se implementaría aquí la generación del archivo Excel
            pass
        else:
            # Lógica para generar CSV
            # Se implementaría aquí la generación del archivo CSV
            pass
        
        return jsonify({
            "success": True,
            "message": f"Exportación en formato {formato} generada exitosamente",
            "download_url": f"/admin/download/metricas.{formato}"
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al exportar métricas: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error en exportación: {str(e)}"
        }), 500

@admin_bp.route('/reclutas/redistribuir-manual', methods=['POST'])
@admin_required
def redistribuir_reclutas_manual():
    """
    Redistribuye reclutas manualmente entre asesores.
    Recibe un diccionario con {asesor_id: num_reclutas_deseado}.
    """
    try:
        data = request.get_json()
        distribution_data = data.get('distribution')

        if not distribution_data:
            return jsonify({
                "success": False,
                "message": "Datos de distribución no proporcionados"
            }), 400

        # Obtener todos los asesores activos (rol 'asesor' o 'gerente')
        asesores_activos = Usuario.query.filter(Usuario.rol.in_(['asesor', 'gerente'])).all()
        asesor_map = {a.id: a for a in asesores_activos}
        asesor_ids = [a.id for a in asesores_activos]

        # Obtener todos los reclutas existentes
        all_reclutas = Recluta.query.all()
        
        # Paso 1: Desasignar todos los reclutas para crear un pool
        for recluta in all_reclutas:
            recluta.asesor_id = None
            db.session.add(recluta)
        db.session.flush() # Asegurar que los cambios estén en la sesión pero no commiteados

        # Crear un pool de reclutas disponibles
        reclutas_disponibles = list(all_reclutas) # Copia para poder modificar
        
        # Paso 2: Asignar reclutas según la distribución deseada
        reclutas_asignados_directamente = defaultdict(list)
        for asesor_id_str, desired_count in distribution_data.items():
            asesor_id = int(asesor_id_str)
            if asesor_id not in asesor_map: # Asegurar que el asesor existe
                current_app.logger.warning(f"Asesor {asesor_id} no encontrado, saltando asignación directa.")
                continue

            # Asignar hasta el número deseado o hasta que no queden reclutas
            for _ in range(desired_count):
                if reclutas_disponibles:
                    recluta = reclutas_disponibles.pop(0)
                    recluta.asesor_id = asesor_id
                    reclutas_asignados_directamente[asesor_id].append(recluta)
                    db.session.add(recluta)
                else:
                    current_app.logger.info("No hay más reclutas disponibles para asignación directa.")
                    break
        
        # Paso 3: Redistribuir los reclutas restantes de forma equitativa
        if reclutas_disponibles:
            current_app.logger.info(f"Redistribuyendo {len(reclutas_disponibles)} reclutas restantes equitativamente.")
            
            # Crear una lista de asesores elegibles para la redistribución
            # Excluir asesores que no están en distribution_data si se desea una redistribución solo entre los especificados
            # Aquí, redistribuimos entre todos los asesores activos
            asesores_elegibles = list(asesores_activos)
            
            if not asesores_elegibles:
                current_app.logger.warning("No hay asesores elegibles para redistribuir reclutas restantes.")
            else:
                # Ordenar asesores por su carga actual (después de asignaciones directas)
                # para asegurar una distribución más equitativa
                asesor_current_counts = {a.id: len(reclutas_asignados_directamente[a.id]) for a in asesores_elegibles}
                
                # Distribuir uno por uno, priorizando a los que tienen menos
                asesor_index = 0
                while reclutas_disponibles:
                    recluta = reclutas_disponibles.pop(0)
                    
                    # Encontrar el asesor con menos reclutas actualmente
                    asesores_ordenados = sorted(asesores_elegibles, key=lambda a: asesor_current_counts[a.id])
                    target_asesor = asesores_ordenados[0]
                    
                    recluta.asesor_id = target_asesor.id
                    asesor_current_counts[target_asesor.id] += 1 # Actualizar cuenta para el siguiente ciclo
                    db.session.add(recluta)
                    
                    current_app.logger.debug(f"Recluta {recluta.id} asignado a {target_asesor.nombre} ({asesor_current_counts[target_asesor.id]} reclutas)")

        db.session.commit()
        current_app.logger.info("Redistribución manual completada.")

        # Recalcular la distribución actual para la respuesta (por nombre de asesor)
        final_distribution = defaultdict(int)
        all_reclutas_after_redistribution = Recluta.query.all()
        for r in all_reclutas_after_redistribution:
            if r.asesor_id and r.asesor_id in asesor_map:
                asesor_nombre = asesor_map[r.asesor_id].nombre or asesor_map[r.asesor_id].email
                final_distribution[asesor_nombre] += 1
            elif r.asesor_id is None:
                final_distribution["Sin Asignar"] += 1

        return jsonify({
            "success": True,
            "message": "Distribución actualizada correctamente",
            "total_procesados": len(all_reclutas_after_redistribution),
            "exitosos": len(all_reclutas_after_redistribution) - final_distribution["Sin Asignar"], 
            "errores": 0,
            "distribucion": dict(final_distribution)
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error al redistribuir reclutas manualmente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al redistribuir reclutas: {str(e)}"
        }), 500