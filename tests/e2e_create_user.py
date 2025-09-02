"""
E2E: Crear usuario como administrador usando el test client de Flask.

Flujo:
1) Crear app en modo testing e inicializar DB (create_app('testing'))
2) Login admin (admin@example.com / admin)
3) POST /admin/usuarios para crear usuario de prueba
4) GET /admin/usuarios para verificar presencia
5) DELETE /admin/usuarios/<id> para limpiar
"""

import os
import sys

# Asegurar que el directorio raíz del proyecto esté en sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from app_factory import create_app
from models import db
from models.usuario import Usuario


def run():
    app = create_app('testing')

    test_email = 'e2e_user@example.com'
    test_password = 'e2e_password_123'

    with app.app_context():
        # Asegurar que no exista previamente
        existing = Usuario.query.filter_by(email=test_email).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

    client = app.test_client()

    # 1) Login admin
    resp = client.post('/auth/login', json={'email': 'admin@example.com', 'password': 'admin'})
    assert resp.status_code == 200, f"Login admin falló: {resp.status_code} {resp.data}"
    j = resp.get_json() or {}
    assert j.get('success') is True, f"Login admin no success: {j}"

    # 2) Crear usuario
    payload = {
        'nombre': 'E2E Test User',
        'email': test_email,
        'password': test_password,
        'rol': 'user'
    }
    resp = client.post('/admin/usuarios', json=payload)
    assert resp.status_code in (200, 201), f"Crear usuario status inesperado: {resp.status_code} {resp.data}"
    j = resp.get_json() or {}
    assert j.get('success') is True, f"Crear usuario no success: {j}"
    created = j.get('usuario') or {}
    created_id = created.get('id')
    assert created.get('email') == test_email and created_id, f"Usuario creado inválido: {created}"

    # 3) Verificar en listado
    resp = client.get('/admin/usuarios')
    assert resp.status_code == 200, f"Listar usuarios falló: {resp.status_code} {resp.data}"
    j = resp.get_json() or {}
    assert j.get('success') is True and isinstance(j.get('usuarios'), list), f"Lista inválida: {j}"
    emails = [u.get('email') for u in j['usuarios']]
    assert test_email in emails, f"Usuario no aparece en listado: {emails}"

    # 4) Limpieza: eliminar
    del_resp = client.delete(f'/admin/usuarios/{created_id}')
    assert del_resp.status_code == 200, f"Eliminar usuario falló: {del_resp.status_code} {del_resp.data}"
    dj = del_resp.get_json() or {}
    assert dj.get('success') is True, f"Eliminar usuario no success: {dj}"

    print('OK: Flujo E2E de creación de usuario completado')


if __name__ == '__main__':
    run()
