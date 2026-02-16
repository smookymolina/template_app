"""
Módulo específico para estadísticas de gerentes.
Separado de las métricas administrativas avanzadas.
"""

from flask import Blueprint, render_template, jsonify, request, current_app
from flask_login import login_required, current_user
from utils.decorators import gerente_required
from models.usuario import Usuario
from models.recluta import Recluta
from models import db
from sqlalchemy import func, desc, asc
from datetime import datetime, timedelta
import logging

# Crear blueprint específico para estadísticas de gerentes
gerente_stats_bp = Blueprint('gerente_stats', __name__)

# Vista eliminada - ahora se usa el sistema integrado del dashboard

@gerente_stats_bp.route('/api/gerente/mis-asesores', methods=['GET'])
@login_required
@gerente_required
def obtener_mis_asesores():
    """
    API para obtener los asesores del gerente logueado.
    """
    try:
        # Obtener solo los asesores que reportan a este gerente
        asesores = Usuario.query.filter_by(
            rol='asesor',
            gerente_id=current_user.id,
            is_active=True
        ).all()

        asesores_data = []
        for asesor in asesores:
            # Estadísticas básicas del asesor
            reclutas_query = Recluta.query.filter_by(asesor_id=asesor.id)
            total_reclutas = reclutas_query.count()
            reclutas_activos = reclutas_query.filter_by(estado='Activo').count()
            reclutas_proceso = reclutas_query.filter_by(estado='En proceso').count()
            reclutas_rechazados = reclutas_query.filter_by(estado='Rechazado').count()

            # Calcular tasa de conversión
            tasa_conversion = 0
            if total_reclutas > 0:
                tasa_conversion = round((reclutas_activos / total_reclutas) * 100, 1)

            asesores_data.append({
                'id': asesor.id,
                'nombre': asesor.nombre,
                'apellido': asesor.apellido,
                'email': asesor.email,
                'total_reclutas': total_reclutas,
                'reclutas_activos': reclutas_activos,
                'reclutas_proceso': reclutas_proceso,
                'reclutas_rechazados': reclutas_rechazados,
                'tasa_conversion': tasa_conversion,
                'fecha_creacion': asesor.created_at.isoformat() if asesor.created_at else None
            })

        return jsonify({
            'success': True,
            'data': asesores_data,
            'total': len(asesores_data)
        })

    except Exception as e:
        current_app.logger.error(f"Error en obtener_mis_asesores: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener datos de asesores'
        }), 500

@gerente_stats_bp.route('/api/gerente/resumen-equipo', methods=['GET'])
@login_required
@gerente_required
def resumen_equipo():
    """
    API para obtener resumen general del equipo del gerente.
    """
    try:
        # Obtener asesores del gerente
        asesores = Usuario.query.filter_by(
            rol='asesor',
            gerente_id=current_user.id,
            is_active=True
        ).all()

        asesores_ids = [asesor.id for asesor in asesores]

        # Contar reclutas por estado si hay asesores
        reclutas_stats = []
        if asesores_ids:
            reclutas_stats = db.session.query(
                Recluta.estado,
                func.count(Recluta.id).label('count')
            ).filter(
                Recluta.asesor_id.in_(asesores_ids)
            ).group_by(Recluta.estado).all()

        # Procesar estadísticas
        stats = {
            'total_asesores': len(asesores),
            'total_reclutas': 0,
            'reclutas_activos': 0,
            'reclutas_proceso': 0,
            'reclutas_rechazados': 0,
            'tasa_conversion': 0
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

        return jsonify({
            'success': True,
            'data': stats
        })

    except Exception as e:
        current_app.logger.error(f"Error en resumen_equipo: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener resumen del equipo'
        }), 500

@gerente_stats_bp.route('/api/gerente/rendimiento-mensual', methods=['GET'])
@login_required
@gerente_required
def rendimiento_mensual():
    """
    API para obtener rendimiento mensual del equipo.
    """
    try:
        # Obtener últimos 6 meses
        end_date = datetime.now()
        start_date = end_date - timedelta(days=180)

        # Obtener asesores del gerente
        asesores_ids = [asesor.id for asesor in Usuario.query.filter_by(
            rol='asesor',
            gerente_id=current_user.id,
            is_active=True
        ).all()]

        if not asesores_ids:
            return jsonify({
                'success': True,
                'data': []
            })

        # Agrupar reclutas por mes
        reclutas_por_mes = db.session.query(
            func.strftime('%Y-%m', Recluta.fecha_registro).label('mes'),
            func.count(Recluta.id).label('total'),
            func.sum(func.case([(Recluta.estado == 'Activo', 1)], else_=0)).label('activos')
        ).filter(
            Recluta.asesor_id.in_(asesores_ids),
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
        current_app.logger.error(f"Error en rendimiento_mensual: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener rendimiento mensual'
        }), 500

@gerente_stats_bp.route('/api/gerente/top-performers', methods=['GET'])
@login_required
@gerente_required
def top_performers():
    """
    API para obtener los mejores asesores del equipo.
    """
    try:
        # Obtener asesores con sus estadísticas
        asesores = Usuario.query.filter_by(
            rol='asesor',
            gerente_id=current_user.id,
            is_active=True
        ).all()

        performers_data = []
        for asesor in asesores:
            reclutas = Recluta.query.filter_by(asesor_id=asesor.id)
            total = reclutas.count()
            activos = reclutas.filter_by(estado='Activo').count()

            if total > 0:
                tasa_conversion = (activos / total) * 100
                performers_data.append({
                    'asesor_id': asesor.id,
                    'nombre': f"{asesor.nombre} {asesor.apellido}",
                    'total_reclutas': total,
                    'reclutas_activos': activos,
                    'tasa_conversion': round(tasa_conversion, 1)
                })

        # Ordenar por tasa de conversión
        performers_data.sort(key=lambda x: x['tasa_conversion'], reverse=True)

        return jsonify({
            'success': True,
            'data': performers_data[:5]  # Top 5
        })

    except Exception as e:
        current_app.logger.error(f"Error en top_performers: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error al obtener top performers'
        }), 500
