"""
Panel Administrativo de Reclutas para Gerentes.
Permite a cada gerente ver y reasignar los reclutas de su propio equipo
(sus asesores + reclutas propios). No puede ver ni modificar datos de
equipos ajenos.
"""

from flask import Blueprint, jsonify, request, current_app
from flask_login import login_required, current_user
from sqlalchemy.orm import selectinload
from functools import wraps
from collections import defaultdict

from models import db
from models.usuario import Usuario
from models.recluta import Recluta
from models.evento_recluta import EventoRecluta

gerente_panel_bp = Blueprint('gerente_panel', __name__)


# ============================================================================
# DECORADOR
# ============================================================================

def gerente_required(f):
    """Solo gerentes pueden acceder a estas rutas."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"success": False, "message": "No autenticado."}), 401
        if current_user.rol != 'gerente':
            return jsonify({"success": False, "message": "Acceso exclusivo para gerentes."}), 403
        return f(*args, **kwargs)
    return login_required(decorated_function)


# ============================================================================
# HELPERS
# ============================================================================

def _get_gerente_team_ids(gerente_id):
    """
    Devuelve (asesor_ids, team_ids) para el gerente indicado.
    team_ids incluye al propio gerente + sus asesores.
    """
    asesores = Usuario.query.filter_by(
        gerente_id=gerente_id, rol='asesor', is_active=True
    ).all()
    asesor_ids = [a.id for a in asesores]
    team_ids = [gerente_id] + asesor_ids
    return asesores, asesor_ids, team_ids


# ============================================================================
# RUTAS
# ============================================================================

@gerente_panel_bp.route('/gerente/panel/support-data', methods=['GET'])
@gerente_required
def get_gerente_panel_support_data():
    """
    Devuelve la lista de asesores que pertenecen al gerente actual.
    Usado para poblar los filtros y selectores de reasignación.
    """
    try:
        asesores, _, _ = _get_gerente_team_ids(current_user.id)
        asesores_data = [
            {"id": a.id, "nombre": a.nombre or a.email, "email": a.email}
            for a in asesores
        ]
        return jsonify({"success": True, "asesores": asesores_data})
    except Exception as e:
        current_app.logger.error("Error en support-data gerente: %s", str(e), exc_info=True)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@gerente_panel_bp.route('/gerente/panel/reclutas', methods=['GET'])
@gerente_required
def get_gerente_panel_reclutas():
    """
    Devuelve los reclutas del equipo del gerente con paginación y filtros.
    Solo incluye reclutas cuyo asesor_id pertenece al equipo del gerente.
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 50, type=int), 200)
        search = request.args.get('search', '', type=str)
        estado = request.args.get('estado', '', type=str)
        asesor_id_raw = request.args.get('asesor_id', '', type=str)

        _, _, team_ids = _get_gerente_team_ids(current_user.id)

        query = (
            Recluta.query
            .options(selectinload(Recluta.asesor))
            .filter(Recluta.asesor_id.in_(team_ids))
        )

        if search:
            term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Recluta.nombre.ilike(term),
                    Recluta.email.ilike(term),
                    Recluta.telefono.ilike(term),
                    Recluta.folio.ilike(term)
                )
            )

        if estado:
            query = query.filter(Recluta.estado == estado)

        if asesor_id_raw:
            if asesor_id_raw in {'sin_asignar', 'null'}:
                query = query.filter(Recluta.asesor_id.is_(None))
            else:
                try:
                    asesor_id_int = int(asesor_id_raw)
                    # Solo permitir filtrar por asesores del propio equipo
                    if asesor_id_int not in team_ids:
                        return jsonify({"success": False, "message": "Asesor no pertenece a tu equipo."}), 403
                    query = query.filter(Recluta.asesor_id == asesor_id_int)
                except ValueError:
                    return jsonify({"success": False, "message": "Filtro de asesor inválido."}), 400

        query = query.order_by(Recluta.fecha_registro.desc())
        paginados = query.paginate(page=page, per_page=per_page, error_out=False)

        # Cargar eventos en lote
        recluta_ids = [r.id for r in paginados.items]
        eventos_por_recluta = defaultdict(list)
        if recluta_ids:
            eventos = (
                EventoRecluta.query
                .filter(EventoRecluta.recluta_id.in_(recluta_ids))
                .order_by(EventoRecluta.recluta_id, EventoRecluta.fecha, EventoRecluta.id)
                .all()
            )
            for ev in eventos:
                eventos_por_recluta[ev.recluta_id].append(ev.serialize())

        reclutas_data = []
        for r in paginados.items:
            info = r.serialize()
            info['asesor_nombre'] = r.asesor.nombre if r.asesor else "Sin asignar"
            info['asesor_email'] = r.asesor.email if r.asesor else ""
            info['eventos'] = eventos_por_recluta.get(r.id, [])
            reclutas_data.append(info)

        current_app.logger.info(
            "Gerente %s consultó %s reclutas de su equipo",
            current_user.email, len(reclutas_data)
        )

        return jsonify({
            "success": True,
            "reclutas": reclutas_data,
            "pagination": {
                "page": paginados.page,
                "pages": paginados.pages,
                "per_page": paginados.per_page,
                "total": paginados.total,
                "has_next": paginados.has_next,
                "has_prev": paginados.has_prev
            }
        })

    except Exception as e:
        current_app.logger.error("Error en panel reclutas gerente: %s", str(e), exc_info=True)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@gerente_panel_bp.route('/gerente/panel/reclutas/bulk-assign', methods=['POST'])
@gerente_required
def gerente_bulk_assign():
    """
    Reasigna múltiples reclutas a uno de los asesores del propio equipo del gerente.
    No puede reasignar a asesores ajenos.
    """
    try:
        data = request.get_json()
        recluta_ids = data.get('recluta_ids', [])
        nuevo_asesor_id = data.get('asesor_id')

        if not recluta_ids:
            return jsonify({"success": False, "message": "No se proporcionaron IDs de reclutas."}), 400

        asesores, asesor_ids, team_ids = _get_gerente_team_ids(current_user.id)

        # Validar asesor destino
        if nuevo_asesor_id is not None:
            if nuevo_asesor_id not in asesor_ids:
                return jsonify({"success": False, "message": "El asesor destino no pertenece a tu equipo."}), 403
            asesor_obj = next((a for a in asesores if a.id == nuevo_asesor_id), None)
            asesor_nombre = asesor_obj.nombre if asesor_obj else "Desconocido"
        else:
            asesor_nombre = "Sin asignar"

        # Validar que los reclutas pertenezcan al equipo
        reclutas = Recluta.query.filter(Recluta.id.in_(recluta_ids)).all()

        if len(reclutas) != len(recluta_ids):
            return jsonify({"success": False, "message": "Algunos reclutas no existen."}), 400

        for r in reclutas:
            if r.asesor_id not in team_ids:
                return jsonify({
                    "success": False,
                    "message": f"El recluta {r.folio} no pertenece a tu equipo."
                }), 403

        cambios = []
        for r in reclutas:
            anterior = r.asesor.nombre if r.asesor else "Sin asignar"
            r.asesor_id = nuevo_asesor_id
            cambios.append({
                "folio": r.folio,
                "nombre": r.nombre,
                "asesor_anterior": anterior,
                "asesor_nuevo": asesor_nombre
            })

        db.session.commit()

        current_app.logger.info(
            "Gerente %s reasignó %s reclutas a %s",
            current_user.email, len(reclutas), asesor_nombre
        )

        return jsonify({
            "success": True,
            "message": f"Se reasignaron {len(reclutas)} reclutas a {asesor_nombre}",
            "cambios": cambios
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Error en bulk-assign gerente: %s", str(e), exc_info=True)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500


@gerente_panel_bp.route('/gerente/panel/reclutas/<int:recluta_id>/assign', methods=['POST'])
@gerente_required
def gerente_assign_single(recluta_id):
    """
    Reasigna un recluta individual a uno de los asesores del equipo del gerente.
    """
    try:
        data = request.get_json()
        nuevo_asesor_id = data.get('asesor_id')

        asesores, asesor_ids, team_ids = _get_gerente_team_ids(current_user.id)

        recluta = Recluta.query.get(recluta_id)
        if not recluta:
            return jsonify({"success": False, "message": "Recluta no encontrado."}), 404

        if recluta.asesor_id not in team_ids:
            return jsonify({"success": False, "message": "Este recluta no pertenece a tu equipo."}), 403

        if nuevo_asesor_id is not None:
            if nuevo_asesor_id not in asesor_ids:
                return jsonify({"success": False, "message": "El asesor destino no pertenece a tu equipo."}), 403
            asesor_obj = next((a for a in asesores if a.id == nuevo_asesor_id), None)
            asesor_nombre = asesor_obj.nombre if asesor_obj else "Desconocido"
        else:
            asesor_nombre = "Sin asignar"

        anterior = recluta.asesor.nombre if recluta.asesor else "Sin asignar"
        recluta.asesor_id = nuevo_asesor_id
        db.session.commit()

        current_app.logger.info(
            "Gerente %s cambió asesor de %s: %s → %s",
            current_user.email, recluta.folio, anterior, asesor_nombre
        )

        return jsonify({
            "success": True,
            "message": f"Asesor cambiado de '{anterior}' a '{asesor_nombre}'",
            "cambio": {
                "recluta": recluta.nombre,
                "folio": recluta.folio,
                "asesor_anterior": anterior,
                "asesor_nuevo": asesor_nombre
            }
        })

    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Error en assign-single gerente: %s", str(e), exc_info=True)
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500
