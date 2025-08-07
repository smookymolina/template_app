"""
Routes para gestión del tutorial interactivo
Archivo: routes/tutorial.py
"""
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
import hashlib

tutorial_bp = Blueprint('tutorial', __name__)

# ──────────────────────────────────────────────────────────────────────────────
# Constantes y utilidades (evita literales duplicados y simplifica respuestas)
# ──────────────────────────────────────────────────────────────────────────────
ERR_INTERNAL = "Error interno del servidor"
MSG_TUTORIAL_DONE = "Tutorial marcado como completado"
MSG_TUTORIAL_RESET = "Tutorial reseteado correctamente"
MSG_EVENT_OK = "Evento registrado"
TUTORIAL_VERSION = "1.0"
PRIV_IP_LEN = 10                 # Truncamiento por privacidad

VALID_EVENTS = {
    "step_completed",
    "tutorial_started",
    "tutorial_skipped",
    "tutorial_completed",
}

def _ok(payload: dict, status: int = 200):
    """Respuesta JSON exitosa estándar."""
    base = {"success": True}
    base.update(payload)
    return jsonify(base), status

def _err(message: str = ERR_INTERNAL, status: int = 500):
    """Respuesta JSON de error estándar."""
    return jsonify({"success": False, "error": message}), status

def _safe_device_id(ip: str, user_agent: str) -> str:
    """Genera un ID de dispositivo sin exponer datos crudos."""
    h = hashlib.sha256(f"{ip}|{user_agent}".encode("utf-8")).hexdigest()
    return h[:20]

def _json():
    """Obtiene JSON del request de forma segura (sin lanzar excepción)."""
    return request.get_json(silent=True) or {}

# Rutas
# ──────────────────────────────────────────────────────────────────────────────
@tutorial_bp.route('/tutorial/status', methods=['GET'])
def get_tutorial_status():
    """
    Obtiene el estado del tutorial para el dispositivo actual.
    No requiere autenticación - portal público.
    """
    try:
        client_ip = request.remote_addr or ""
        user_agent = request.headers.get('User-Agent', '')
        device_id = _safe_device_id(client_ip, user_agent)

        current_app.logger.info(
            "Verificando estado tutorial para dispositivo: %s", device_id
        )

        # Backend no persiste estado; el frontend decide vía localStorage.
        return _ok({
            "should_show_tutorial": True,
            "device_id": device_id,
            "first_visit": True,
            "tutorial_version": TUTORIAL_VERSION,
        })
    except Exception as e:  # pylint: disable=broad-except
        current_app.logger.exception("Error obteniendo estado del tutorial: %s", e)
        # En caso de error, mostrar el tutorial por seguridad
        return jsonify({
            "success": False,
            "error": ERR_INTERNAL,
            "should_show_tutorial": True
        }), 500

@tutorial_bp.route('/tutorial/complete', methods=['POST'])
def mark_tutorial_complete():
    """
    Marca el tutorial como completado para el dispositivo actual.
    No requiere autenticación - portal público.
    """
    try:
        client_ip = request.remote_addr or ""
        current_app.logger.info(
            "Tutorial completado - IP: %s, Timestamp: %s",
            (client_ip[:PRIV_IP_LEN]),
            datetime.now().isoformat()
        )

        return _ok({
            "message": MSG_TUTORIAL_DONE,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:  # pylint: disable=broad-except
        current_app.logger.exception("Error marcando tutorial como completado: %s", e)
        return _err()

@tutorial_bp.route('/tutorial/reset', methods=['POST'])
def reset_tutorial():
    """
    Reinicia el tutorial para el dispositivo actual.
    Útil para testing o para usuarios que quieren verlo de nuevo.
    """
    try:
        client_ip = request.remote_addr or ""
        current_app.logger.info("Tutorial reseteado - IP: %s", client_ip[:PRIV_IP_LEN])

        return _ok({
            "message": MSG_TUTORIAL_RESET,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:  # pylint: disable=broad-except
        current_app.logger.exception("Error reseteando tutorial: %s", e)
        return _err()

@tutorial_bp.route('/tutorial/analytics', methods=['POST'])
def tutorial_analytics():
    """
    Recibe eventos de analytics del tutorial para métricas.

    Body JSON esperado:
    {
        "event": "step_completed|tutorial_started|tutorial_skipped|tutorial_completed",
        "step": int (opcional),
        "time_spent": int (ms, opcional)
    }
    """
    try:
        payload = _json()
        event = payload.get("event")

        if not event:
            return _err("Evento requerido", 400)
        if event not in VALID_EVENTS:
            return _err("Evento no permitido", 400)

        step = payload.get("step")
        time_spent = payload.get("time_spent")

        # Validaciones ligeras (evita complejidad innecesaria)
        if step is not None and (not isinstance(step, int) or step < 0):
            return _err("Valor 'step' inválido", 400)
        if time_spent is not None and (not isinstance(time_spent, int) or time_spent < 0):
            return _err("Valor 'time_spent' inválido", 400)

        log_data = {
            "event": event,
            "step": step,
            "time_spent": time_spent,
            "timestamp": datetime.now().isoformat(),
            "ip": (request.remote_addr or "")[:PRIV_IP_LEN],
        }
        current_app.logger.info("Tutorial Analytics: %s", log_data)

        return _ok({"message": MSG_EVENT_OK})
    except Exception as e:  # pylint: disable=broad-except
        current_app.logger.exception("Error en analytics de tutorial: %s", e)
        return _err()
