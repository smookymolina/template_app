
// 🏗️ GESTIÓN DE JERARQUÍA ORGANIZACIONAL
import { showNotification, showError, showSuccess } from './notifications.js';

const Jerarquia = {
    
    init: function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        console.log('🏗️ Inicializando módulo de Jerarquía para rol:', currentUser.rol);
        this.setupHierarchicalMetrics();
    },

    /**
     * Configurar métricas jerárquicas según rol
     */
    setupHierarchicalMetrics: function() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        console.log('🏗️ Configurando métricas jerárquicas para rol:', currentUser.rol);

        if (currentUser.rol === 'admin') {
            this.setupAdminHierarchicalMetrics();
        } else if (currentUser.rol === 'gerente') {
            this.setupGerenteHierarchicalMetrics();
        }
        // El rol 'asesor' no tiene métricas en esta sección.
    },

    /**
     * Métricas jerárquicas para Admin
     */
    setupAdminHierarchicalMetrics: async function() {
        try {
            console.log('📊 Configurando métricas admin: Total gerentes, asesores sin asignar, distribución general');
            
            const [gerentesResponse, asesoresResponse] = await Promise.all([
                fetch('/api/asesores?rol=gerente'),
                fetch('/api/asesores?sin_gerente=true')
            ]);

            const gerentesData = await gerentesResponse.json();
            const asesoresSinGerenteData = await asesoresResponse.json();

            if (gerentesData.success && asesoresSinGerenteData.success) {
                this.displayAdminMetrics({
                    totalGerentes: gerentesData.asesores?.length || 0,
                    asesoresSinAsignar: asesoresSinGerenteData.asesores?.length || 0,
                });
            }

        } catch (error) {
            console.error('❌ Error obteniendo métricas admin:', error);
        }
    },

    /**
     * Métricas jerárquicas para Gerente
     */
    setupGerenteHierarchicalMetrics: async function() {
        try {
            console.log('📊 Configurando métricas gerente: Mis asesores activos, reclutas por distribuir, rendimiento equipo');
            
            const asesoresResponse = await fetch('/api/gerentes/mis-asesores');
            const asesoresData = await asesoresResponse.json();

            if (asesoresData.success) {
                const misAsesores = asesoresData.asesores;
                // Nota: los reclutas por distribuir se obtendrían de otra fuente o endpoint
                this.displayGerenteMetrics({
                    misAsesoresActivos: misAsesores.length,
                    reclutasPorDistribuir: 0, // Placeholder
                });
            }

        } catch (error) {
            console.error('❌ Error obteniendo métricas gerente:', error);
        }
    },

    /**
     * Mostrar métricas para Admin en la sección de gerentes
     */
    displayAdminMetrics: function(metrics) {
        const metricsContainer = this.getOrCreateMetricsContainer('admin');
        if (!metricsContainer) return;
        
        metricsContainer.innerHTML = `
            <div class="metrics-grid admin-metrics">
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-user-tie"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.totalGerentes}</h3>
                        <p>Total Gerentes</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-user-slash"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.asesoresSinAsignar}</h3>
                        <p>Asesores Sin Asignar</p>
                    </div>
                </div>
                <div class="metric-card action-card">
                    <div class="metric-content">
                        <button class="btn-primary btn-small" onclick="Jerarquia.mostrarAsignacionAsesores()">
                            <i class="fas fa-user-plus"></i> Asignar Asesores
                        </button>
                    </div>
                </div>
                 <div class="metric-card action-card">
                    <div class="metric-content">
                        <button class="btn-secondary btn-small" onclick="Jerarquia.mostrarJerarquiaCompleta()">
                            <i class="fas fa-sitemap"></i> Ver Jerarquía
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Mostrar métricas para Gerente en la sección de gerentes
     */
    displayGerenteMetrics: function(metrics) {
        const metricsContainer = this.getOrCreateMetricsContainer('gerente');
        if (!metricsContainer) return;
        
        metricsContainer.innerHTML = `
            <div class="metrics-grid gerente-metrics">
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-users"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.misAsesoresActivos}</h3>
                        <p>Mis Asesores Activos</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon"><i class="fas fa-user-clock"></i></div>
                    <div class="metric-content">
                        <h3>${metrics.reclutasPorDistribuir}</h3>
                        <p>Reclutas Por Distribuir</p>
                    </div>
                </div>
                <div class="metric-card action-card">
                    <div class="metric-content">
                        <button class="btn-primary btn-small" onclick="Jerarquia.redistribuirReclutasGerente()">
                            <i class="fas fa-exchange-alt"></i> Redistribuir a Asesores
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Obtener o crear contenedor de métricas en la sección de gerentes
     */
    getOrCreateMetricsContainer: function(role) {
        const section = document.getElementById('gestion-gerentes-section');
        if (!section) return null;

        let container = document.getElementById(`metrics-gerentes-${role}-container`);
        if (!container) {
            const sectionHeader = section.querySelector('.section-header');
            if (sectionHeader) {
                container = document.createElement('div');
                container.id = `metrics-gerentes-${role}-container`;
                container.className = 'hierarchical-metrics-container';
                sectionHeader.insertAdjacentElement('afterend', container);
                console.log(`✅ Contenedor de métricas para ${role} creado en sección de gerentes.`);
            }
        }
        return container;
    },

    /**
     * Obtener usuario actual (helper)
     */
    getCurrentUser: function() {
        if (window.getCurrentUser && typeof window.getCurrentUser === 'function') {
            return window.getCurrentUser();
        }
        return null;
    },

    // --- Funciones de la sección de gerentes ---

    mostrarJerarquiaCompleta: async function() {
        console.log('Mostrando jerarquía completa...');
        const container = document.getElementById('jerarquia-container');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando Jerarquía...</div>';

        try {
            const response = await fetch('/api/gerentes/jerarquia');
            const data = await response.json();

            if (data.success) {
                this.renderJerarquia(data.jerarquia);
            } else {
                throw new Error(data.message || 'Error al cargar la jerarquía.');
            }
        } catch (error) {
            console.error('Error en mostrarJerarquiaCompleta:', error);
            container.innerHTML = '<div class="error-message">No se pudo cargar la jerarquía.</div>';
            showError(error.message);
        }
    },

    renderJerarquia: function(jerarquia) {
        const container = document.getElementById('jerarquia-container');
        if (!container) return;

        if (!jerarquia || jerarquia.length === 0) {
            container.innerHTML = '<div class="info-placeholder">No hay gerentes para mostrar.</div>';
            return;
        }

        const html = jerarquia.map(gerente => `
            <div class="card gerente-card">
                <div class="card-header">
                    <h4><i class="fas fa-user-tie"></i> ${gerente.nombre}</h4>
                    <span class="badge badge-primary">${gerente.asesores.length} asesores</span>
                </div>
                <div class="card-body">
                    ${gerente.asesores.length > 0 ? this.renderAsesores(gerente.asesores) : '<p>No tiene asesores asignados.</p>'}
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    },

    renderAsesores: function(asesores) {
        return '<div class="asesores-grid">' + asesores.map(asesor => `
            <div class="card asesor-card">
                <p><i class="fas fa-user"></i> ${asesor.nombre}</p>
                <p><i class="fas fa-users"></i> ${asesor.reclutas_count} reclutas</p>
            </div>
        `).join('') + '</div>';
    },

    mostrarAsignacionAsesores: async function() {
        showNotification('Función "Asignar Asesores a Gerentes" aún no implementada.', 'info');
        console.log('TODO: Implementar mostrarAsignacionAsesores');
        // Modal para asignar asesores sin gerente a gerentes existentes
    },

    redistribuirReclutasGerente: async function() {
        showNotification('Función "Redistribuir Reclutas" aún no implementada.', 'info');
        console.log('TODO: Implementar redistribuirReclutasGerente');
        // Modal específico para que gerente redistribuya SUS reclutas
    }
};

export default Jerarquia;
