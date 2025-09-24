"""
Módulo específico para estadísticas de asesores.
Cada asesor ve únicamente sus propios reclutas y métricas personales.
"""

from flask import Blueprint, jsonify, current_app
from flask_login import login_required, current_user
from utils.decorators import asesor_or_admin_required
from models.recluta import Recluta
from models import db
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import logging

# Crear blueprint específico para estadísticas de asesores
asesor_stats_bp = Blueprint('asesor_stats', __name__)

@asesor_stats_bp.route('/api/asesor/mis-reclutas', methods=['GET'])
@login_required
@asesor_or_admin_required
def obtener_mis_reclutas():
    """
    API para obtener los reclutas del asesor logueado.
    Solo ve sus propios reclutas asignados.
    """
    try:
        # Obtener solo los reclutas del asesor actual
        reclutas = Recluta.query.filter_by(asesor_id=current_user.id).all()

        reclutas_data = []
        for recluta in reclutas:
            reclutas_data.append({
                'id': recluta.id,
                'nombre': recluta.nombre,
                'email': recluta.email,
                'telefono': recluta.telefono,
                'estado': recluta.estado,
                'puesto': recluta.puesto,
                'folio': recluta.folio,
                'fecha_registro': recluta.fecha_registro.isoformat() if recluta.fecha_registro else None,
                'ultima_actualizacion': recluta.ultima_actualizacion.isoformat() if recluta.ultima_actualizacion else None,
                'notas': recluta.notas
            })

        return jsonify({
            'success': True,
            'data': reclutas_data,
            'total': len(reclutas_data)
        })

    except Exception as e:
        current_app.logger.error(f"Error en obtener_mis_reclutas: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener datos de reclutas'
        }), 500

@asesor_stats_bp.route('/api/asesor/resumen-personal', methods=['GET'])
@login_required
@asesor_or_admin_required
def resumen_personal():
    """
    API para obtener resumen personal del asesor.
    Estadísticas exclusivas de sus reclutas.
    """
    try:
        # Contar reclutas por estado del asesor actual
        reclutas_stats = db.session.query(
            Recluta.estado,
            func.count(Recluta.id).label('count')
        ).filter(
            Recluta.asesor_id == current_user.id
        ).group_by(Recluta.estado).all()

        # Procesar estadísticas
        stats = {
            'total_reclutas': 0,
            'reclutas_activos': 0,
            'reclutas_proceso': 0,
            'reclutas_rechazados': 0,
            'tasa_conversion': 0,
            'objetivo_mensual': 20,  # Puede ser configurable por asesor
            'progreso_mes_actual': 0
        }

        for estado, count in reclutas_stats:
            stats['total_reclutas'] += count
            if estado == 'Activo':
                stats['reclutas_activos'] = count
            elif estado == 'En proceso':
                stats['reclutas_proceso'] = count
            elif estado == 'Rechazado':
                stats['reclutas_rechazados'] = count

        # Calcular tasa de conversión
        if stats['total_reclutas'] > 0:
            stats['tasa_conversion'] = round(
                (stats['reclutas_activos'] / stats['total_reclutas']) * 100, 1
            )

        # Calcular progreso del mes actual
        inicio_mes = datetime.now().replace(day=1)
        reclutas_mes = db.session.query(func.count(Recluta.id)).filter(
            Recluta.asesor_id == current_user.id,
            Recluta.fecha_registro >= inicio_mes
        ).scalar()

        stats['progreso_mes_actual'] = reclutas_mes or 0
        stats['progreso_porcentaje'] = min(100, round((reclutas_mes or 0) / stats['objetivo_mensual'] * 100, 1))

        return jsonify({
            'success': True,
            'data': stats
        })

    except Exception as e:
        current_app.logger.error(f"Error en resumen_personal: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener resumen personal'
        }), 500

@asesor_stats_bp.route('/api/asesor/rendimiento-mensual', methods=['GET'])
@login_required
@asesor_or_admin_required
def rendimiento_mensual_asesor():
    """
    API para obtener rendimiento mensual del asesor.
    Datos de sus reclutas en los últimos 6 meses.
    """
    try:
        # Obtener últimos 6 meses
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)

        # Agrupar reclutas del asesor por mes
        reclutas_por_mes = db.session.query(
            func.strftime('%Y-%m', Recluta.fecha_registro).label('mes'),
            func.count(Recluta.id).label('total'),
            func.sum(func.case([(Recluta.estado == 'Activo', 1)], else_=0)).label('activos')
        ).filter(
            Recluta.asesor_id == current_user.id,
            Recluta.fecha_registro >= start_date
        ).group_by(func.strftime('%Y-%m', Recluta.fecha_registro)).all()

        # Procesar datos
        rendimiento_data = []
        for mes, total, activos in reclutas_por_mes:
            tasa_conversion = 0
            if total > 0:
                tasa_conversion = round((activos / total) * 100, 1)

            rendimiento_data.append({
                'mes': mes,
                'total_reclutas': total,
                'reclutas_activos': activos or 0,
                'tasa_conversion': tasa_conversion
            })

        return jsonify({
            'success': True,
            'data': rendimiento_data
        })

    except Exception as e:
        current_app.logger.error(f"Error en rendimiento_mensual_asesor: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener rendimiento mensual'
        }), 500

@asesor_stats_bp.route('/api/asesor/reclutas-recientes', methods=['GET'])
@login_required
@asesor_or_admin_required
def reclutas_recientes():
    """
    API para obtener los reclutas más recientes del asesor.
    Útil para mostrar actividad reciente.
    """
    try:
        # Obtener últimos 10 reclutas del asesor
        reclutas = Recluta.query.filter_by(
            asesor_id=current_user.id
        ).order_by(desc(Recluta.fecha_registro)).limit(10).all()

        reclutas_data = []
        for recluta in reclutas:
            # Calcular días desde el registro
            dias_desde_registro = (datetime.now() - recluta.fecha_registro).days if recluta.fecha_registro else 0

            reclutas_data.append({
                'id': recluta.id,
                'nombre': recluta.nombre,
                'email': recluta.email,
                'estado': recluta.estado,
                'puesto': recluta.puesto,
                'folio': recluta.folio,
                'dias_desde_registro': dias_desde_registro,
                'fecha_registro': recluta.fecha_registro.isoformat() if recluta.fecha_registro else None
            })

        return jsonify({
            'success': True,
            'data': reclutas_data
        })

    except Exception as e:
        current_app.logger.error(f"Error en reclutas_recientes: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener reclutas recientes'
        }), 500

@asesor_stats_bp.route('/api/asesor/estadisticas-por-estado', methods=['GET'])
@login_required
@asesor_or_admin_required
def estadisticas_por_estado():
    """
    API para obtener estadísticas detalladas por estado de los reclutas del asesor.
    """
    try:
        # Obtener estadísticas por estado con datos adicionales
        stats_query = db.session.query(
            Recluta.estado,
            func.count(Recluta.id).label('count'),
            func.avg(func.julianday('now') - func.julianday(Recluta.fecha_registro)).label('dias_promedio')
        ).filter(
            Recluta.asesor_id == current_user.id
        ).group_by(Recluta.estado).all()

        estados_data = []
        total_general = 0

        for estado, count, dias_promedio in stats_query:
            total_general += count
            estados_data.append({
                'estado': estado,
                'cantidad': count,
                'dias_promedio': round(dias_promedio, 1) if dias_promedio else 0,
                'porcentaje': 0  # Se calculará después
            })

        # Calcular porcentajes
        for estado_data in estados_data:
            if total_general > 0:
                estado_data['porcentaje'] = round((estado_data['cantidad'] / total_general) * 100, 1)

        return jsonify({
            'success': True,
            'data': {
                'estados': estados_data,
                'total_reclutas': total_general
            }
        })

    except Exception as e:
        current_app.logger.error(f"Error en estadisticas_por_estado: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener estadísticas por estado'
        }), 500

@asesor_stats_bp.route('/api/asesor/comparativa-objetivos', methods=['GET'])
@login_required
@asesor_or_admin_required
def comparativa_objetivos():
    """
    API para comparar el rendimiento del asesor con sus objetivos.
    """
    try:
        # Obtener datos del mes actual y anterior
        hoy = datetime.now()
        inicio_mes_actual = hoy.replace(day=1)
        inicio_mes_anterior = (inicio_mes_actual - timedelta(days=1)).replace(day=1)

        # Reclutas del mes actual
        reclutas_mes_actual = db.session.query(func.count(Recluta.id)).filter(
            Recluta.asesor_id == current_user.id,
            Recluta.fecha_registro >= inicio_mes_actual
        ).scalar() or 0

        # Reclutas del mes anterior
        reclutas_mes_anterior = db.session.query(func.count(Recluta.id)).filter(
            Recluta.asesor_id == current_user.id,
            Recluta.fecha_registro >= inicio_mes_anterior,
            Recluta.fecha_registro < inicio_mes_actual
        ).scalar() or 0

        # Calcular variación
        variacion = 0
        if reclutas_mes_anterior > 0:
            variacion = round(((reclutas_mes_actual - reclutas_mes_anterior) / reclutas_mes_anterior) * 100, 1)

        objetivo_mensual = 20  # Configurable
        progreso_objetivo = min(100, round((reclutas_mes_actual / objetivo_mensual) * 100, 1))

        return jsonify({
            'success': True,
            'data': {
                'mes_actual': reclutas_mes_actual,
                'mes_anterior': reclutas_mes_anterior,
                'variacion_porcentual': variacion,
                'objetivo_mensual': objetivo_mensual,
                'progreso_objetivo': progreso_objetivo,
                'tendencia': 'positiva' if variacion >= 0 else 'negativa'
            }
        })

    except Exception as e:
        current_app.logger.error(f"Error en comparativa_objetivos: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener comparativa de objetivos'
        }), 500