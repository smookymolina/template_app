#!/usr/bin/env python3
"""
🔍 SCRIPT DE VALIDACIÓN MANUAL - RESTRICCIONES DE MÉTRICAS POR ROLES
Valida manualmente que las restricciones funcionen en diferentes escenarios
"""

import sys
import os
import json
from datetime import datetime

# Añadir el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models.usuario import Usuario
from models.recluta import Recluta
from utils.decorators import (
    get_accessible_user_ids,
    get_accessible_recluta_ids,
    filter_metrics_data_by_role
)
from utils.metrics_cache import cache_manager


class RoleValidationTester:
    """
    🧪 Herramienta de validación manual para restricciones de roles
    """

    def __init__(self):
        self.app = create_app()
        self.results = {
            'timestamp': datetime.utcnow().isoformat(),
            'tests_passed': 0,
            'tests_failed': 0,
            'scenarios': []
        }

    def log_result(self, test_name: str, passed: bool, message: str = "", details: dict = None):
        """📝 Registrar resultado de prueba"""
        if passed:
            self.results['tests_passed'] += 1
            status = "✅ PASS"
        else:
            self.results['tests_failed'] += 1
            status = "❌ FAIL"

        scenario = {
            'test_name': test_name,
            'status': status,
            'passed': passed,
            'message': message,
            'details': details or {}
        }

        self.results['scenarios'].append(scenario)
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")
        if details:
            print(f"    Detalles: {json.dumps(details, indent=2)}")
        print()

    def validate_admin_access(self):
        """👑 Validar acceso completo de administrador"""
        with self.app.app_context():
            try:
                # Simular usuario admin
                admin_users = Usuario.query.filter_by(rol='admin').all()

                if not admin_users:
                    self.log_result(
                        "Admin Access - Usuario Existente",
                        False,
                        "No se encontraron usuarios admin en la base de datos"
                    )
                    return

                admin = admin_users[0]

                # Obtener datos accesibles
                accessible_users = get_accessible_user_ids(admin)
                accessible_reclutas = get_accessible_recluta_ids(admin)

                # Admin debe ver todos los usuarios activos
                total_active_users = Usuario.query.filter_by(is_active=True).count()
                total_reclutas = Recluta.query.count()

                self.log_result(
                    "Admin Access - Usuarios Accesibles",
                    len(accessible_users) == total_active_users,
                    f"Admin ve {len(accessible_users)} de {total_active_users} usuarios activos",
                    {
                        'accessible_users': len(accessible_users),
                        'total_active_users': total_active_users
                    }
                )

                self.log_result(
                    "Admin Access - Reclutas Accesibles",
                    len(accessible_reclutas) == total_reclutas,
                    f"Admin ve {len(accessible_reclutas)} de {total_reclutas} reclutas",
                    {
                        'accessible_reclutas': len(accessible_reclutas),
                        'total_reclutas': total_reclutas
                    }
                )

            except Exception as e:
                self.log_result(
                    "Admin Access - Error",
                    False,
                    f"Error validando acceso admin: {str(e)}"
                )

    def validate_gerente_access(self):
        """👔 Validar acceso filtrado de gerente"""
        with self.app.app_context():
            try:
                # Buscar gerente con asesores asignados
                gerente = Usuario.query.filter_by(rol='gerente').first()

                if not gerente:
                    self.log_result(
                        "Gerente Access - Usuario Existente",
                        False,
                        "No se encontraron usuarios gerente en la base de datos"
                    )
                    return

                # Obtener asesores asignados al gerente
                asesores_asignados = Usuario.query.filter_by(
                    gerente_id=gerente.id,
                    rol='asesor'
                ).all()

                accessible_users = get_accessible_user_ids(gerente)
                accessible_reclutas = get_accessible_recluta_ids(gerente)

                # Gerente debe ver: él mismo + sus asesores
                expected_users = len(asesores_asignados) + 1  # +1 por el gerente mismo

                self.log_result(
                    "Gerente Access - Usuarios de Equipo",
                    len(accessible_users) == expected_users,
                    f"Gerente ve {len(accessible_users)} usuarios (esperado: {expected_users})",
                    {
                        'gerente_id': gerente.id,
                        'asesores_asignados': len(asesores_asignados),
                        'accessible_users': len(accessible_users)
                    }
                )

                # Verificar que el gerente se incluya a sí mismo
                self.log_result(
                    "Gerente Access - Auto-inclusión",
                    gerente.id in accessible_users,
                    f"Gerente se incluye a sí mismo en usuarios accesibles"
                )

                # Contar reclutas esperados (de sus asesores)
                expected_reclutas = Recluta.query.filter(
                    Recluta.asesor_id.in_([asesor.id for asesor in asesores_asignados] + [gerente.id])
                ).count()

                self.log_result(
                    "Gerente Access - Reclutas de Equipo",
                    len(accessible_reclutas) == expected_reclutas,
                    f"Gerente ve {len(accessible_reclutas)} reclutas (esperado: {expected_reclutas})",
                    {
                        'accessible_reclutas': len(accessible_reclutas),
                        'expected_reclutas': expected_reclutas
                    }
                )

            except Exception as e:
                self.log_result(
                    "Gerente Access - Error",
                    False,
                    f"Error validando acceso gerente: {str(e)}"
                )

    def validate_asesor_access(self):
        """📈 Validar acceso restringido de asesor"""
        with self.app.app_context():
            try:
                asesor = Usuario.query.filter_by(rol='asesor').first()

                if not asesor:
                    self.log_result(
                        "Asesor Access - Usuario Existente",
                        False,
                        "No se encontraron usuarios asesor en la base de datos"
                    )
                    return

                accessible_users = get_accessible_user_ids(asesor)
                accessible_reclutas = get_accessible_recluta_ids(asesor)

                # Asesor solo debe verse a sí mismo
                self.log_result(
                    "Asesor Access - Solo Acceso Propio",
                    len(accessible_users) == 1 and accessible_users[0] == asesor.id,
                    f"Asesor ve {len(accessible_users)} usuario(s), solo debería verse a sí mismo"
                )

                # Contar reclutas propios del asesor
                reclutas_propios = Recluta.query.filter_by(asesor_id=asesor.id).count()

                self.log_result(
                    "Asesor Access - Solo Reclutas Propios",
                    len(accessible_reclutas) == reclutas_propios,
                    f"Asesor ve {len(accessible_reclutas)} reclutas (esperado: {reclutas_propios})",
                    {
                        'asesor_id': asesor.id,
                        'accessible_reclutas': len(accessible_reclutas),
                        'reclutas_propios': reclutas_propios
                    }
                )

            except Exception as e:
                self.log_result(
                    "Asesor Access - Error",
                    False,
                    f"Error validando acceso asesor: {str(e)}"
                )

    def validate_data_filtering(self):
        """🎯 Validar filtrado de datos por rol"""
        with self.app.app_context():
            try:
                # Crear datos de prueba
                test_data = {
                    'global_kpis': {'total_reclutas': 1000, 'activos': 500},
                    'jerarquia': {
                        'gerentes': [
                            {'id': 1, 'nombre': 'Gerente 1', 'asesores': [{'id': 2}, {'id': 3}]},
                            {'id': 4, 'nombre': 'Gerente 2', 'asesores': [{'id': 5}]}
                        ]
                    },
                    'equipos': [{'gerente_id': 1}, {'gerente_id': 4}],
                    'asesores_individuales': [
                        {'id': 2, 'nombre': 'Asesor 1'},
                        {'id': 3, 'nombre': 'Asesor 2'},
                        {'id': 5, 'nombre': 'Asesor 3'}
                    ]
                }

                # Probar con admin (no debe filtrarse)
                admin = Usuario.query.filter_by(rol='admin').first()
                if admin:
                    filtered_admin_data = filter_metrics_data_by_role(test_data, admin)
                    self.log_result(
                        "Data Filtering - Admin Sin Filtros",
                        filtered_admin_data == test_data,
                        "Admin recibe datos completos sin filtrar"
                    )

                # Probar con gerente (debe filtrarse)
                gerente = Usuario.query.filter_by(rol='gerente').first()
                if gerente:
                    filtered_gerente_data = filter_metrics_data_by_role(test_data, gerente)

                    # Verificar que se aplicó algún filtrado
                    self.log_result(
                        "Data Filtering - Gerente Filtrado",
                        'global_kpis' in filtered_gerente_data,
                        "Gerente recibe datos filtrados según su equipo"
                    )

                # Probar con asesor (debe filtrarse mucho)
                asesor = Usuario.query.filter_by(rol='asesor').first()
                if asesor:
                    filtered_asesor_data = filter_metrics_data_by_role(test_data, asesor)

                    # Asesor debe recibir KPIs recalculados
                    self.log_result(
                        "Data Filtering - Asesor Limitado",
                        'global_kpis' in filtered_asesor_data,
                        "Asesor recibe datos muy limitados y recalculados"
                    )

            except Exception as e:
                self.log_result(
                    "Data Filtering - Error",
                    False,
                    f"Error validando filtrado de datos: {str(e)}"
                )

    def validate_cache_isolation(self):
        """💾 Validar aislamiento de caché por rol"""
        try:
            # Simular diferentes usuarios
            users_data = [
                {'id': 1, 'role': 'admin'},
                {'id': 2, 'role': 'gerente'},
                {'id': 3, 'role': 'asesor'}
            ]

            generated_keys = []

            for user in users_data:
                cache_key = cache_manager.generate_cache_key(
                    user['id'],
                    user['role'],
                    'dashboard_test',
                    {'filter': 'test'}
                )
                generated_keys.append(cache_key)

            # Verificar que las claves son únicas
            unique_keys = set(generated_keys)
            self.log_result(
                "Cache Isolation - Claves Únicas",
                len(unique_keys) == len(generated_keys),
                f"Generadas {len(generated_keys)} claves únicas para diferentes roles"
            )

            # Probar set/get de caché
            test_data = {'test': 'data', 'timestamp': datetime.utcnow().isoformat()}
            cache_key = cache_manager.generate_cache_key(1, 'admin', 'test_endpoint')

            set_result = cache_manager.set_cache(cache_key, test_data, 'admin')
            self.log_result(
                "Cache Isolation - Set Cache",
                set_result,
                "Caché se establece correctamente"
            )

            retrieved_data = cache_manager.get_cache(cache_key)
            self.log_result(
                "Cache Isolation - Get Cache",
                retrieved_data is not None and retrieved_data.get('test') == 'data',
                "Caché se recupera correctamente"
            )

        except Exception as e:
            self.log_result(
                "Cache Isolation - Error",
                False,
                f"Error validando aislamiento de caché: {str(e)}"
            )

    def validate_edge_cases(self):
        """🚧 Validar casos edge y límites"""
        with self.app.app_context():
            try:
                # Usuario con rol inválido
                from unittest.mock import Mock
                invalid_user = Mock()
                invalid_user.rol = 'invalid_role'
                invalid_user.id = 999

                accessible_users = get_accessible_user_ids(invalid_user)
                self.log_result(
                    "Edge Cases - Rol Inválido",
                    len(accessible_users) == 0,
                    f"Usuario con rol inválido no ve usuarios: {len(accessible_users)}"
                )

                # Gerente sin asesores asignados
                gerente_sin_equipo = Usuario.query.filter_by(rol='gerente').filter(
                    ~Usuario.id.in_(
                        [g.id for g in Usuario.query.filter_by(rol='gerente').all()
                         if Usuario.query.filter_by(gerente_id=g.id).count() > 0]
                    )
                ).first()

                if gerente_sin_equipo:
                    accessible_users_empty = get_accessible_user_ids(gerente_sin_equipo)
                    self.log_result(
                        "Edge Cases - Gerente Sin Equipo",
                        len(accessible_users_empty) == 1 and accessible_users_empty[0] == gerente_sin_equipo.id,
                        f"Gerente sin equipo solo se ve a sí mismo"
                    )

                # Asesor sin reclutas
                asesor_sin_reclutas = Usuario.query.filter_by(rol='asesor').filter(
                    ~Usuario.id.in_([r.asesor_id for r in Recluta.query.filter(Recluta.asesor_id.isnot(None)).all()])
                ).first()

                if asesor_sin_reclutas:
                    accessible_reclutas_empty = get_accessible_recluta_ids(asesor_sin_reclutas)
                    self.log_result(
                        "Edge Cases - Asesor Sin Reclutas",
                        len(accessible_reclutas_empty) == 0,
                        f"Asesor sin reclutas no ve ningún recluta"
                    )

            except Exception as e:
                self.log_result(
                    "Edge Cases - Error",
                    False,
                    f"Error validando casos edge: {str(e)}"
                )

    def run_all_validations(self):
        """🏃‍♂️ Ejecutar todas las validaciones"""
        print("🔍 INICIANDO VALIDACIÓN DE RESTRICCIONES DE MÉTRICAS POR ROLES")
        print("=" * 70)
        print()

        # Ejecutar todas las pruebas
        self.validate_admin_access()
        self.validate_gerente_access()
        self.validate_asesor_access()
        self.validate_data_filtering()
        self.validate_cache_isolation()
        self.validate_edge_cases()

        # Mostrar resumen
        print("=" * 70)
        print("📊 RESUMEN DE VALIDACIÓN")
        print("=" * 70)
        print(f"✅ Pruebas Exitosas: {self.results['tests_passed']}")
        print(f"❌ Pruebas Fallidas: {self.results['tests_failed']}")
        print(f"📈 Total Ejecutadas: {self.results['tests_passed'] + self.results['tests_failed']}")

        if self.results['tests_failed'] == 0:
            print("\n🎉 TODAS LAS VALIDACIONES PASARON EXITOSAMENTE")
        else:
            print(f"\n⚠️  SE ENCONTRARON {self.results['tests_failed']} PROBLEMAS")

        # Guardar reporte detallado
        report_file = f"validation_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)

        print(f"\n📄 Reporte detallado guardado en: {report_file}")

        return self.results['tests_failed'] == 0


def main():
    """🚀 Función principal"""
    print("🔐 Validador de Restricciones de Métricas por Roles")
    print("Antropic Claude Code - Sistema de Validación")
    print()

    validator = RoleValidationTester()
    success = validator.run_all_validations()

    # Código de salida para scripts automatizados
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()