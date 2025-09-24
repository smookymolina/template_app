from flask_cors import cross_origin
from flask import Blueprint, jsonify, request, current_app, render_template, make_response, url_for
from sqlalchemy import func, case
from flask_login import login_required, current_user
import io
import csv
from models.usuario import Usuario
from models.recluta import Recluta
from models.entrevista import Entrevista
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
        # ip_address = request.remote_addr
        # if not check_ip_allowed(ip_address, current_app.config.get('IPS_PERMITIDAS')):
        #     current_app.logger.warning(f"Intento de acceso administrativo desde IP no permitida: {ip_address}")
        #     return jsonify({
        #         "success": False,
        #         "message": "Acceso no autorizado desde esta IP"
        #     }), 403
        
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({"success": False, "message": "Acceso no autorizado"}), 403
        
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
        nuevo = Usuario(
            nombre=validated_data['nombre'],
            email=validated_data['email'],
            rol=validated_data.get('rol', 'user')
        )
        nuevo.password = data['password']
        
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

@admin_bp.route('/metricas/tendencias', methods=['GET'])
@admin_required
def get_metricas_tendencias():
    """
    NUEVA FUNCIONALIDAD: Obtiene tendencias temporales de reclutamiento.
    """
    try:
        periodo = request.args.get('periodo', 'mensual') # mensual, semanal
        now = datetime.utcnow()
        tendencia = []

        if periodo == 'mensual':
            # Analizar los últimos 6 meses
            for i in range(6):
                mes_inicio = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
                # Asegurar que el mes siguiente se calcule correctamente
                if mes_inicio.month == 12:
                    mes_fin = mes_inicio.replace(year=mes_inicio.year + 1, month=1, day=1)
                else:
                    mes_fin = mes_inicio.replace(month=mes_inicio.month + 1, day=1)

                query = db.session.query(
                    func.count(Recluta.id).label('total'),
                    func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
                    func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
                    func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
                ).filter(
                    Recluta.fecha_registro >= mes_inicio,
                    Recluta.fecha_registro < mes_fin
                ).first()

                tendencia.append({
                    "periodo": mes_inicio.strftime('%Y-%m'),
                    "periodo_nombre": mes_inicio.strftime('%B %Y'),
                    "total": query.total or 0,
                    "verdes": query.verdes or 0,
                    "amarillos": query.amarillos or 0,
                    "rojos": query.rojos or 0
                })
            tendencia.reverse()

        elif periodo == 'semanal':
            # Analizar las últimas 8 semanas
            for i in range(8):
                fin_semana = now - timedelta(weeks=i)
                inicio_semana = fin_semana - timedelta(days=6)

                query = db.session.query(
                    func.count(Recluta.id).label('total'),
                    func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
                    func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
                    func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
                ).filter(
                    Recluta.fecha_registro >= inicio_semana,
                    Recluta.fecha_registro <= fin_semana
                ).first()

                tendencia.append({
                    "periodo": inicio_semana.strftime('%Y-%W'),
                    "periodo_nombre": f"Semana del {inicio_semana.strftime('%d %b')} al {fin_semana.strftime('%d %b')}",
                    "total": query.total or 0,
                    "verdes": query.verdes or 0,
                    "amarillos": query.amarillos or 0,
                    "rojos": query.rojos or 0
                })
            tendencia.reverse()

        return jsonify({
            "success": True,
            "tendencia": tendencia
        })

    except Exception as e:
        current_app.logger.error(f"Error al obtener tendencias: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar tendencias: {str(e)}"
        }), 500

@admin_bp.route('/metricas/equipos', methods=['GET'])
@cross_origin()
@admin_required
def get_metricas_equipos():
    """
    🎯 NUEVA FUNCIONALIDAD: Obtiene métricas detalladas por gerentes y sus equipos
    Solo disponible para administradores.

    Returns:
        JSON con métricas jerárquicas:
        - Métricas por gerente y sus asesores
        - Comparativas de equipos
        - Rankings consolidados
    """
    try:
        # Obtener métricas de gerentes con sus equipos
        gerentes_metricas = []
        asesores_sin_gerente = []

        # 1. Procesar Gerentes y sus equipos
        gerentes = Usuario.query.filter_by(rol='gerente').all()
        for gerente in gerentes:
            # Métricas del gerente
            gerente_reclutas = db.session.query(
                func.count(Recluta.id).label('total'),
                func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
                func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
                func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
            ).filter(Recluta.asesor_id == gerente.id).first()

            # Métricas de sus asesores
            asesores_ids = [a.id for a in gerente.asesores]
            equipo_metricas = []
            total_equipo = 0
            verdes_equipo = 0
            amarillos_equipo = 0
            rojos_equipo = 0

            if asesores_ids:
                equipo_query = db.session.query(
                    Usuario.id,
                    Usuario.nombre,
                    func.count(Recluta.id).label('total'),
                    func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
                    func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
                    func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
                ).outerjoin(
                    Recluta, Usuario.id == Recluta.asesor_id
                ).filter(
                    Usuario.id.in_(asesores_ids)
                ).group_by(Usuario.id, Usuario.nombre).all()

                for asesor_data in equipo_query:
                    asesor_verdes = asesor_data.verdes or 0
                    asesor_amarillos = asesor_data.amarillos or 0
                    asesor_rojos = asesor_data.rojos or 0
                    asesor_total = asesor_data.total or 0

                    total_equipo += asesor_total
                    verdes_equipo += asesor_verdes
                    amarillos_equipo += asesor_amarillos
                    rojos_equipo += asesor_rojos

                    equipo_metricas.append({
                        'id': asesor_data.id,
                        'nombre': asesor_data.nombre,
                        'total': asesor_total,
                        'verdes': asesor_verdes,
                        'amarillos': asesor_amarillos,
                        'rojos': asesor_rojos,
                        'tasa_exito': (asesor_verdes / asesor_total * 100) if asesor_total > 0 else 0
                    })

            # Métricas consolidadas del gerente (propias + equipo)
            gerente_total = (gerente_reclutas.total or 0) + total_equipo
            gerente_verdes_total = (gerente_reclutas.verdes or 0) + verdes_equipo
            gerente_amarillos_total = (gerente_reclutas.amarillos or 0) + amarillos_equipo
            gerente_rojos_total = (gerente_reclutas.rojos or 0) + rojos_equipo

            gerentes_metricas.append({
                'id': gerente.id,
                'nombre': gerente.nombre,
                'email': gerente.email,
                'rol': 'gerente',
                'metricas_propias': {
                    'total': gerente_reclutas.total or 0,
                    'verdes': gerente_reclutas.verdes or 0,
                    'amarillos': gerente_reclutas.amarillos or 0,
                    'rojos': gerente_reclutas.rojos or 0
                },
                'metricas_equipo': {
                    'total': total_equipo,
                    'verdes': verdes_equipo,
                    'amarillos': amarillos_equipo,
                    'rojos': rojos_equipo,
                    'total_asesores': len(equipo_metricas)
                },
                'metricas_consolidadas': {
                    'total': gerente_total,
                    'verdes': gerente_verdes_total,
                    'amarillos': gerente_amarillos_total,
                    'rojos': gerente_rojos_total,
                    'tasa_exito': (gerente_verdes_total / gerente_total * 100) if gerente_total > 0 else 0
                },
                'equipo_detalle': equipo_metricas
            })

        # 2. Asesores sin gerente asignado
        asesores_independientes = db.session.query(
            Usuario.id,
            Usuario.nombre,
            Usuario.email,
            func.count(Recluta.id).label('total'),
            func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
            func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
            func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
        ).outerjoin(
            Recluta, Usuario.id == Recluta.asesor_id
        ).filter(
            Usuario.rol == 'asesor',
            Usuario.gerente_id.is_(None)
        ).group_by(Usuario.id, Usuario.nombre, Usuario.email).all()

        for asesor in asesores_independientes:
            asesores_sin_gerente.append({
                'id': asesor.id,
                'nombre': asesor.nombre,
                'email': asesor.email,
                'rol': 'asesor',
                'total': asesor.total or 0,
                'verdes': asesor.verdes or 0,
                'amarillos': asesor.amarillos or 0,
                'rojos': asesor.rojos or 0,
                'tasa_exito': ((asesor.verdes or 0) / (asesor.total or 1) * 100) if (asesor.total or 0) > 0 else 0
            })

        return jsonify({
            "success": True,
            "gerentes_equipos": gerentes_metricas,
            "asesores_independientes": asesores_sin_gerente,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f"❌ Error al generar métricas de equipos: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar métricas de equipos: {str(e)}"
        }), 500

@admin_bp.route('/metricas/gerentes', methods=['GET'])
@cross_origin()
@admin_required
def get_metricas_gerentes():
    """
    🎯 NUEVA FUNCIONALIDAD: Obtiene métricas específicas de gerentes para el dashboard
    Solo disponible para administradores.

    Returns:
        JSON con métricas optimizadas para dashboard de gerentes:
        - Ranking de gerentes por performance
        - Comparativas de equipos
        - Insights de gestión de equipos
    """
    try:
        gerentes = Usuario.query.filter_by(rol='gerente').all()
        gerentes_ranking = []

        for gerente in gerentes:
            # Métricas propias del gerente
            gerente_stats = db.session.query(
                func.count(Recluta.id).label('total_propio'),
                func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes_propio'),
                func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos_propio'),
                func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos_propio')
            ).filter(Recluta.asesor_id == gerente.id).first()

            # Métricas del equipo
            asesores_ids = [a.id for a in gerente.asesores]
            equipo_stats = {'total': 0, 'verdes': 0, 'amarillos': 0, 'rojos': 0}

            if asesores_ids:
                equipo_query = db.session.query(
                    func.count(Recluta.id).label('total'),
                    func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
                    func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
                    func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
                ).filter(Recluta.asesor_id.in_(asesores_ids)).first()

                equipo_stats = {
                    'total': equipo_query.total or 0,
                    'verdes': equipo_query.verdes or 0,
                    'amarillos': equipo_query.amarillos or 0,
                    'rojos': equipo_query.rojos or 0
                }

            # Consolidar métricas
            total_consolidado = (gerente_stats.total_propio or 0) + equipo_stats['total']
            verdes_consolidado = (gerente_stats.verdes_propio or 0) + equipo_stats['verdes']

            # Calcular KPIs de liderazgo
            tasa_exito_consolidada = (verdes_consolidado / total_consolidado * 100) if total_consolidado > 0 else 0
            eficiencia_equipo = (equipo_stats['verdes'] / equipo_stats['total'] * 100) if equipo_stats['total'] > 0 else 0

            # Clasificar performance de liderazgo
            if tasa_exito_consolidada >= 80:
                nivel_liderazgo = 'Excepcional'
                color_liderazgo = '#059669'
            elif tasa_exito_consolidada >= 60:
                nivel_liderazgo = 'Bueno'
                color_liderazgo = '#10B981'
            elif tasa_exito_consolidada >= 40:
                nivel_liderazgo = 'Regular'
                color_liderazgo = '#F59E0B'
            else:
                nivel_liderazgo = 'Necesita Apoyo'
                color_liderazgo = '#EF4444'

            gerentes_ranking.append({
                'id': gerente.id,
                'nombre': gerente.nombre,
                'email': gerente.email,
                'total_asesores': len(asesores_ids),
                'metricas_propias': {
                    'total': gerente_stats.total_propio or 0,
                    'verdes': gerente_stats.verdes_propio or 0,
                    'amarillos': gerente_stats.amarillos_propio or 0,
                    'rojos': gerente_stats.rojos_propio or 0
                },
                'metricas_equipo': equipo_stats,
                'consolidado': {
                    'total': total_consolidado,
                    'verdes': verdes_consolidado,
                    'tasa_exito': round(tasa_exito_consolidada, 2)
                },
                'kpis_liderazgo': {
                    'eficiencia_equipo': round(eficiencia_equipo, 2),
                    'nivel': nivel_liderazgo,
                    'color': color_liderazgo,
                    'score_liderazgo': round((tasa_exito_consolidada + eficiencia_equipo) / 2, 2)
                }
            })

        # Ordenar por score de liderazgo
        gerentes_ranking.sort(key=lambda x: x['kpis_liderazgo']['score_liderazgo'], reverse=True)

        # Insights de gerentes
        insights = {
            'top_gerente': gerentes_ranking[0] if gerentes_ranking else None,
            'total_gerentes': len(gerentes_ranking),
            'gerentes_excelentes': len([g for g in gerentes_ranking if g['kpis_liderazgo']['nivel'] == 'Excepcional']),
            'gerentes_necesitan_apoyo': len([g for g in gerentes_ranking if g['kpis_liderazgo']['nivel'] == 'Necesita Apoyo']),
            'promedio_eficiencia': sum([g['kpis_liderazgo']['eficiencia_equipo'] for g in gerentes_ranking]) / len(gerentes_ranking) if gerentes_ranking else 0
        }

        return jsonify({
            "success": True,
            "gerentes_ranking": gerentes_ranking,
            "insights_gerentes": insights,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        current_app.logger.error(f"❌ Error al generar métricas de gerentes: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar métricas de gerentes: {str(e)}"
        }), 500

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


@admin_bp.route('/test-user-creation', methods=['GET'])
@admin_required
def test_user_creation():
    """
    Temporal: Crea un usuario de prueba y verifica el login.
    """
    test_email = "test_user@example.com"
    test_password = "test_password_123"
    
    # 1. Eliminar usuario de prueba si ya existe
    existing_user = Usuario.query.filter_by(email=test_email).first()
    if existing_user:
        try:
            db.session.delete(existing_user)
            db.session.commit()
            current_app.logger.info(f"Usuario de prueba existente {test_email} eliminado.")
        except Exception as e:
            db.session.rollback()
            return jsonify({"success": False, "message": f"Error al eliminar usuario de prueba existente: {str(e)}"}), 500

    # 2. Crear nuevo usuario de prueba
    try:
        new_user = Usuario(nombre="Test User", email=test_email, rol="user")
        new_user.password = test_password
        new_user.save()
        current_app.logger.info(f"Usuario de prueba {test_email} creado exitosamente.")
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Error al crear usuario de prueba: {str(e)}"}), 500

    # 3. Intentar iniciar sesión con el nuevo usuario
    try:
        user_to_login = Usuario.query.filter_by(email=test_email).first()
        if user_to_login and user_to_login.check_password(test_password):
            # No llamamos a login_user aquí para no afectar la sesión actual del admin
            # Solo verificamos que las credenciales son correctas
            current_app.logger.info(f"Login de prueba para {test_email} exitoso (credenciales válidas).")
            return jsonify({
                "success": True,
                "message": "Usuario de prueba creado y credenciales verificadas exitosamente.",
                "user_created": True,
                "login_verified": True,
                "user_email": test_email
            }), 200
        else:
            current_app.logger.warning(f"Login de prueba para {test_email} fallido (credenciales inválidas).")
            return jsonify({
                "success": False,
                "message": "Usuario de prueba creado pero el login de prueba falló.",
                "user_created": True,
                "login_verified": False,
                "user_email": test_email
            }), 401
    except Exception as e:
        current_app.logger.error(f"Error durante la verificación de login de prueba: {str(e)}")
        return jsonify({"success": False, "message": f"Error interno durante la verificación de login: {str(e)}"}), 500


@admin_bp.route('/metricas/exportar', methods=['POST'])
@admin_required
def exportar_metricas():
    """
    📥 NUEVA FUNCIONALIDAD: Exporta métricas en formato CSV
    """
    try:
        # Obtener los datos de las métricas
        response = get_metricas_asesores()
        data = response.get_json()
        
        if not data.get('success'):
            return jsonify({
                "success": False,
                "message": "Error al generar datos para exportación"
            }), 500
        
        metricas = data['metricas_asesores']
        
        # Crear un archivo CSV en memoria
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Escribir la cabecera
        writer.writerow([
            'ID Asesor', 'Nombre', 'Email', 'Total Reclutas', 'Activos', 'En Proceso', 'Rechazados',
            'Tasa de Éxito (%)', 'Tasa en Proceso (%)', 'Tasa de Rechazo (%)', 'Nivel de Performance'
        ])
        
        # Escribir los datos de cada asesor
        for asesor in metricas:
            writer.writerow([
                asesor['id'],
                asesor['nombre'],
                asesor['email'],
                asesor['total_reclutas'],
                asesor['estados']['verdes'],
                asesor['estados']['amarillos'],
                asesor['estados']['rojos'],
                asesor['tasas']['exito'],
                asesor['tasas']['proceso'],
                asesor['tasas']['rechazo'],
                asesor['performance']['nivel']
            ])
        
        # Preparar la respuesta para descargar el archivo
        output.seek(0)
        response = make_response(output.getvalue())
        response.headers["Content-Disposition"] = "attachment; filename=metricas_asesores.csv"
        response.headers["Content-type"] = "text/csv"
        
        current_app.logger.info(f"✅ Exportación de métricas generada por {current_user.email}")
        return response
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al exportar métricas: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error en exportación: {str(e)}"
        }), 500

@admin_bp.route('/metricas/dashboard-unificado', methods=['GET'])
@admin_required
def get_dashboard_unificado():
    """
    🎯 NUEVO ENDPOINT UNIFICADO: Dashboard consolidado de métricas administrativas
    Combina datos de equipos, gerentes, asesores y tendencias en una sola respuesta optimizada.

    Returns:
        JSON unificado con todas las métricas necesarias para el dashboard admin
    """
    try:
        # 📊 OBTENER DATOS CONSOLIDADOS
        dashboard_data = {
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0-unified"
        }

        # 1. MÉTRICAS GLOBALES DEL SISTEMA
        dashboard_data["global_kpis"] = _get_global_kpis()

        # 2. ESTRUCTURA JERÁRQUICA COMPLETA
        dashboard_data["jerarquia"] = _get_jerarquia_optimizada()

        # 3. MÉTRICAS DE EQUIPOS
        dashboard_data["equipos"] = _get_equipos_metricas()

        # 4. RANKING DE GERENTES
        dashboard_data["gerentes_ranking"] = _get_gerentes_ranking()

        # 5. MÉTRICAS INDIVIDUALES DE ASESORES
        dashboard_data["asesores_individuales"] = _get_asesores_individuales()

        # 6. TENDENCIAS TEMPORALES
        dashboard_data["tendencias"] = _get_tendencias_consolidadas()

        # 7. INSIGHTS Y ALERTAS
        dashboard_data["insights"] = _get_insights_automaticos(dashboard_data)

        current_app.logger.info(f"✅ Dashboard unificado generado exitosamente")

        return jsonify(dashboard_data)

    except Exception as e:
        current_app.logger.error(f"❌ Error en dashboard unificado: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar dashboard: {str(e)}"
        }), 500

def _get_global_kpis():
    """Obtiene KPIs globales del sistema optimizados"""
    try:
        # Query para métricas de reclutas
        recluta_query = db.session.query(
            func.count(Recluta.id).label('total_reclutas'),
            func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('activos'),
            func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('en_proceso'),
            func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rechazados')
        ).first()

        total_reclutas = recluta_query.total_reclutas or 0
        activos = recluta_query.activos or 0
        en_proceso = recluta_query.en_proceso or 0
        rechazados = recluta_query.rechazados or 0

        # Query para métricas de usuarios
        usuarios_por_rol = db.session.query(
            Usuario.rol,
            func.count(Usuario.id).label('cantidad')
        ).filter(Usuario.is_active == True).group_by(Usuario.rol).all()

        roles_count = {rol.rol: rol.cantidad for rol in usuarios_por_rol}

        return {
            "total_reclutas": total_reclutas,
            "distribucion_global": {
                "activos": activos,
                "en_proceso": en_proceso,
                "rechazados": rechazados
            },
            "tasas": {
                "conversion": round(activos / total_reclutas * 100, 1) if total_reclutas > 0 else 0,
                "proceso": round(en_proceso / total_reclutas * 100, 1) if total_reclutas > 0 else 0,
                "rechazo": round(rechazados / total_reclutas * 100, 1) if total_reclutas > 0 else 0
            },
            "usuarios": {
                "total_administradores": roles_count.get('admin', 0),
                "total_gerentes": roles_count.get('gerente', 0),
                "total_asesores": roles_count.get('asesor', 0),
                "total_activos": sum(roles_count.values())
            },
            "performance_global": {
                "nivel": _calculate_global_performance_level(activos, total_reclutas),
                "score": round(activos / total_reclutas * 100, 1) if total_reclutas > 0 else 0
            }
        }
    except Exception as e:
        current_app.logger.error(f"Error en KPIs globales: {str(e)}")
        return {
            "total_reclutas": 0,
            "distribucion_global": {"activos": 0, "en_proceso": 0, "rechazados": 0},
            "tasas": {"conversion": 0, "proceso": 0, "rechazo": 0},
            "usuarios": {"total_administradores": 0, "total_gerentes": 0, "total_asesores": 0, "total_activos": 0},
            "performance_global": {"nivel": "Sin datos", "score": 0}
        }

def _get_jerarquia_optimizada():
    """Obtiene estructura jerárquica optimizada con una sola consulta compleja"""
    try:
        # Query optimizada que obtiene toda la información jerárquica de una vez
        jerarquia_query = db.session.query(
            Usuario.id.label('usuario_id'),
            Usuario.nombre.label('usuario_nombre'),
            Usuario.email.label('usuario_email'),
            Usuario.rol.label('usuario_rol'),
            Usuario.gerente_id,
            Usuario.foto_url,
            func.count(Recluta.id).label('total_reclutas'),
            func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('reclutas_activos'),
            func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('reclutas_proceso'),
            func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('reclutas_rechazados')
        ).outerjoin(
            Recluta, Usuario.id == Recluta.asesor_id
        ).filter(
            Usuario.is_active == True,
            Usuario.rol.in_(['gerente', 'asesor'])
        ).group_by(
            Usuario.id, Usuario.nombre, Usuario.email, Usuario.rol, Usuario.gerente_id, Usuario.foto_url
        ).all()

        # Procesar datos para estructura jerárquica
        gerentes = {}
        asesores_independientes = []

        for row in jerarquia_query:
            foto_url_completa = url_for('main.serve_profile_image', filename=row.foto_url, _external=False) if row.foto_url else None
            usuario_data = {
                "id": row.usuario_id,
                "nombre": row.usuario_nombre,
                "email": row.usuario_email,
                "rol": row.usuario_rol,
                "foto_url": foto_url_completa,
                "metricas": {
                    "total": row.total_reclutas or 0,
                    "activos": row.reclutas_activos or 0,
                    "proceso": row.reclutas_proceso or 0,
                    "rechazados": row.reclutas_rechazados or 0,
                    "tasa_exito": round((row.reclutas_activos or 0) / (row.total_reclutas or 1) * 100, 1)
                }
            }

            if row.usuario_rol == 'gerente':
                gerentes[row.usuario_id] = {
                    **usuario_data,
                    "asesores": [],
                    "metricas_equipo": {"total": 0, "activos": 0, "proceso": 0, "rechazados": 0}
                }
            elif row.usuario_rol == 'asesor':
                if row.gerente_id and row.gerente_id in gerentes:
                    gerentes[row.gerente_id]["asesores"].append(usuario_data)
                    # Sumar métricas del asesor al equipo
                    gerentes[row.gerente_id]["metricas_equipo"]["total"] += usuario_data["metricas"]["total"]
                    gerentes[row.gerente_id]["metricas_equipo"]["activos"] += usuario_data["metricas"]["activos"]
                    gerentes[row.gerente_id]["metricas_equipo"]["proceso"] += usuario_data["metricas"]["proceso"]
                    gerentes[row.gerente_id]["metricas_equipo"]["rechazados"] += usuario_data["metricas"]["rechazados"]
                else:
                    asesores_independientes.append(usuario_data)

        # Calcular métricas consolidadas para cada gerente
        for gerente_id, gerente in gerentes.items():
            total_equipo = gerente["metricas"]["total"] + gerente["metricas_equipo"]["total"]
            activos_equipo = gerente["metricas"]["activos"] + gerente["metricas_equipo"]["activos"]

            gerente["metricas_consolidadas"] = {
                "total": total_equipo,
                "activos": activos_equipo,
                "tasa_exito_equipo": round(activos_equipo / total_equipo * 100, 1) if total_equipo > 0 else 0,
                "total_asesores": len(gerente["asesores"])
            }

        return {
            "gerentes": list(gerentes.values()),
            "asesores_independientes": asesores_independientes,
            "resumen": {
                "total_gerentes": len(gerentes),
                "total_asesores_independientes": len(asesores_independientes),
                "total_equipos_activos": len([g for g in gerentes.values() if len(g["asesores"]) > 0])
            }
        }

    except Exception as e:
        current_app.logger.error(f"Error en jerarquía optimizada: {str(e)}")
        return {
            "gerentes": [],
            "asesores_independientes": [],
            "resumen": {"total_gerentes": 0, "total_asesores_independientes": 0, "total_equipos_activos": 0}
        }

def _get_equipos_metricas():
    """Obtiene métricas específicas de equipos para vista comparativa"""
    try:
        # Reutilizar datos de jerarquía para calcular métricas de equipos
        jerarquia = _get_jerarquia_optimizada()
        equipos_metricas = []

        for gerente in jerarquia["gerentes"]:
            if len(gerente["asesores"]) > 0:  # Solo gerentes con equipos
                equipos_metricas.append({
                    "gerente": {
                        "id": gerente["id"],
                        "nombre": gerente["nombre"],
                        "email": gerente["email"],
                        "foto_url": gerente["foto_url"]
                    },
                    "equipo_stats": {
                        "total_asesores": len(gerente["asesores"]),
                        "total_reclutas": gerente["metricas_consolidadas"]["total"],
                        "tasa_exito": gerente["metricas_consolidadas"]["tasa_exito_equipo"],
                        "performance_level": _calculate_team_performance_level(gerente["metricas_consolidadas"]["tasa_exito_equipo"])
                    },
                    "top_asesor": _get_top_asesor_del_equipo(gerente["asesores"]),
                })

        # Ordenar equipos por performance
        equipos_metricas.sort(key=lambda x: x["equipo_stats"]["tasa_exito"], reverse=True)

        return equipos_metricas

    except Exception as e:
        current_app.logger.error(f"Error en métricas de equipos: {str(e)}")
        return []

def _get_gerentes_ranking():
    """Obtiene ranking de gerentes optimizado"""
    try:
        jerarquia = _get_jerarquia_optimizada()
        ranking = []

        for gerente in jerarquia["gerentes"]:
            ranking_item = {
                "id": gerente["id"],
                "nombre": gerente["nombre"],
                "email": gerente["email"],
                "foto_url": gerente["foto_url"],
                "metricas": gerente["metricas_consolidadas"],
                "kpis_liderazgo": {
                    "nivel": _calculate_leadership_level(gerente["metricas_consolidadas"]["tasa_exito_equipo"]),
                    "score": gerente["metricas_consolidadas"]["tasa_exito_equipo"],
                    "team_size": gerente["metricas_consolidadas"]["total_asesores"]
                }
            }
            ranking.append(ranking_item)

        # Ordenar por score de liderazgo
        ranking.sort(key=lambda x: x["kpis_liderazgo"]["score"], reverse=True)

        return ranking

    except Exception as e:
        current_app.logger.error(f"Error en ranking de gerentes: {str(e)}")
        return []

def _get_asesores_individuales():
    """Obtiene métricas individuales de asesores optimizadas"""
    try:
        jerarquia = _get_jerarquia_optimizada()
        asesores = []

        # Combinar asesores de equipos y independientes
        for gerente in jerarquia["gerentes"]:
            for asesor in gerente["asesores"]:
                asesor["gerente_nombre"] = gerente["nombre"]
                asesores.append(asesor)

        asesores.extend(jerarquia["asesores_independientes"])

        # Ordenar por tasa de éxito
        asesores.sort(key=lambda x: x["metricas"]["tasa_exito"], reverse=True)

        return asesores

    except Exception as e:
        current_app.logger.error(f"Error en asesores individuales: {str(e)}")
        return []

def _get_tendencias_consolidadas():
    """Obtiene tendencias temporales consolidadas"""
    try:
        now = datetime.utcnow()
        tendencias = {"mensual": [], "semanal": []}

        # Tendencia mensual (últimos 6 meses)
        for i in range(6):
            mes_inicio = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
            if mes_inicio.month == 12:
                mes_fin = mes_inicio.replace(year=mes_inicio.year + 1, month=1, day=1)
            else:
                mes_fin = mes_inicio.replace(month=mes_inicio.month + 1, day=1)

            query = db.session.query(
                func.count(Recluta.id).label('total'),
                func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('activos'),
                func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('proceso'),
                func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rechazados')
            ).filter(
                Recluta.fecha_registro >= mes_inicio,
                Recluta.fecha_registro < mes_fin
            ).first()

            tendencias["mensual"].append({
                "periodo": mes_inicio.strftime('%Y-%m'),
                "periodo_nombre": mes_inicio.strftime('%B %Y'),
                "metricas": {
                    "total": query.total or 0,
                    "activos": query.activos or 0,
                    "proceso": query.proceso or 0,
                    "rechazados": query.rechazados or 0,
                    "tasa_conversion": round((query.activos or 0) / (query.total or 1) * 100, 1)
                }
            })

        tendencias["mensual"].reverse()  # Orden cronológico

        return tendencias

    except Exception as e:
        current_app.logger.error(f"Error en tendencias: {str(e)}")
        return {"mensual": [], "semanal": []}

def _get_insights_automaticos(dashboard_data):
    """Genera insights automáticos basados en los datos del dashboard"""
    try:
        insights = {
            "alertas": [],
            "oportunidades": [],
            "destacados": []
        }

        # Analizar performance global
        performance_global = dashboard_data["global_kpis"]["performance_global"]["score"]
        if performance_global < 50:
            insights["alertas"].append({
                "tipo": "performance_baja",
                "mensaje": f"Performance global del sistema está en {performance_global}%. Revisar estrategias de conversión.",
                "prioridad": "alta"
            })

        # Analizar equipos sin asesores
        gerentes_sin_equipo = len([g for g in dashboard_data["jerarquia"]["gerentes"] if len(g["asesores"]) == 0])
        if gerentes_sin_equipo > 0:
            insights["oportunidades"].append({
                "tipo": "asignacion_equipos",
                "mensaje": f"{gerentes_sin_equipo} gerentes sin asesores asignados. Oportunidad de optimizar estructura.",
                "accion": "asignar_asesores"
            })

        # Identificar top performers
        if dashboard_data["gerentes_ranking"]:
            top_gerente = dashboard_data["gerentes_ranking"][0]
            insights["destacados"].append({
                "tipo": "top_gerente",
                "mensaje": f"{top_gerente['nombre']} lidera con {top_gerente['kpis_liderazgo']['score']}% de éxito.",
                "usuario_id": top_gerente["id"]
            })

        return insights

    except Exception as e:
        current_app.logger.error(f"Error generando insights: {str(e)}")
        return {"alertas": [], "oportunidades": [], "destacados": []}

# Funciones auxiliares para cálculos
def _calculate_global_performance_level(activos, total):
    """Calcula el nivel de performance global"""
    if total == 0:
        return "Sin datos"

    tasa = (activos / total) * 100
    if tasa >= 80:
        return "Excelente"
    elif tasa >= 60:
        return "Bueno"
    elif tasa >= 40:
        return "Regular"
    else:
        return "Necesita Mejora"

def _calculate_team_performance_level(tasa_exito):
    """Calcula el nivel de performance del equipo"""
    if tasa_exito >= 80:
        return "Excelente"
    elif tasa_exito >= 60:
        return "Bueno"
    elif tasa_exito >= 40:
        return "Regular"
    else:
        return "Necesita Mejora"

def _calculate_leadership_level(tasa_exito_equipo):
    """Calcula el nivel de liderazgo basado en performance del equipo"""
    if tasa_exito_equipo >= 85:
        return "Líder Excepcional"
    elif tasa_exito_equipo >= 70:
        return "Buen Líder"
    elif tasa_exito_equipo >= 50:
        return "Líder en Desarrollo"
    else:
        return "Necesita Apoyo"

def _get_top_asesor_del_equipo(asesores):
    """Obtiene el asesor con mejor performance del equipo"""
    if not asesores:
        return None

    top_asesor = max(asesores, key=lambda a: a["metricas"]["tasa_exito"])
    return {
        "nombre": top_asesor["nombre"],
        "tasa_exito": top_asesor["metricas"]["tasa_exito"]
    }

# 🎯 =========================
# GESTIÓN AVANZADA DE RECLUTAS - SOLO ADMIN
# =========================

@admin_bp.route('/reclutas/management', methods=['GET'])
@admin_required
def get_reclutas_management():
    """
    🔒 ADMIN ONLY: Obtiene todos los reclutas para gestión administrativa
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        search = request.args.get('search', '')
        estado = request.args.get('estado', '')
        asesor_id = request.args.get('asesor_id', '', type=str)

        # Base query - ADMIN puede ver TODOS los reclutas
        query = Recluta.query

        # Filtros
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Recluta.nombre.ilike(search_term),
                    Recluta.email.ilike(search_term),
                    Recluta.telefono.ilike(search_term),
                    Recluta.folio.ilike(search_term)
                )
            )

        if estado:
            query = query.filter(Recluta.estado == estado)

        if asesor_id:
            if asesor_id == 'sin_asignar':
                query = query.filter(Recluta.asesor_id.is_(None))
            else:
                query = query.filter(Recluta.asesor_id == int(asesor_id))

        # Ordenar por fecha de registro (más recientes primero)
        query = query.order_by(Recluta.fecha_registro.desc())

        # Paginación
        reclutas_paginados = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Obtener lista de asesores para el dropdown
        asesores = Usuario.query.filter_by(rol='asesor').all()
        gerentes = Usuario.query.filter_by(rol='gerente').all()

        # Serializar reclutas con información del asesor
        reclutas_data = []
        for recluta in reclutas_paginados.items:
            recluta_info = recluta.serialize()
            recluta_info['asesor_nombre'] = recluta.asesor.nombre if recluta.asesor else "Sin asignar"
            recluta_info['asesor_email'] = recluta.asesor.email if recluta.asesor else ""
            reclutas_data.append(recluta_info)

        current_app.logger.info(f"✅ Admin consultó {len(reclutas_data)} reclutas para gestión")

        return jsonify({
            "success": True,
            "reclutas": reclutas_data,
            "pagination": {
                "page": reclutas_paginados.page,
                "pages": reclutas_paginados.pages,
                "per_page": reclutas_paginados.per_page,
                "total": reclutas_paginados.total,
                "has_next": reclutas_paginados.has_next,
                "has_prev": reclutas_paginados.has_prev
            },
            "asesores": [{"id": a.id, "nombre": a.nombre, "email": a.email} for a in asesores],
            "gerentes": [{"id": g.id, "nombre": g.nombre, "email": g.email} for g in gerentes]
        })

    except Exception as e:
        current_app.logger.error(f"❌ Error en gestión de reclutas admin: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al obtener reclutas: {str(e)}"
        }), 500

@admin_bp.route('/reclutas/bulk-delete', methods=['POST'])
@admin_required
def bulk_delete_reclutas():
    """
    🔒 ADMIN ONLY: Elimina múltiples reclutas
    """
    try:
        data = request.get_json()
        recluta_ids = data.get('recluta_ids', [])

        if not recluta_ids:
            return jsonify({
                "success": False,
                "message": "No se proporcionaron IDs de reclutas"
            }), 400

        # Validar que todos los IDs existan
        reclutas = Recluta.query.filter(Recluta.id.in_(recluta_ids)).all()

        if len(reclutas) != len(recluta_ids):
            return jsonify({
                "success": False,
                "message": "Algunos reclutas no existen"
            }), 400

        # Proceder con eliminación
        folios_eliminados = []
        nombres_eliminados = []

        for recluta in reclutas:
            folios_eliminados.append(recluta.folio)
            nombres_eliminados.append(recluta.nombre)
            db.session.delete(recluta)

        db.session.commit()

        current_app.logger.warning(
            f"🗑️ ADMIN eliminó {len(reclutas)} reclutas: {', '.join(folios_eliminados)}"
        )

        return jsonify({
            "success": True,
            "message": f"Se eliminaron {len(reclutas)} reclutas exitosamente",
            "eliminados": {
                "cantidad": len(reclutas),
                "folios": folios_eliminados,
                "nombres": nombres_eliminados
            }
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"❌ Error en eliminación masiva: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al eliminar reclutas: {str(e)}"
        }), 500

@admin_bp.route('/reclutas/bulk-assign', methods=['POST'])
@admin_required
def bulk_assign_asesor():
    """
    🔒 ADMIN ONLY: Asigna/reasigna asesor a múltiples reclutas
    """
    try:
        data = request.get_json()
        recluta_ids = data.get('recluta_ids', [])
        nuevo_asesor_id = data.get('asesor_id')

        if not recluta_ids:
            return jsonify({
                "success": False,
                "message": "No se proporcionaron IDs de reclutas"
            }), 400

        # Validar asesor (puede ser None para desasignar)
        if nuevo_asesor_id:
            asesor = Usuario.query.filter_by(id=nuevo_asesor_id, rol='asesor').first()
            if not asesor:
                return jsonify({
                    "success": False,
                    "message": "El asesor especificado no existe"
                }), 400
            asesor_nombre = asesor.nombre
        else:
            asesor_nombre = "Sin asignar"

        # Obtener reclutas
        reclutas = Recluta.query.filter(Recluta.id.in_(recluta_ids)).all()

        if len(reclutas) != len(recluta_ids):
            return jsonify({
                "success": False,
                "message": "Algunos reclutas no existen"
            }), 400

        # Realizar asignación
        cambios_realizados = []

        for recluta in reclutas:
            asesor_anterior = recluta.asesor.nombre if recluta.asesor else "Sin asignar"
            recluta.asesor_id = nuevo_asesor_id

            cambios_realizados.append({
                "folio": recluta.folio,
                "nombre": recluta.nombre,
                "asesor_anterior": asesor_anterior,
                "asesor_nuevo": asesor_nombre
            })

        db.session.commit()

        current_app.logger.info(
            f"👥 ADMIN reasignó {len(reclutas)} reclutas al asesor: {asesor_nombre}"
        )

        return jsonify({
            "success": True,
            "message": f"Se reasignaron {len(reclutas)} reclutas a {asesor_nombre}",
            "cambios": cambios_realizados
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"❌ Error en asignación masiva: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al reasignar reclutas: {str(e)}"
        }), 500

@admin_bp.route('/reclutas/<int:recluta_id>/assign', methods=['POST'])
@admin_required
def assign_single_recluta(recluta_id):
    """
    🔒 ADMIN ONLY: Asigna asesor a un recluta individual
    """
    try:
        data = request.get_json()
        nuevo_asesor_id = data.get('asesor_id')

        recluta = Recluta.query.get(recluta_id)
        if not recluta:
            return jsonify({
                "success": False,
                "message": "Recluta no encontrado"
            }), 404

        # Validar asesor
        if nuevo_asesor_id:
            asesor = Usuario.query.filter_by(id=nuevo_asesor_id, rol='asesor').first()
            if not asesor:
                return jsonify({
                    "success": False,
                    "message": "El asesor especificado no existe"
                }), 400
            asesor_nombre = asesor.nombre
        else:
            asesor_nombre = "Sin asignar"

        asesor_anterior = recluta.asesor.nombre if recluta.asesor else "Sin asignar"
        recluta.asesor_id = nuevo_asesor_id

        db.session.commit()

        current_app.logger.info(
            f"👤 ADMIN cambió asesor de {recluta.folio}: {asesor_anterior} → {asesor_nombre}"
        )

        return jsonify({
            "success": True,
            "message": f"Asesor cambiado de '{asesor_anterior}' a '{asesor_nombre}'",
            "cambio": {
                "recluta": recluta.nombre,
                "folio": recluta.folio,
                "asesor_anterior": asesor_anterior,
                "asesor_nuevo": asesor_nombre
            }
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"❌ Error en asignación individual: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al asignar asesor: {str(e)}"
        }), 500



