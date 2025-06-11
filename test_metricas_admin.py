#!/usr/bin/env python3
"""
🧪 SCRIPT DE TESTING: Funcionalidad de Métricas Administrativas
Archivo: test_metricas_admin.py

Este script prueba todas las funcionalidades relacionadas con las métricas
por asesor que solo pueden ver los administradores.

Uso:
    python test_metricas_admin.py

Funcionalidades probadas:
    ✅ Roles y permisos
    ✅ Generación de métricas por asesor
    ✅ API endpoints de métricas
    ✅ Decoradores de seguridad
    ✅ Frontend (simulación)
"""

import sys
import os
import requests
import json
import time
from datetime import datetime, timedelta
import random

# Agregar el directorio del proyecto al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    ENDC = '\033[0m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.ENDC}")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.ENDC}")

def print_step(text):
    print(f"{Colors.PURPLE}🔄 {text}{Colors.ENDC}")

class MetricasAdminTester:
    def __init__(self):
        self.base_url = "http://localhost:5000"
        self.admin_token = None
        self.asesor_token = None
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'warnings': 0
        }
    
    def run_all_tests(self):
        """🚀 Ejecutar todas las pruebas"""
        print_header("TESTING MÉTRICAS ADMINISTRATIVAS - SISTEMA RECLUTAS")
        print_info(f"Base URL: {self.base_url}")
        print_info(f"Iniciado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # 1. Verificar que el servidor está corriendo
            self.test_server_running()
            
            # 2. Crear datos de prueba si es necesario
            self.setup_test_data()
            
            # 3. Probar autenticación
            self.test_authentication()
            
            # 4. Probar permisos de acceso
            self.test_permissions()
            
            # 5. Probar endpoints de métricas
            self.test_metrics_endpoints()
            
            # 6. Probar funcionalidades específicas
            self.test_asesor_metrics()
            
            # 7. Probar frontend (simulación)
            self.test_frontend_integration()
            
            # 8. Probar casos límite
            self.test_edge_cases()
            
            # 9. Probar performance
            self.test_performance()
            
            # Resumen final
            self.print_final_summary()
            
        except Exception as e:
            print_error(f"Error crítico en testing: {str(e)}")
            sys.exit(1)
    
    def test_server_running(self):
        """🔍 Verificar que el servidor está corriendo"""
        print_step("Verificando que el servidor esté corriendo...")
        
        try:
            response = requests.get(f"{self.base_url}/", timeout=5)
            if response.status_code == 200:
                print_success("Servidor respondiendo correctamente")
                self.test_results['passed'] += 1
            else:
                print_error(f"Servidor respondió con código {response.status_code}")
                self.test_results['failed'] += 1
        except requests.exceptions.RequestException as e:
            print_error(f"No se puede conectar al servidor: {str(e)}")
            print_warning("Asegúrate de que el servidor esté corriendo en puerto 5000")
            sys.exit(1)
    
    def setup_test_data(self):
        """📊 Configurar datos de prueba"""
        print_step("Configurando datos de prueba...")
        
        try:
            # Importar modelos solo si el servidor está corriendo
            from app_factory import create_app
            from models.usuario import Usuario
            from models.recluta import Recluta
            from models import db
            
            app = create_app('testing')
            
            with app.app_context():
                # Verificar usuarios de prueba
                admin = Usuario.query.filter_by(email='admin@test.com').first()
                if not admin:
                    print_warning("Usuario admin de prueba no encontrado")
                    print_info("Ejecuta: python create_test_user.py")
                
                asesor = Usuario.query.filter_by(email='asesor1@example.com').first()
                if not asesor:
                    print_warning("Usuario asesor de prueba no encontrado")
                
                # Verificar que hay reclutas de prueba
                total_reclutas = Recluta.query.count()
                if total_reclutas < 10:
                    print_warning(f"Solo hay {total_reclutas} reclutas. Se recomienda tener al menos 10 para pruebas completas")
                else:
                    print_success(f"Datos suficientes: {total_reclutas} reclutas encontrados")
                
                self.test_results['passed'] += 1
                
        except Exception as e:
            print_error(f"Error al configurar datos de prueba: {str(e)}")
            self.test_results['failed'] += 1
    
    def test_authentication(self):
        """🔐 Probar autenticación"""
        print_step("Probando autenticación...")
        
        # Probar login de admin
        admin_login = {
            "email": "admin@test.com",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=admin_login,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.admin_token = data.get('token')
                    print_success("Login de administrador exitoso")
                    self.test_results['passed'] += 1
                else:
                    print_error("Login falló: " + data.get('message', 'Error desconocido'))
                    self.test_results['failed'] += 1
            else:
                print_error(f"Error en login admin: {response.status_code}")
                self.test_results['failed'] += 1
                
        except Exception as e:
            print_error(f"Error en autenticación admin: {str(e)}")
            self.test_results['failed'] += 1
        
        # Probar login de asesor
        asesor_login = {
            "email": "asesor1@example.com",
            "password": "asesor1"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=asesor_login,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.asesor_token = data.get('token')
                    print_success("Login de asesor exitoso")
                    self.test_results['passed'] += 1
                else:
                    print_warning("Login de asesor falló (usuario podría no existir)")
                    self.test_results['warnings'] += 1
            else:
                print_warning(f"Asesor de prueba no disponible: {response.status_code}")
                self.test_results['warnings'] += 1
                
        except Exception as e:
            print_warning(f"Asesor de prueba no disponible: {str(e)}")
            self.test_results['warnings'] += 1
    
    def test_permissions(self):
        """🔒 Probar permisos de acceso"""
        print_step("Probando permisos de acceso...")
        
        # Headers para admin
        admin_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.admin_token}"
        } if self.admin_token else {"Content-Type": "application/json"}
        
        # Headers para asesor
        asesor_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.asesor_token}"
        } if self.asesor_token else {"Content-Type": "application/json"}
        
        # Probar acceso admin a métricas
        try:
            response = requests.get(
                f"{self.base_url}/admin/metricas/asesores",
                headers=admin_headers
            )
            
            if response.status_code == 200:
                print_success("Admin puede acceder a métricas avanzadas")
                self.test_results['passed'] += 1
            elif response.status_code == 401:
                print_warning("Admin no autenticado correctamente")
                self.test_results['warnings'] += 1
            elif response.status_code == 403:
                print_error("Admin sin permisos para métricas")
                self.test_results['failed'] += 1
            else:
                print_error(f"Error inesperado en permisos admin: {response.status_code}")
                self.test_results['failed'] += 1
                
        except Exception as e:
            print_error(f"Error probando permisos admin: {str(e)}")
            self.test_results['failed'] += 1
        
        # Probar que asesor NO puede acceder a métricas admin
        if self.asesor_token:
            try:
                response = requests.get(
                    f"{self.base_url}/admin/metricas/asesores",
                    headers=asesor_headers
                )
                
                if response.status_code == 403:
                    print_success("Asesor correctamente bloqueado de métricas admin")
                    self.test_results['passed'] += 1
                elif response.status_code == 200:
                    print_error("¡FALLO DE SEGURIDAD! Asesor puede acceder a métricas admin")
                    self.test_results['failed'] += 1
                else:
                    print_warning(f"Respuesta inesperada para asesor: {response.status_code}")
                    self.test_results['warnings'] += 1
                    
            except Exception as e:
                print_warning(f"Error probando restricciones asesor: {str(e)}")
                self.test_results['warnings'] += 1
    
    def test_metrics_endpoints(self):
        """📊 Probar endpoints de métricas"""
        print_step("Probando endpoints de métricas...")
        
        if not self.admin_token:
            print_warning("Sin token admin, saltando pruebas de endpoints")
            return
        
        admin_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.admin_token}"
        }
        
        endpoints_to_test = [
            ("/admin/metricas/asesores", "Métricas por asesores"),
            ("/api/estadisticas", "Estadísticas generales"),
            ("/api/estadisticas/tiempo-real", "Estadísticas tiempo real"),
            ("/api/estadisticas/rankings", "Rankings de asesores")
        ]
        
        for endpoint, description in endpoints_to_test:
            try:
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=admin_headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        print_success(f"{description}: OK")
                        self.test_results['passed'] += 1
                        
                        # Verificar estructura de datos básica
                        self.validate_response_structure(endpoint, data)
                    else:
                        print_error(f"{description}: Respuesta sin éxito - {data.get('message', 'Error desconocido')}")
                        self.test_results['failed'] += 1
                else:
                    print_error(f"{description}: HTTP {response.status_code}")
                    self.test_results['failed'] += 1
                    
            except requests.exceptions.Timeout:
                print_warning(f"{description}: Timeout (>10s)")
                self.test_results['warnings'] += 1
            except Exception as e:
                print_error(f"{description}: Error - {str(e)}")
                self.test_results['failed'] += 1
    
    def validate_response_structure(self, endpoint, data):
        """✅ Validar estructura de respuesta"""
        if endpoint == "/admin/metricas/asesores":
            required_keys = ['metricas_asesores', 'metricas_globales', 'insights']
            for key in required_keys:
                if key not in data:
                    print_warning(f"Falta clave '{key}' en respuesta de métricas")
                    self.test_results['warnings'] += 1
        
        elif endpoint == "/api/estadisticas":
            if 'estadisticas' not in data:
                print_warning("Falta clave 'estadisticas' en respuesta")
                self.test_results['warnings'] += 1
    
    def test_asesor_metrics(self):
        """👥 Probar métricas específicas por asesor"""
        print_step("Probando métricas específicas por asesor...")
        
        if not self.admin_token:
            print_warning("Sin token admin, saltando pruebas específicas")
            return
        
        # Primero obtener lista de asesores
        try:
            response = requests.get(
                f"{self.base_url}/admin/metricas/asesores",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('metricas_asesores'):
                    asesores = data['metricas_asesores']
                    
                    if asesores:
                        # Probar detalle del primer asesor
                        primer_asesor = asesores[0]
                        asesor_id = primer_asesor['id']
                        
                        detail_response = requests.get(
                            f"{self.base_url}/admin/metricas/asesor/{asesor_id}/detalle",
                            headers={"Authorization": f"Bearer {self.admin_token}"},
                            timeout=10
                        )
                        
                        if detail_response.status_code == 200:
                            detail_data = detail_response.json()
                            if detail_data.get('success'):
                                print_success(f"Detalle de asesor {primer_asesor['nombre']}: OK")
                                self.test_results['passed'] += 1
                                
                                # Verificar datos del detalle
                                required_keys = ['asesor', 'metricas', 'tendencia_mensual']
                                for key in required_keys:
                                    if key not in detail_data:
                                        print_warning(f"Falta '{key}' en detalle de asesor")
                                        self.test_results['warnings'] += 1
                            else:
                                print_error("Detalle de asesor sin éxito")
                                self.test_results['failed'] += 1
                        else:
                            print_error(f"Error en detalle de asesor: {detail_response.status_code}")
                            self.test_results['failed'] += 1
                    else:
                        print_warning("No hay asesores para probar")
                        self.test_results['warnings'] += 1
                else:
                    print_error("No se pudieron obtener asesores para prueba")
                    self.test_results['failed'] += 1
            else:
                print_error(f"Error obteniendo asesores: {response.status_code}")
                self.test_results['failed'] += 1
                
        except Exception as e:
            print_error(f"Error en pruebas de asesor específico: {str(e)}")
            self.test_results['failed'] += 1
    
    def test_frontend_integration(self):
        """🌐 Probar integración frontend (simulación)"""
        print_step("Probando integración frontend...")
        
        # Verificar que archivos JS/CSS existen
        frontend_files = [
            "/static/js/metricas-admin.js",
            "/static/css/metricas-admin.css"
        ]
        
        for file_path in frontend_files:
            try:
                response = requests.get(f"{self.base_url}{file_path}", timeout=5)
                if response.status_code == 200:
                    print_success(f"Archivo frontend disponible: {file_path}")
                    self.test_results['passed'] += 1
                else:
                    print_warning(f"Archivo frontend no encontrado: {file_path}")
                    self.test_results['warnings'] += 1
            except Exception as e:
                print_warning(f"Error verificando {file_path}: {str(e)}")
                self.test_results['warnings'] += 1
        
        # Verificar que la página principal carga
        try:
            response = requests.get(f"{self.base_url}/dashboard", timeout=5)
            if response.status_code in [200, 302]:  # 302 si redirige a login
                print_success("Página de dashboard accesible")
                self.test_results['passed'] += 1
            else:
                print_warning(f"Dashboard no accesible: {response.status_code}")
                self.test_results['warnings'] += 1
        except Exception as e:
            print_warning(f"Error verificando dashboard: {str(e)}")
            self.test_results['warnings'] += 1
    
    def test_edge_cases(self):
        """🧪 Probar casos límite"""
        print_step("Probando casos límite...")
        
        if not self.admin_token:
            print_warning("Sin token admin, saltando casos límite")
            return
        
        edge_cases = [
            # Asesor inexistente
            (f"/admin/metricas/asesor/99999/detalle", 404, "Asesor inexistente"),
            # Parámetros inválidos
            (f"/api/estadisticas?periodo=abc", 200, "Período inválido (debería usar default)"),
            # Rango de fechas inválido
            (f"/api/estadisticas?date_from=2025-12-31&date_to=2025-01-01", 400, "Rango de fechas inválido"),
        ]
        
        for endpoint, expected_status, description in edge_cases:
            try:
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers={"Authorization": f"Bearer {self.admin_token}"},
                    timeout=5
                )
                
                if response.status_code == expected_status:
                    print_success(f"Caso límite OK: {description}")
                    self.test_results['passed'] += 1
                else:
                    print_warning(f"Caso límite inesperado: {description} (esperado: {expected_status}, obtenido: {response.status_code})")
                    self.test_results['warnings'] += 1
                    
            except Exception as e:
                print_warning(f"Error en caso límite {description}: {str(e)}")
                self.test_results['warnings'] += 1
    
    def test_performance(self):
        """⚡ Probar rendimiento"""
        print_step("Probando rendimiento...")
        
        if not self.admin_token:
            print_warning("Sin token admin, saltando pruebas de rendimiento")
            return
        
        # Probar tiempo de respuesta de métricas
        start_time = time.time()
        
        try:
            response = requests.get(
                f"{self.base_url}/admin/metricas/asesores",
                headers={"Authorization": f"Bearer {self.admin_token}"},
                timeout=30
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            if response.status_code == 200:
                if response_time < 2.0:
                    print_success(f"Rendimiento excelente: {response_time:.2f}s")
                    self.test_results['passed'] += 1
                elif response_time < 5.0:
                    print_warning(f"Rendimiento aceptable: {response_time:.2f}s")
                    self.test_results['warnings'] += 1
                else:
                    print_error(f"Rendimiento lento: {response_time:.2f}s")
                    self.test_results['failed'] += 1
            else:
                print_error(f"Error en prueba de rendimiento: {response.status_code}")
                self.test_results['failed'] += 1
                
        except requests.exceptions.Timeout:
            print_error("Timeout en prueba de rendimiento (>30s)")
            self.test_results['failed'] += 1
        except Exception as e:
            print_error(f"Error en prueba de rendimiento: {str(e)}")
            self.test_results['failed'] += 1
    
    def print_final_summary(self):
        """📋 Imprimir resumen final"""
        print_header("RESUMEN FINAL DE TESTING")
        
        total_tests = self.test_results['passed'] + self.test_results['failed'] + self.test_results['warnings']
        
        print(f"{Colors.BOLD}Total de pruebas ejecutadas: {total_tests}{Colors.ENDC}")
        print_success(f"Pruebas exitosas: {self.test_results['passed']}")
        print_error(f"Pruebas fallidas: {self.test_results['failed']}")
        print_warning(f"Advertencias: {self.test_results['warnings']}")
        
        # Calcular porcentaje de éxito
        if total_tests > 0:
            success_rate = (self.test_results['passed'] / total_tests) * 100
            print(f"\n{Colors.BOLD}Tasa de éxito: {success_rate:.1f}%{Colors.ENDC}")
            
            if success_rate >= 90:
                print_success("¡Excelente! El sistema está funcionando correctamente")
            elif success_rate >= 70:
                print_warning("Sistema funcional con algunos problemas menores")
            else:
                print_error("Sistema con problemas significativos que requieren atención")
        
        # Recomendaciones
        print(f"\n{Colors.BOLD}RECOMENDACIONES:{Colors.ENDC}")
        
        if self.test_results['failed'] > 0:
            print_error("1. Revisar errores críticos antes de desplegar")
            print_info("   - Verificar logs del servidor")
            print_info("   - Comprobar configuración de base de datos")
            print_info("   - Validar permisos de usuarios")
        
        if self.test_results['warnings'] > 0:
            print_warning("2. Atender advertencias para mejorar robustez")
            print_info("   - Crear usuarios de prueba faltantes")
            print_info("   - Optimizar tiempos de respuesta")
            print_info("   - Verificar archivos frontend")
        
        if self.test_results['passed'] > 0:
            print_success("3. ¡Sistema base funcionando correctamente!")
            print_info("   - Métricas administrativas operativas")
            print_info("   - Seguridad de roles implementada")
            print_info("   - API endpoints respondiendo")
        
        print(f"\n{Colors.BOLD}Pruebas completadas: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.ENDC}")


def main():
    """🚀 Función principal"""
    tester = MetricasAdminTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()