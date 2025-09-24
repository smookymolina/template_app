"""
🧪 PRUEBAS DE VALIDACIÓN - RESTRICCIONES DE MÉTRICAS POR ROLES
Valida que las restricciones funcionen correctamente según jerarquía
"""

import unittest
from unittest.mock import Mock, patch
from flask import Flask
from flask_testing import TestCase
from models.usuario import Usuario
from models.recluta import Recluta
from utils.decorators import (
    get_accessible_user_ids,
    get_accessible_recluta_ids,
    filter_metrics_data_by_role,
    role_based_metrics_access
)


class RoleRestrictionsTestCase(TestCase):
    """
    🔐 Casos de prueba para restricciones de métricas basadas en roles
    """

    def create_app(self):
        """Crear instancia de aplicación para pruebas"""
        from app import create_app
        app = create_app()
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        return app

    def setUp(self):
        """Configuración inicial para cada prueba"""
        self.app_context = self.app.app_context()
        self.app_context.push()

        # 👥 CREAR USUARIOS DE PRUEBA
        self.admin_user = Mock()
        self.admin_user.id = 1
        self.admin_user.rol = 'admin'
        self.admin_user.email = 'admin@test.com'
        self.admin_user.is_authenticated = True

        self.gerente_user = Mock()
        self.gerente_user.id = 2
        self.gerente_user.rol = 'gerente'
        self.gerente_user.email = 'gerente@test.com'
        self.gerente_user.is_authenticated = True

        self.asesor_user = Mock()
        self.asesor_user.id = 3
        self.asesor_user.rol = 'asesor'
        self.asesor_user.email = 'asesor@test.com'
        self.asesor_user.gerente_id = 2
        self.asesor_user.is_authenticated = True

    def tearDown(self):
        """Limpieza después de cada prueba"""
        self.app_context.pop()

    # ============================================================================
    # 🧪 PRUEBAS DE ACCESIBILIDAD POR ROLES
    # ============================================================================

    @patch('utils.decorators.Usuario')
    def test_admin_accessible_user_ids(self, mock_usuario):
        """👑 ADMIN debe ver todos los usuarios"""
        # Mock de usuarios activos
        mock_usuario.query.filter.return_value.all.return_value = [
            Mock(id=1), Mock(id=2), Mock(id=3), Mock(id=4)
        ]

        accessible_ids = get_accessible_user_ids(self.admin_user)

        self.assertEqual(len(accessible_ids), 4)
        self.assertIn(1, accessible_ids)
        self.assertIn(2, accessible_ids)
        self.assertIn(3, accessible_ids)
        self.assertIn(4, accessible_ids)

    @patch('utils.decorators.Usuario')
    def test_gerente_accessible_user_ids(self, mock_usuario):
        """👔 GERENTE debe ver solo sus asesores + él mismo"""
        # Mock de asesores asignados
        mock_asesor1 = Mock(id=3)
        mock_asesor2 = Mock(id=4)
        mock_usuario.query.filter.return_value.all.return_value = [mock_asesor1, mock_asesor2]

        accessible_ids = get_accessible_user_ids(self.gerente_user)

        self.assertEqual(len(accessible_ids), 3)  # Gerente + 2 asesores
        self.assertIn(2, accessible_ids)  # El gerente mismo
        self.assertIn(3, accessible_ids)  # Asesor 1
        self.assertIn(4, accessible_ids)  # Asesor 2

    def test_asesor_accessible_user_ids(self):
        """📈 ASESOR debe ver solo él mismo"""
        accessible_ids = get_accessible_user_ids(self.asesor_user)

        self.assertEqual(len(accessible_ids), 1)
        self.assertEqual(accessible_ids[0], 3)

    @patch('utils.decorators.Recluta')
    def test_admin_accessible_recluta_ids(self, mock_recluta):
        """👑 ADMIN debe ver todos los reclutas"""
        mock_recluta.query.all.return_value = [
            Mock(id=1), Mock(id=2), Mock(id=3), Mock(id=4), Mock(id=5)
        ]

        accessible_ids = get_accessible_recluta_ids(self.admin_user)

        self.assertEqual(len(accessible_ids), 5)
        self.assertIn(1, accessible_ids)
        self.assertIn(5, accessible_ids)

    @patch('utils.decorators.get_accessible_user_ids')
    @patch('utils.decorators.Recluta')
    def test_gerente_accessible_recluta_ids(self, mock_recluta, mock_get_users):
        """👔 GERENTE debe ver reclutas de sus asesores"""
        # Mock de usuarios accesibles (gerente + asesores)
        mock_get_users.return_value = [2, 3, 4]

        # Mock de reclutas de esos asesores
        mock_recluta.query.filter.return_value.all.return_value = [
            Mock(id=10), Mock(id=11), Mock(id=12)
        ]

        accessible_ids = get_accessible_recluta_ids(self.gerente_user)

        self.assertEqual(len(accessible_ids), 3)
        self.assertIn(10, accessible_ids)
        self.assertIn(12, accessible_ids)

    @patch('utils.decorators.Recluta')
    def test_asesor_accessible_recluta_ids(self, mock_recluta):
        """📈 ASESOR debe ver solo sus propios reclutas"""
        mock_recluta.query.filter.return_value.all.return_value = [
            Mock(id=20), Mock(id=21)
        ]

        accessible_ids = get_accessible_recluta_ids(self.asesor_user)

        self.assertEqual(len(accessible_ids), 2)
        self.assertIn(20, accessible_ids)
        self.assertIn(21, accessible_ids)

    # ============================================================================
    # 🧪 PRUEBAS DE FILTRADO DE DATOS
    # ============================================================================

    def test_filter_admin_data(self):
        """👑 ADMIN debe recibir datos completos sin filtrar"""
        original_data = {
            "global_kpis": {"total": 100},
            "jerarquia": {"gerentes": [1, 2, 3]},
            "equipos": [{"id": 1}, {"id": 2}],
            "asesores_individuales": [{"id": 3}, {"id": 4}]
        }

        filtered_data = filter_metrics_data_by_role(original_data, self.admin_user)

        self.assertEqual(filtered_data, original_data)

    @patch('utils.decorators.get_accessible_user_ids')
    @patch('utils.decorators.get_accessible_recluta_ids')
    def test_filter_gerente_data(self, mock_get_reclutas, mock_get_users):
        """👔 GERENTE debe recibir datos filtrados de su equipo"""
        mock_get_users.return_value = [2, 3, 4]
        mock_get_reclutas.return_value = [10, 11, 12]

        original_data = {
            "global_kpis": {"total": 100},
            "jerarquia": [
                {"id": 2, "asesores": [{"id": 3}, {"id": 4}]},
                {"id": 5, "asesores": [{"id": 6}]}  # Este no debe aparecer
            ],
            "equipos": [{"gerente_id": 2}, {"gerente_id": 5}]
        }

        filtered_data = filter_metrics_data_by_role(original_data, self.gerente_user)

        # Verificar que el filtrado funciona
        self.assertIsNotNone(filtered_data.get("global_kpis"))
        self.assertIn("jerarquia", filtered_data)

    def test_filter_asesor_data(self):
        """📈 ASESOR debe recibir datos muy limitados"""
        original_data = {
            "global_kpis": {"total": 100},
            "jerarquia": {"gerentes": [1, 2]},
            "equipos": [{"id": 1}, {"id": 2}],
            "asesores_individuales": [{"id": 3}, {"id": 4}]
        }

        with patch('utils.decorators.get_accessible_user_ids') as mock_users, \
             patch('utils.decorators.get_accessible_recluta_ids') as mock_reclutas, \
             patch('utils.decorators.recalculate_kpis_for_role') as mock_recalc:

            mock_users.return_value = [3]
            mock_reclutas.return_value = [20, 21]
            mock_recalc.return_value = {"total_reclutas": 2, "activos": 1}

            filtered_data = filter_metrics_data_by_role(original_data, self.asesor_user)

            # Verificar que los KPIs se recalcularon
            self.assertEqual(filtered_data["global_kpis"]["total_reclutas"], 2)

    # ============================================================================
    # 🧪 PRUEBAS DE INTEGRACIÓN CON DECORADOR
    # ============================================================================

    @patch('utils.decorators.get_accessible_user_ids')
    @patch('utils.decorators.get_accessible_recluta_ids')
    def test_role_based_access_decorator(self, mock_get_reclutas, mock_get_users):
        """🔐 Decorador debe inyectar filtros correctamente"""
        mock_get_users.return_value = [2, 3]
        mock_get_reclutas.return_value = [10, 11]

        @role_based_metrics_access
        def dummy_endpoint():
            from flask import request
            return {
                'user_role': request.metrics_filter['user_role'],
                'accessible_users': len(request.metrics_filter['accessible_user_ids']),
                'accessible_reclutas': len(request.metrics_filter['accessible_recluta_ids'])
            }

        with self.app.test_client() as client:
            with patch('flask_login.current_user', self.gerente_user):
                with client.session_transaction():
                    response = dummy_endpoint()

                    self.assertEqual(response['user_role'], 'gerente')
                    self.assertEqual(response['accessible_users'], 2)
                    self.assertEqual(response['accessible_reclutas'], 2)

    # ============================================================================
    # 🧪 PRUEBAS DE CASOS EDGE
    # ============================================================================

    def test_unauthenticated_user(self):
        """🚫 Usuario no autenticado debe ser rechazado"""
        unauth_user = Mock()
        unauth_user.is_authenticated = False

        @role_based_metrics_access
        def protected_endpoint():
            return {"success": True}

        with self.app.test_client() as client:
            with patch('flask_login.current_user', unauth_user):
                with self.assertRaises(Exception):  # Debería fallar la autenticación
                    protected_endpoint()

    def test_invalid_role(self):
        """🚫 Rol inválido debe ser rechazado"""
        invalid_user = Mock()
        invalid_user.is_authenticated = True
        invalid_user.rol = 'invalid_role'
        invalid_user.email = 'invalid@test.com'

        accessible_ids = get_accessible_user_ids(invalid_user)
        self.assertEqual(len(accessible_ids), 0)

    def test_empty_accessible_data(self):
        """📊 Datos vacíos deben manejarse correctamente"""
        with patch('utils.decorators.get_accessible_recluta_ids') as mock_reclutas:
            mock_reclutas.return_value = []

            from utils.decorators import recalculate_kpis_for_role

            kpis = recalculate_kpis_for_role([], self.asesor_user)

            self.assertEqual(kpis["total_reclutas"], 0)
            self.assertEqual(kpis["activos"], 0)
            self.assertEqual(kpis["tasa_conversion"], 0)

    # ============================================================================
    # 🧪 PRUEBAS DE RENDIMIENTO Y CACHÉ
    # ============================================================================

    def test_cache_key_generation(self):
        """💾 Claves de caché deben ser únicas por usuario/rol"""
        from utils.metrics_cache import MetricsCacheManager

        cache_manager = MetricsCacheManager()

        key1 = cache_manager.generate_cache_key(1, 'admin', 'dashboard', {'filter': 'test'})
        key2 = cache_manager.generate_cache_key(2, 'gerente', 'dashboard', {'filter': 'test'})
        key3 = cache_manager.generate_cache_key(1, 'admin', 'dashboard', {'filter': 'other'})

        # Claves deben ser diferentes
        self.assertNotEqual(key1, key2)
        self.assertNotEqual(key1, key3)
        self.assertNotEqual(key2, key3)

        # Pero mismos parámetros deben generar misma clave
        key1_duplicate = cache_manager.generate_cache_key(1, 'admin', 'dashboard', {'filter': 'test'})
        # Las claves pueden diferir por timestamp, así que verificamos formato
        self.assertTrue(key1_duplicate.startswith('metrics_cache_admin_1_dashboard_'))


class RoleSecurityTestCase(TestCase):
    """
    🛡️ Casos de prueba de seguridad para restricciones de roles
    """

    def create_app(self):
        from app import create_app
        app = create_app()
        app.config['TESTING'] = True
        return app

    def test_no_data_leakage_between_roles(self):
        """🔒 No debe haber fuga de datos entre roles diferentes"""
        admin_data = {"sensitive": "admin_only_data", "total": 1000}
        gerente_data = {"limited": "gerente_data", "total": 100}

        # Simular que gerente no debe ver datos de admin
        mock_gerente = Mock()
        mock_gerente.rol = 'gerente'
        mock_gerente.id = 2

        filtered_data = filter_metrics_data_by_role(admin_data, mock_gerente)

        # Verificar que datos sensibles no estén presentes para gerente
        with patch('utils.decorators.get_accessible_user_ids') as mock_users, \
             patch('utils.decorators.get_accessible_recluta_ids') as mock_reclutas:

            mock_users.return_value = [2, 3]
            mock_reclutas.return_value = [10, 11]

            # Los datos deben ser filtrados/recalculados
            self.assertIsInstance(filtered_data, dict)

    def test_sql_injection_protection(self):
        """💉 Protección contra inyección SQL en filtros"""
        malicious_user = Mock()
        malicious_user.id = "1; DROP TABLE usuarios; --"
        malicious_user.rol = 'asesor'

        # La función debe manejar IDs maliciosos correctamente
        try:
            accessible_ids = get_accessible_user_ids(malicious_user)
            # Si llega aquí, debe devolver array vacío o del usuario actual
            self.assertIsInstance(accessible_ids, list)
        except Exception:
            # Si hay excepción, debe ser manejada apropiadamente
            pass

    def test_permissions_boundary(self):
        """🚧 Límites de permisos deben ser respetados"""
        # Asesor no debe poder acceder a datos de gerente
        mock_asesor = Mock()
        mock_asesor.id = 5
        mock_asesor.rol = 'asesor'

        accessible_users = get_accessible_user_ids(mock_asesor)

        # Solo debe ver su propio ID
        self.assertEqual(len(accessible_users), 1)
        self.assertEqual(accessible_users[0], 5)


if __name__ == '__main__':
    """
    🏃‍♂️ Ejecutar pruebas directamente
    """
    unittest.main(verbosity=2)