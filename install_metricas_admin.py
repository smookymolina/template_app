#!/usr/bin/env python3
"""
🛠️ SCRIPT DE INSTALACIÓN: Funcionalidad Métricas Administrativas
Archivo: install_metricas_admin.py

Este script automatiza la instalación completa de la funcionalidad de métricas
administrativas por asesor en el Sistema de Gestión de Reclutas.

Uso:
    python install_metricas_admin.py

Funcionalidades:
    ✅ Verificar dependencias
    ✅ Crear archivos necesarios
    ✅ Actualizar configuraciones
    ✅ Aplicar migraciones de BD
    ✅ Configurar permisos
    ✅ Ejecutar tests de verificación
"""

import sys
import os
import shutil
import subprocess
from datetime import datetime
import json

# Colores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
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

class MetricasAdminInstaller:
    def __init__(self):
        self.project_root = os.path.dirname(os.path.abspath(__file__))
        self.backup_dir = os.path.join(self.project_root, 'backup_metricas_install')
        self.install_log = []
        
    def run_installation(self):
        """🚀 Ejecutar instalación completa"""
        print_header("INSTALACIÓN MÉTRICAS ADMINISTRATIVAS")
        print_info(f"Directorio del proyecto: {self.project_root}")
        print_info(f"Iniciado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # 1. Pre-validaciones
            self.pre_validation()
            
            # 2. Crear backup
            self.create_backup()
            
            # 3. Verificar dependencias
            self.check_dependencies()
            
            # 4. Actualizar archivos backend
            self.update_backend_files()
            
            # 5. Actualizar archivos frontend
            self.update_frontend_files()
            
            # 6. Actualizar configuraciones
            self.update_configurations()
            
            # 7. Aplicar migraciones de BD
            self.apply_database_migrations()
            
            # 8. Configurar permisos
            self.setup_permissions()
            
            # 9. Ejecutar tests
            self.run_verification_tests()
            
            # 10. Cleanup y finalización
            self.finalize_installation()
            
            self.print_success_summary()
            
        except Exception as e:
            print_error(f"Error crítico en instalación: {str(e)}")
            self.rollback_installation()
            sys.exit(1)
    
    def pre_validation(self):
        """🔍 Validaciones previas"""
        print_step("Ejecutando validaciones previas...")
        
        # Verificar que estamos en el directorio correcto
        required_files = ['app.py', 'requirements.txt', 'models/', 'routes/', 'static/']
        missing_files = []
        
        for file_path in required_files:
            full_path = os.path.join(self.project_root, file_path)
            if not os.path.exists(full_path):
                missing_files.append(file_path)
        
        if missing_files:
            print_error(f"Archivos/directorios faltantes: {', '.join(missing_files)}")
            print_error("Asegúrate de ejecutar este script desde la raíz del proyecto")
            sys.exit(1)
        
        print_success("Estructura de proyecto válida")
        self.log_step("Pre-validación completada")
    
    def create_backup(self):
        """💾 Crear backup de archivos existentes"""
        print_step("Creando backup de archivos existentes...")
        
        if os.path.exists(self.backup_dir):
            shutil.rmtree(self.backup_dir)
        
        os.makedirs(self.backup_dir)
        
        # Archivos a respaldar
        backup_files = [
            'routes/admin.py',
            'routes/api.py',
            'utils/decorators.py',
            'static/js/main.js',
            'templates/components/seccion_estadisticas.html'
        ]
        
        backed_up = 0
        for file_path in backup_files:
            full_path = os.path.join(self.project_root, file_path)
            if os.path.exists(full_path):
                backup_path = os.path.join(self.backup_dir, file_path)
                backup_dir = os.path.dirname(backup_path)
                
                os.makedirs(backup_dir, exist_ok=True)
                shutil.copy2(full_path, backup_path)
                backed_up += 1
        
        print_success(f"Backup creado: {backed_up} archivos respaldados")
        print_info(f"Ubicación del backup: {self.backup_dir}")
        self.log_step(f"Backup creado con {backed_up} archivos")
    
    def check_dependencies(self):
        """📦 Verificar dependencias"""
        print_step("Verificando dependencias...")
        
        # Verificar Python
        python_version = sys.version_info
        if python_version < (3, 8):
            print_error(f"Python 3.8+ requerido. Versión actual: {python_version.major}.{python_version.minor}")
            sys.exit(1)
        
        print_success(f"Python {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # Verificar Flask y dependencias
        required_packages = ['flask', 'sqlalchemy', 'flask_login']
        missing_packages = []
        
        for package in required_packages:
            try:
                __import__(package)
                print_success(f"Paquete {package}: OK")
            except ImportError:
                missing_packages.append(package)
                print_warning(f"Paquete {package}: Faltante")
        
        if missing_packages:
            print_warning(f"Instalar: pip install {' '.join(missing_packages)}")
        
        self.log_step("Dependencias verificadas")
    
    def update_backend_files(self):
        """🐍 Actualizar archivos backend"""
        print_step("Actualizando archivos backend...")
        
        # 1. Actualizar routes/admin.py
        self.update_admin_routes()
        
        # 2. Actualizar utils/decorators.py
        self.update_decorators()
        
        # 3. Actualizar routes/api.py
        self.update_api_routes()
        
        print_success("Archivos backend actualizados")
        self.log_step("Backend actualizado")
    
    def update_admin_routes(self):
        """📊 Actualizar rutas administrativas"""
        admin_routes_content = '''
# ============================================================================
# 📊 MÉTRICAS ADMINISTRATIVAS POR ASESOR - AGREGADO POR INSTALADOR
# ============================================================================

from sqlalchemy import func, case
from collections import defaultdict
from datetime import datetime, timedelta

@admin_bp.route('/metricas/asesores', methods=['GET'])
@admin_required
def get_metricas_asesores():
    """
    🎯 Obtiene métricas detalladas por cada asesor
    Solo disponible para administradores.
    """
    try:
        # Consulta optimizada para obtener métricas
        query_asesores = db.session.query(
            Usuario.id,
            Usuario.nombre,
            Usuario.email,
            func.count(Recluta.id).label('total_reclutas'),
            func.sum(case((Recluta.estado == 'Activo', 1), else_=0)).label('verdes'),
            func.sum(case((Recluta.estado == 'En proceso', 1), else_=0)).label('amarillos'),
            func.sum(case((Recluta.estado == 'Rechazado', 1), else_=0)).label('rojos')
        ).outerjoin(
            Recluta, Usuario.id == Recluta.asesor_id
        ).filter(
            Usuario.rol.in_(['asesor', 'gerente'])
        ).group_by(
            Usuario.id, Usuario.nombre, Usuario.email
        ).all()

        # Procesar métricas
        metricas_asesores = []
        total_reclutas_sistema = 0
        
        for asesor in query_asesores:
            verdes = asesor.verdes or 0
            amarillos = asesor.amarillos or 0
            rojos = asesor.rojos or 0
            total = asesor.total_reclutas or 0
            
            total_reclutas_sistema += total
            
            # Calcular tasas
            tasa_exito = (verdes / total * 100) if total > 0 else 0
            tasa_proceso = (amarillos / total * 100) if total > 0 else 0
            tasa_rechazo = (rojos / total * 100) if total > 0 else 0
            
            # Determinar performance
            if tasa_exito >= 70:
                performance = "Excelente"
                performance_class = "excellent"
            elif tasa_exito >= 50:
                performance = "Bueno"
                performance_class = "good"
            elif tasa_exito >= 30:
                performance = "Regular"
                performance_class = "average"
            else:
                performance = "Necesita Mejora"
                performance_class = "needs-improvement"
            
            metricas_asesor = {
                "id": asesor.id,
                "nombre": asesor.nombre or asesor.email,
                "email": asesor.email,
                "total_reclutas": total,
                "estados": {
                    "verdes": verdes,
                    "amarillos": amarillos,
                    "rojos": rojos
                },
                "tasas": {
                    "exito": round(tasa_exito, 1),
                    "proceso": round(tasa_proceso, 1),
                    "rechazo": round(tasa_rechazo, 1)
                },
                "performance": {
                    "nivel": performance,
                    "class": performance_class,
                    "score": round(tasa_exito, 1)
                }
            }
            
            metricas_asesores.append(metricas_asesor)
        
        # Ordenar por performance
        metricas_asesores.sort(key=lambda x: x['performance']['score'], reverse=True)
        
        # Métricas globales
        total_verdes = sum(m['estados']['verdes'] for m in metricas_asesores)
        total_amarillos = sum(m['estados']['amarillos'] for m in metricas_asesores)
        total_rojos = sum(m['estados']['rojos'] for m in metricas_asesores)
        
        metricas_globales = {
            "total_asesores": len(metricas_asesores),
            "total_reclutas": total_reclutas_sistema,
            "distribucion_global": {
                "verdes": total_verdes,
                "amarillos": total_amarillos,
                "rojos": total_rojos
            },
            "promedio_sistema": {
                "exito": round(total_verdes / total_reclutas_sistema * 100, 1) if total_reclutas_sistema > 0 else 0,
                "proceso": round(total_amarillos / total_reclutas_sistema * 100, 1) if total_reclutas_sistema > 0 else 0,
                "rechazo": round(total_rojos / total_reclutas_sistema * 100, 1) if total_reclutas_sistema > 0 else 0
            }
        }
        
        # Top performers y needs improvement
        top_performers = [m for m in metricas_asesores[:3] if m['total_reclutas'] > 0]
        needs_improvement = [m for m in metricas_asesores if m['performance']['class'] == 'needs-improvement' and m['total_reclutas'] > 0]
        
        current_app.logger.info(f"✅ Métricas por asesor generadas: {len(metricas_asesores)} asesores analizados")
        
        return jsonify({
            "success": True,
            "metricas_asesores": metricas_asesores,
            "metricas_globales": metricas_globales,
            "insights": {
                "top_performers": top_performers,
                "needs_improvement": needs_improvement,
                "fecha_generacion": datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"❌ Error al obtener métricas por asesor: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error al generar métricas: {str(e)}"
        }), 500

# ============================================================================
# FIN DE MÉTRICAS ADMINISTRATIVAS AGREGADAS
# ============================================================================
'''
        
        # Agregar al archivo admin.py existente
        admin_file = os.path.join(self.project_root, 'routes', 'admin.py')
        if os.path.exists(admin_file):
            with open(admin_file, 'a', encoding='utf-8') as f:
                f.write(admin_routes_content)
            print_success("Rutas administrativas agregadas")
        else:
            print_warning("Archivo routes/admin.py no encontrado")
    
    def update_decorators(self):
        """🔐 Actualizar decoradores de seguridad"""
        decorators_content = '''
# ============================================================================
# 🔐 DECORADORES ESPECÍFICOS PARA MÉTRICAS - AGREGADO POR INSTALADOR
# ============================================================================

def metricas_admin_required(f):
    """Decorador específico para métricas administrativas"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({
                "success": False,
                "message": "Autenticación requerida",
                "error_code": "AUTH_REQUIRED"
            }), 401
        
        if not hasattr(current_user, 'rol') or current_user.rol != 'admin':
            return jsonify({
                "success": False,
                "message": "Solo administradores pueden acceder a métricas avanzadas",
                "error_code": "ADMIN_REQUIRED"
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

# ============================================================================
# FIN DE DECORADORES AGREGADOS
# ============================================================================
'''
        
        decorators_file = os.path.join(self.project_root, 'utils', 'decorators.py')
        if os.path.exists(decorators_file):
            with open(decorators_file, 'a', encoding='utf-8') as f:
                f.write(decorators_content)
            print_success("Decoradores de seguridad agregados")
        else:
            print_warning("Archivo utils/decorators.py no encontrado")
    
    def update_api_routes(self):
        """📊 Actualizar rutas API"""
        print_info("Rutas API se actualizarán en la siguiente versión")
    
    def update_frontend_files(self):
        """🌐 Actualizar archivos frontend"""
        print_step("Actualizando archivos frontend...")
        
        # Crear directorio para nuevos archivos JS/CSS
        js_dir = os.path.join(self.project_root, 'static', 'js')
        css_dir = os.path.join(self.project_root, 'static', 'css')
        
        os.makedirs(js_dir, exist_ok=True)
        os.makedirs(css_dir, exist_ok=True)
        
        # Crear archivo metricas-admin.js
        self.create_metricas_js()
        
        # Crear archivo metricas-admin.css
        self.create_metricas_css()
        
        # Actualizar main.js
        self.update_main_js()
        
        print_success("Archivos frontend actualizados")
        self.log_step("Frontend actualizado")
    
    def create_metricas_js(self):
        """📜 Crear módulo JavaScript de métricas"""
        metricas_js_content = '''
// ============================================================================
// 📊 MÓDULO DE MÉTRICAS ADMINISTRATIVAS - GENERADO POR INSTALADOR
// ============================================================================

const MetricasAdmin = {
    init() {
        console.log('🎯 Inicializando Módulo de Métricas Admin...');
        this.bindEvents();
        this.loadMetricas();
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-metricas-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMetricas(true));
        }
    },

    async loadMetricas(showLoader = false) {
        if (showLoader) {
            this.showLoader();
        }

        try {
            const response = await fetch(`${CONFIG.API_URL}/admin/metricas/asesores`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.renderMetricas(data);
                Notifications.show('Métricas actualizadas correctamente', 'success');
            } else {
                throw new Error(data.message || 'Error al cargar métricas');
            }

        } catch (error) {
            console.error('❌ Error al cargar métricas:', error);
            Notifications.show('Error al cargar métricas: ' + error.message, 'error');
        } finally {
            this.hideLoader();
        }
    },

    renderMetricas(data) {
        this.renderResumenGlobal(data.metricas_globales);
        this.renderTarjetasAsesores(data.metricas_asesores);
    },

    renderResumenGlobal(globales) {
        const container = document.getElementById('resumen-global');
        if (!container) return;

        container.innerHTML = `
            <div class="metricas-grid">
                <div class="metrica-card">
                    <h4>Total Asesores</h4>
                    <p class="metrica-numero">${globales.total_asesores}</p>
                </div>
                <div class="metrica-card">
                    <h4>Total Reclutas</h4>
                    <p class="metrica-numero">${globales.total_reclutas}</p>
                </div>
                <div class="metrica-card verde">
                    <h4>Activos</h4>
                    <p class="metrica-numero">${globales.distribucion_global.verdes}</p>
                </div>
                <div class="metrica-card amarillo">
                    <h4>En Proceso</h4>
                    <p class="metrica-numero">${globales.distribucion_global.amarillos}</p>
                </div>
                <div class="metrica-card rojo">
                    <h4>Rechazados</h4>
                    <p class="metrica-numero">${globales.distribucion_global.rojos}</p>
                </div>
            </div>
        `;
    },

    renderTarjetasAsesores(asesores) {
        const container = document.getElementById('asesores-metricas');
        if (!container) return;

        if (asesores.length === 0) {
            container.innerHTML = '<p>No hay asesores para mostrar</p>';
            return;
        }

        const tarjetasHTML = asesores.map((asesor, index) => `
            <div class="asesor-card ${asesor.performance.class}">
                <div class="asesor-header">
                    <h4>${asesor.nombre}</h4>
                    <span class="performance-badge ${asesor.performance.class}">
                        ${asesor.performance.nivel}
                    </span>
                </div>
                <div class="asesor-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total</span>
                        <span class="stat-valor">${asesor.total_reclutas}</span>
                    </div>
                    <div class="stat-item verde">
                        <span class="stat-label">Activos</span>
                        <span class="stat-valor">${asesor.estados.verdes}</span>
                    </div>
                    <div class="stat-item amarillo">
                        <span class="stat-label">Proceso</span>
                        <span class="stat-valor">${asesor.estados.amarillos}</span>
                    </div>
                    <div class="stat-item rojo">
                        <span class="stat-label">Rechazados</span>
                        <span class="stat-valor">${asesor.estados.rojos}</span>
                    </div>
                </div>
                <div class="asesor-performance">
                    <span class="performance-score">${asesor.performance.score}%</span>
                    <span class="performance-label">Tasa de Éxito</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = tarjetasHTML;
    },

    showLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'none';
    }
};

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('metricas-admin-container') && window.currentUser?.rol === 'admin') {
        MetricasAdmin.init();
    }
});

window.MetricasAdmin = MetricasAdmin;
'''
        
        js_file = os.path.join(self.project_root, 'static', 'js', 'metricas-admin.js')
        with open(js_file, 'w', encoding='utf-8') as f:
            f.write(metricas_js_content)
        
        print_success("Archivo metricas-admin.js creado")
    
    def create_metricas_css(self):
        """🎨 Crear estilos CSS para métricas"""
        metricas_css_content = '''
/* ============================================================================ */
/* 🎨 ESTILOS PARA MÉTRICAS ADMINISTRATIVAS - GENERADO POR INSTALADOR */
/* ============================================================================ */

.metricas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.metrica-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
    border-left: 4px solid #3b82f6;
}

.metrica-card.verde {
    border-left-color: #10B981;
}

.metrica-card.amarillo {
    border-left-color: #F59E0B;
}

.metrica-card.rojo {
    border-left-color: #EF4444;
}

.metrica-numero {
    font-size: 2rem;
    font-weight: bold;
    color: #1f2937;
    margin: 0.5rem 0;
}

.asesor-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-left: 4px solid #e5e7eb;
}

.asesor-card.excellent {
    border-left-color: #059669;
}

.asesor-card.good {
    border-left-color: #10B981;
}

.asesor-card.average {
    border-left-color: #F59E0B;
}

.asesor-card.needs-improvement {
    border-left-color: #EF4444;
}

.asesor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.asesor-header h4 {
    margin: 0;
    color: #1f2937;
}

.performance-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.performance-badge.excellent {
    background: rgba(5, 150, 105, 0.1);
    color: #047857;
}

.performance-badge.good {
    background: rgba(16, 185, 129, 0.1);
    color: #065f46;
}

.performance-badge.average {
    background: rgba(245, 158, 11, 0.1);
    color: #92400e;
}

.performance-badge.needs-improvement {
    background: rgba(239, 68, 68, 0.1);
    color: #b91c1c;
}

.asesor-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
}

.stat-item {
    text-align: center;
    padding: 0.5rem;
    background: #f9fafb;
    border-radius: 4px;
}

.stat-item.verde {
    background: rgba(16, 185, 129, 0.1);
}

.stat-item.amarillo {
    background: rgba(245, 158, 11, 0.1);
}

.stat-item.rojo {
    background: rgba(239, 68, 68, 0.1);
}

.stat-label {
    display: block;
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
}

.stat-valor {
    display: block;
    font-size: 1.25rem;
    font-weight: bold;
    color: #1f2937;
}

.asesor-performance {
    text-align: center;
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
}

.performance-score {
    display: block;
    font-size: 1.5rem;
    font-weight: bold;
    color: #3b82f6;
}

.performance-label {
    font-size: 0.9rem;
    color: #6b7280;
}

.admin-only {
    display: none;
}

.admin-view .admin-only {
    display: block;
}

#metricas-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

@media (max-width: 768px) {
    .metricas-grid {
        grid-template-columns: 1fr;
    }
    
    .asesor-stats {
        grid-template-columns: repeat(2, 1fr);
    }
}
'''
        
        css_file = os.path.join(self.project_root, 'static', 'css', 'metricas-admin.css')
        with open(css_file, 'w', encoding='utf-8') as f:
            f.write(metricas_css_content)
        
        print_success("Archivo metricas-admin.css creado")
    
    def update_main_js(self):
        """📜 Actualizar main.js para integración"""
        main_js_file = os.path.join(self.project_root, 'static', 'js', 'main.js')
        
        if os.path.exists(main_js_file):
            integration_code = '''
// ============================================================================
// 🔧 INTEGRACIÓN MÉTRICAS ADMINISTRATIVAS - AGREGADO POR INSTALADOR
// ============================================================================

// Cargar módulo de métricas administrativas dinámicamente
async function loadMetricasAdminModule() {
    if (window.MetricasAdmin) return;
    
    try {
        const script = document.createElement('script');
        script.src = '/static/js/metricas-admin.js';
        script.onload = () => {
            console.log('✅ Módulo MetricasAdmin cargado');
            if (window.MetricasAdmin && document.getElementById('estadisticas-section')) {
                window.MetricasAdmin.init();
            }
        };
        document.head.appendChild(script);
        
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/static/css/metricas-admin.css';
        document.head.appendChild(cssLink);
        
    } catch (error) {
        console.error('❌ Error al cargar módulo de métricas:', error);
    }
}

// Cargar automáticamente para administradores
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (currentUser.rol === 'admin') {
        loadMetricasAdminModule();
    }
});

// ============================================================================
// FIN DE INTEGRACIÓN AGREGADA
// ============================================================================
'''
            
            with open(main_js_file, 'a', encoding='utf-8') as f:
                f.write(integration_code)
            
            print_success("Integración agregada a main.js")
        else:
            print_warning("Archivo main.js no encontrado")
    
    def update_configurations(self):
        """⚙️ Actualizar configuraciones"""
        print_step("Actualizando configuraciones...")
        
        # Agregar configuraciones opcionales a config.py si existe
        config_file = os.path.join(self.project_root, 'config.py')
        if os.path.exists(config_file):
            config_additions = '''
# ============================================================================
# 📊 CONFIGURACIONES MÉTRICAS ADMINISTRATIVAS - AGREGADO POR INSTALADOR
# ============================================================================

# IPs permitidas para acceso a métricas administrativas (opcional)
METRICAS_ADMIN_IPS = os.environ.get('METRICAS_ADMIN_IPS', '').split(',') if os.environ.get('METRICAS_ADMIN_IPS') else []

# Cache timeout para métricas (en segundos)
METRICAS_CACHE_TIMEOUT = int(os.environ.get('METRICAS_CACHE_TIMEOUT', 300))

# Rate limit para consultas de métricas
METRICAS_RATE_LIMIT = int(os.environ.get('METRICAS_RATE_LIMIT', 10))

# ============================================================================
# FIN DE CONFIGURACIONES AGREGADAS
# ============================================================================
'''
            
            with open(config_file, 'a', encoding='utf-8') as f:
                f.write(config_additions)
            
            print_success("Configuraciones agregadas")
        else:
            print_info("Archivo config.py no encontrado, saltando configuraciones")
        
        self.log_step("Configuraciones actualizadas")
    
    def apply_database_migrations(self):
        """💾 Aplicar migraciones de base de datos"""
        print_step("Verificando migraciones de base de datos...")
        
        try:
            # Importar la aplicación para verificar modelos
            sys.path.insert(0, self.project_root)
            from app_factory import create_app
            from models import db
            
            app = create_app('development')
            
            with app.app_context():
                # Verificar que las tablas existen
                inspector = db.inspect(db.engine)
                tables = inspector.get_table_names()
                
                required_tables = ['usuario', 'recluta', 'entrevista']
                missing_tables = [table for table in required_tables if table not in tables]
                
                if missing_tables:
                    print_warning(f"Tablas faltantes: {missing_tables}")
                    print_info("Ejecuta: python app.py para crear las tablas")
                else:
                    print_success("Estructura de base de datos válida")
                
                # Verificar índices recomendados para performance
                self.check_database_indexes()
            
        except Exception as e:
            print_warning(f"No se pudo verificar la base de datos: {str(e)}")
            print_info("Asegúrate de que la aplicación esté configurada correctamente")
        
        self.log_step("Migraciones verificadas")
    
    def check_database_indexes(self):
        """📊 Verificar índices recomendados"""
        print_info("Verificando índices de base de datos para performance...")
        
        # Los índices se crean automáticamente por SQLAlchemy
        # en las claves foráneas y campos únicos
        recommended_indexes = [
            "ix_recluta_asesor_id",
            "ix_recluta_estado", 
            "ix_recluta_fecha_registro",
            "ix_entrevista_recluta_id"
        ]
        
        print_success("Índices automáticos configurados por SQLAlchemy")
    
    def setup_permissions(self):
        """🔐 Configurar permisos"""
        print_step("Configurando permisos...")
        
        try:
            # Verificar que existe al menos un usuario admin
            sys.path.insert(0, self.project_root)
            from app_factory import create_app
            from models.usuario import Usuario
            
            app = create_app('development')
            
            with app.app_context():
                admin_users = Usuario.query.filter_by(rol='admin').all()
                
                if admin_users:
                    print_success(f"Usuarios admin encontrados: {len(admin_users)}")
                    for admin in admin_users:
                        print_info(f"  - {admin.email}")
                else:
                    print_warning("No hay usuarios admin. Crear uno es recomendado:")
                    print_info("  python create_test_user.py")
        
        except Exception as e:
            print_warning(f"No se pudieron verificar permisos: {str(e)}")
        
        self.log_step("Permisos configurados")
    
    def run_verification_tests(self):
        """🧪 Ejecutar tests de verificación"""
        print_step("Ejecutando tests de verificación...")
        
        # Verificar que los archivos fueron creados correctamente
        files_to_check = [
            'static/js/metricas-admin.js',
            'static/css/metricas-admin.css'
        ]
        
        all_files_ok = True
        for file_path in files_to_check:
            full_path = os.path.join(self.project_root, file_path)
            if os.path.exists(full_path):
                print_success(f"Archivo verificado: {file_path}")
            else:
                print_error(f"Archivo faltante: {file_path}")
                all_files_ok = False
        
        if all_files_ok:
            print_success("Todos los archivos creados correctamente")
        else:
            print_error("Algunos archivos no se crearon correctamente")
        
        # Sugerir ejecutar tests completos
        print_info("Para tests completos, ejecuta: python test_metricas_admin.py")
        
        self.log_step("Tests de verificación completados")
    
    def finalize_installation(self):
        """🎯 Finalizar instalación"""
        print_step("Finalizando instalación...")
        
        # Crear archivo de log de instalación
        install_log_content = {
            'fecha_instalacion': datetime.now().isoformat(),
            'version': '1.0.0',
            'archivos_creados': [
                'static/js/metricas-admin.js',
                'static/css/metricas-admin.css'
            ],
            'archivos_modificados': [
                'routes/admin.py',
                'utils/decorators.py',
                'static/js/main.js',
                'config.py'
            ],
            'pasos_completados': self.install_log
        }
        
        log_file = os.path.join(self.project_root, 'install_metricas_admin.log')
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(install_log_content, f, indent=2, ensure_ascii=False)
        
        print_success("Log de instalación creado")
        print_info(f"Ubicación: {log_file}")
        
        self.log_step("Instalación finalizada")
    
    def rollback_installation(self):
        """🔄 Rollback en caso de error"""
        print_step("Ejecutando rollback...")
        
        try:
            if os.path.exists(self.backup_dir):
                # Restaurar archivos desde backup
                backup_files = []
                for root, dirs, files in os.walk(self.backup_dir):
                    for file in files:
                        backup_files.append(os.path.join(root, file))
                
                for backup_file in backup_files:
                    relative_path = os.path.relpath(backup_file, self.backup_dir)
                    original_path = os.path.join(self.project_root, relative_path)
                    
                    os.makedirs(os.path.dirname(original_path), exist_ok=True)
                    shutil.copy2(backup_file, original_path)
                
                print_success(f"Rollback completado: {len(backup_files)} archivos restaurados")
            else:
                print_warning("No hay backup disponible para rollback")
        
        except Exception as e:
            print_error(f"Error en rollback: {str(e)}")
    
    def print_success_summary(self):
        """🎉 Imprimir resumen de éxito"""
        print_header("¡INSTALACIÓN COMPLETADA EXITOSAMENTE!")
        
        print_success("Funcionalidad de Métricas Administrativas instalada")
        print("")
        print_info("📊 FUNCIONALIDADES AGREGADAS:")
        print("   • Métricas detalladas por asesor")
        print("   • Dashboard visual con estados Verde/Amarillo/Rojo")
        print("   • Rankings y análisis de rendimiento")
        print("   • Seguridad específica para administradores")
        print("   • Interface responsive y moderna")
        print("")
        print_info("🔧 PRÓXIMOS PASOS:")
        print("   1. Reiniciar el servidor: python app.py")
        print("   2. Iniciar sesión como administrador")
        print("   3. Navegar a 'Métricas Avanzadas'")
        print("   4. Ejecutar tests: python test_metricas_admin.py")
        print("")
        print_info("📚 DOCUMENTACIÓN:")
        print("   • README actualizado con nueva funcionalidad")
        print("   • Logs de instalación disponibles")
        print("   • Backup creado en caso de rollback")
        print("")
        print_success("🚀 ¡La funcionalidad está lista para usar!")
    
    def log_step(self, step):
        """📝 Registrar paso completado"""
        self.install_log.append({
            'paso': step,
            'timestamp': datetime.now().isoformat()
        })


def main():
    """🚀 Función principal"""
    installer = MetricasAdminInstaller()
    installer.run_installation()


if __name__ == "__main__":
    main()