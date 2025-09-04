"""
E2E: Verifica que la timeline pública de seguimiento
exhiba únicamente eventos personalizados del recluta.

Pasos:
- Crea un Recluta de prueba.
- Crea un EventoRecluta asociado (title/status/date).
- GET /api/tracking/<folio>/timeline debe incluir 'custom_events' con el evento creado.
- GET /seguimiento renderiza correctamente (smoke test del HTML).
"""

import os
import sys
from datetime import date

# Asegurar path raíz
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app_factory import create_app
from models import db
from models.recluta import Recluta
from models.evento_recluta import EventoRecluta


def run():
    app = create_app('testing')

    with app.app_context():
        # Crear un recluta de prueba
        recluta = Recluta(
            nombre='Candidato Timeline',
            email='timeline.e2e@example.com',
            telefono='5550001111',
            estado='En proceso',
            puesto='Tester',
            notas='Creado por e2e_tracking_custom_events'
        )
        db.session.add(recluta)
        db.session.commit()

        # Crear un evento personalizado
        ev = EventoRecluta(
            recluta_id=recluta.id,
            fecha=date.today(),
            estado='pending',
            titulo='E2E Evento Personalizado',
            descripcion='Evento creado por prueba E2E'
        )
        db.session.add(ev)
        db.session.commit()

        folio = recluta.folio

    client = app.test_client()

    # 1) GET /api/tracking/<folio>/timeline
    resp = client.get(f'/api/tracking/{folio}/timeline')
    assert resp.status_code == 200, f"timeline status {resp.status_code}: {resp.data}"
    j = resp.get_json() or {}
    assert j.get('success') is True, f"success False: {j}"
    assert j.get('folio') == folio, "folio no coincide"
    assert j.get('has_custom_events') is True, f"Se esperaban eventos: {j}"
    assert j.get('custom_events_count', 0) >= 1, f"Conteo de eventos incorrecto: {j}"

    events = j.get('custom_events') or []
    titles = [e.get('title') for e in events]
    assert 'E2E Evento Personalizado' in titles, f"Evento no encontrado: {events}"

    # 2) GET /seguimiento (smoke render)
    page = client.get('/seguimiento')
    assert page.status_code == 200, f"seguimiento render status {page.status_code}"
    html = page.data.decode('utf-8', errors='ignore')
    # Verifica elementos base de la página
    assert 'Consulta tu Estado' in html or 'Folio de Seguimiento' in html, 'Contenido esperado no encontrado en seguimiento.html'

    print('OK: Timeline pública con eventos personalizados verificada')


if __name__ == '__main__':
    run()

