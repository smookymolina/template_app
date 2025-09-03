"""
E2E: Verificar flujo de seguimiento por folio y endpoints públicos.

Casos:
- Crear un recluta de prueba y (opcional) una entrevista.
- GET /api/tracking/<folio> devuelve tracking_info.
- GET /api/tracking/<folio>/timeline devuelve timeline_items.
- POST /api/recuperar-folio devuelve el folio por email/teléfono.
- GET /verificar-folio/<folio> indica existencia.
- GET /seguimiento renderiza la página pública.
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
from models.entrevista import Entrevista


def run():
    app = create_app('testing')

    with app.app_context():
        # Crear un recluta de prueba
        recluta = Recluta(
            nombre='Candidato Prueba',
            email='candidato.prueba@example.com',
            telefono='5551234567',
            estado='En proceso',
            puesto='Analista QA',
            notas='Creado por e2e_tracking'
        )
        db.session.add(recluta)
        db.session.commit()

        # Crear una entrevista pendiente (para proxima_entrevista)
        entrevista = Entrevista(
            recluta_id=recluta.id,
            fecha=date.today(),
            hora='10:00',
            tipo='virtual',
            estado='pendiente',
            notas='Entrevista inicial'
        )
        db.session.add(entrevista)
        db.session.commit()

        folio = recluta.folio

    client = app.test_client()

    # 1) GET /api/tracking/<folio>
    resp = client.get(f'/api/tracking/{folio}')
    assert resp.status_code == 200, f"tracking status {resp.status_code}: {resp.data}"
    j = resp.get_json() or {}
    assert j.get('success') is True, f"tracking success False: {j}"
    info = j.get('tracking_info') or {}
    assert info.get('nombre') == 'Candidato Prueba', f"nombre inesperado: {info}"
    assert info.get('estado') == 'En proceso', f"estado inesperado: {info}"
    # Proxima entrevista opcionalmente presente

    # 2) GET /api/tracking/<folio>/timeline
    resp2 = client.get(f'/api/tracking/{folio}/timeline')
    assert resp2.status_code == 200, f"timeline status {resp2.status_code}: {resp2.data}"
    j2 = resp2.get_json() or {}
    assert j2.get('success') is True and 'timeline_items' in j2, f"timeline inválido: {j2}"
    assert j2.get('folio') == folio, "folio en timeline no coincide"

    # 3) POST /api/recuperar-folio
    payload = {"email": "candidato.prueba@example.com", "telefono": "5551234567"}
    resp3 = client.post('/api/recuperar-folio', json=payload)
    assert resp3.status_code in (200, 201), f"recuperar-folio status {resp3.status_code}: {resp3.data}"
    j3 = resp3.get_json() or {}
    assert j3.get('success') is True and j3.get('folio') == folio, f"recuperar-folio inválido: {j3}"

    # 4) GET /verificar-folio/<folio>
    resp4 = client.get(f'/verificar-folio/{folio}')
    assert resp4.status_code == 200, f"verificar-folio status {resp4.status_code}: {resp4.data}"
    j4 = resp4.get_json() or {}
    assert j4.get('success') is True and j4.get('exists') is True, f"verificar-folio inválido: {j4}"

    # 5) GET /seguimiento (render)
    page = client.get('/seguimiento')
    assert page.status_code == 200, f"seguimiento render status {page.status_code}"
    html = page.data.decode('utf-8', errors='ignore')
    assert 'Folio de Seguimiento' in html or 'Consultar Estado' in html, 'Contenido esperado no encontrado en seguimiento.html'

    print('OK: Flujo E2E de seguimiento por folio verificado')


if __name__ == '__main__':
    run()

