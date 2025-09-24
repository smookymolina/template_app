// ============================================================================
// 🎯 MÓDULO DE ESTADÍSTICAS ESPECÍFICO PARA ASESORES
// Archivo: static/js/asesor-stats.js
// ============================================================================

const AsesorStats = {
    // 🎛️ CONFIGURACIÓN DEL MÓDULO
    config: {
        refreshInterval: 300000, // 5 minutos
        initialized: false,
        colores: {
            verde: '#10B981',
            amarillo: '#F59E0B',
            rojo: '#EF4444',
            azul: '#3B82F6',
            morado: '#8B5CF6',
            indigo: '#6366F1'
        }
    },

    data: {
        resumen: null,
        reclutas: [],
        rendimiento: [],
        recientes: [],
        estadisticas: null
    },

    charts: {
        rendimiento: null,
        distribucion: null,
        objetivos: null
    },

    // 🔄 INICIALIZAR MÓDULO
    init() {
        if (this.config.initialized) {
            console.log('⚠️ AsesorStats ya está inicializado');
            return;
        }

        console.log('🎯 Inicializando Módulo de Estadísticas para Asesor...');

        this.replaceEstadisticasContent();
        this.bindEvents();
        this.loadAllData();
        this.setupAutoRefresh();

        this.config.initialized = true;
    },

    // 📄 REEMPLAZAR CONTENIDO DE LA SECCIÓN ESTADÍSTICAS
    replaceEstadisticasContent() {
        const estadisticasSection = document.getElementById('estadisticas-section');
        if (!estadisticasSection) {
            console.error('❌ Sección de estadísticas no encontrada');
            return;
        }

        // Reemplazar todo el contenido con el diseño específico para asesores
        estadisticasSection.innerHTML = this.getAsesorStatsTemplate();

        console.log('✅ Contenido de estadísticas reemplazado para asesor');
    },

    // 🎨 TEMPLATE HTML PARA ESTADÍSTICAS DE ASESOR
    getAsesorStatsTemplate() {
        return `
            <!-- 📊 HEADER PARA ASESORES -->
            <div class="section-header-v2">
                <div class="header-content-v2">
                    <h3><i class="fas fa-user-chart"></i> Mis Estadísticas Personales</h3>
                    <div class="header-meta">
                        <span id="asesor-last-refresh" class="last-update">Actualizado: --:--</span>
                        <span class="version-badge">Asesor v1.0</span>
                    </div>
                </div>
                <div class="header-actions-v2">
                    <button id="refresh-asesor-stats" class="btn-icon-v2" title="Actualizar datos">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <!-- 🔄 LOADER -->
            <div id="asesor-stats-loader" class="loader-overlay-v2" style="display: none;">
                <div class="loader-content-v2">
                    <div class="spinner-v2"></div>
                    <p class="loader-text">Cargando tus estadísticas personales...</p>
                </div>
            </div>

            <!-- 📊 KPIs PRINCIPALES -->
            <div class="kpis-global-section">
                <div class="kpis-grid-v2">
                    <div class="kpi-card-v2 total-reclutas">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-total-reclutas-asesor">--</div>
                            <div class="kpi-label">Mis Reclutas</div>
                        </div>
                    </div>

                    <div class="kpi-card-v2 activos-asesor">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-reclutas-activos-asesor">--</div>
                            <div class="kpi-label">Activos</div>
                        </div>
                    </div>

                    <div class="kpi-card-v2 conversion-asesor">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-tasa-conversion-asesor">--%</div>
                            <div class="kpi-label">Mi Conversión</div>
                        </div>
                    </div>

                    <div class="kpi-card-v2 objetivo-mensual">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-target"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-progreso-objetivo">--%</div>
                            <div class="kpi-label">Progreso Mensual</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 📊 DISTRIBUCIÓN Y PROGRESO -->
            <div class="asesor-dashboard-row">
                <!-- Distribución por Estados -->
                <div class="distribucion-section">
                    <h4 class="section-title-v2">
                        <i class="fas fa-chart-pie"></i> Distribución de mis Reclutas
                    </h4>
                    <div class="distribucion-grid">
                        <div class="chart-container-v2" id="chart-distribucion-asesor">
                            <canvas id="distribucionAsesorChart"></canvas>
                        </div>
                        <div class="distribucion-stats">
                            <div class="estado-stat verde">
                                <div class="estado-icon"><i class="fas fa-check-circle"></i></div>
                                <div class="estado-data">
                                    <span class="estado-count" id="asesor-activos">--</span>
                                    <span class="estado-label">Activos</span>
                                    <span class="estado-percentage" id="asesor-activos-pct">--%</span>
                                </div>
                            </div>
                            <div class="estado-stat amarillo">
                                <div class="estado-icon"><i class="fas fa-clock"></i></div>
                                <div class="estado-data">
                                    <span class="estado-count" id="asesor-proceso">--</span>
                                    <span class="estado-label">En Proceso</span>
                                    <span class="estado-percentage" id="asesor-proceso-pct">--%</span>
                                </div>
                            </div>
                            <div class="estado-stat rojo">
                                <div class="estado-icon"><i class="fas fa-times-circle"></i></div>
                                <div class="estado-data">
                                    <span class="estado-count" id="asesor-rechazados">--</span>
                                    <span class="estado-label">Rechazados</span>
                                    <span class="estado-percentage" id="asesor-rechazados-pct">--%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Progreso de Objetivos -->
                <div class="objetivos-section">
                    <h4 class="section-title-v2">
                        <i class="fas fa-bullseye"></i> Mi Progreso del Mes
                    </h4>
                    <div class="objetivo-progress-container">
                        <div class="objetivo-circular">
                            <div class="progress-ring">
                                <svg width="120" height="120">
                                    <circle cx="60" cy="60" r="54" fill="transparent" stroke="#e2e8f0" stroke-width="8"/>
                                    <circle cx="60" cy="60" r="54" fill="transparent" stroke="#48bb78" stroke-width="8"
                                            stroke-dasharray="339.29" stroke-dashoffset="339.29" id="progress-circle"/>
                                </svg>
                                <div class="progress-text">
                                    <span id="progreso-porcentaje">0%</span>
                                    <small>del objetivo</small>
                                </div>
                            </div>
                        </div>
                        <div class="objetivo-details">
                            <div class="objetivo-item">
                                <span class="objetivo-label">Este mes:</span>
                                <span class="objetivo-value" id="reclutas-mes-actual">--</span>
                            </div>
                            <div class="objetivo-item">
                                <span class="objetivo-label">Objetivo:</span>
                                <span class="objetivo-value" id="objetivo-mensual-valor">20</span>
                            </div>
                            <div class="objetivo-item">
                                <span class="objetivo-label">Faltan:</span>
                                <span class="objetivo-value" id="reclutas-faltantes">--</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 🕒 RECLUTAS RECIENTES -->
            <div class="recientes-section">
                <h4 class="section-title-v2">
                    <i class="fas fa-clock"></i> Mis Reclutas Más Recientes
                </h4>
                <div id="reclutas-recientes-container" class="recientes-display-container">
                    <div class="loading-placeholder">
                        <i class="fas fa-user-plus fa-spin"></i>
                        <p>Cargando reclutas recientes...</p>
                    </div>
                </div>
            </div>

            <!-- 📈 RENDIMIENTO MENSUAL -->
            <div class="chart-section">
                <h4 class="section-title-v2">
                    <i class="fas fa-chart-line"></i> Mi Rendimiento en los Últimos Meses
                </h4>
                <div class="chart-container-v2" id="chart-rendimiento-asesor">
                    <canvas id="rendimientoAsesorChart"></canvas>
                </div>
            </div>
        `;
    },

    // 🔗 VINCULAR EVENTOS
    bindEvents() {
        // Botón de refresh
        const refreshBtn = document.getElementById('refresh-asesor-stats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAllData();
            });
        }
    },

    // 📊 CARGAR TODOS LOS DATOS
    async loadAllData() {
        this.showLoader();

        try {
            await Promise.all([
                this.loadResumenPersonal(),
                this.loadMisReclutas(),
                this.loadRendimientoMensual(),
                this.loadReclutasRecientes(),
                this.loadEstadisticasDetalladas()
            ]);

            this.updateLastRefresh();
        } catch (error) {
            console.error('❌ Error cargando datos del asesor:', error);
            this.showError('Error al cargar las estadísticas');
        } finally {
            this.hideLoader();
        }
    },

    // 🔄 MOSTRAR/OCULTAR LOADER
    showLoader() {
        const loader = document.getElementById('asesor-stats-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader() {
        const loader = document.getElementById('asesor-stats-loader');
        if (loader) loader.style.display = 'none';
    },

    // 🏠 CARGAR RESUMEN PERSONAL
    async loadResumenPersonal() {
        try {
            const response = await fetch('/api/asesor/resumen-personal');
            const result = await response.json();

            if (result.success) {
                this.data.resumen = result.data;
                this.updateKPIs(result.data);
                this.updateDistribucion(result.data);
                this.updateObjetivos(result.data);
            } else {
                throw new Error(result.message || 'Error al cargar resumen');
            }
        } catch (error) {
            console.error('❌ Error en loadResumenPersonal:', error);
            throw error;
        }
    },

    // 👥 CARGAR MIS RECLUTAS
    async loadMisReclutas() {
        try {
            const response = await fetch('/api/asesor/mis-reclutas');
            const result = await response.json();

            if (result.success) {
                this.data.reclutas = result.data;
            } else {
                throw new Error(result.message || 'Error al cargar reclutas');
            }
        } catch (error) {
            console.error('❌ Error en loadMisReclutas:', error);
            throw error;
        }
    },

    // 📈 CARGAR RENDIMIENTO MENSUAL
    async loadRendimientoMensual() {
        try {
            const response = await fetch('/api/asesor/rendimiento-mensual');
            const result = await response.json();

            if (result.success) {
                this.data.rendimiento = result.data;
                this.renderRendimientoChart(result.data);
            } else {
                throw new Error(result.message || 'Error al cargar rendimiento');
            }
        } catch (error) {
            console.error('❌ Error en loadRendimientoMensual:', error);
            throw error;
        }
    },

    // 🕒 CARGAR RECLUTAS RECIENTES
    async loadReclutasRecientes() {
        try {
            const response = await fetch('/api/asesor/reclutas-recientes');
            const result = await response.json();

            if (result.success) {
                this.data.recientes = result.data;
                this.renderReclutasRecientes(result.data);
            } else {
                throw new Error(result.message || 'Error al cargar reclutas recientes');
            }
        } catch (error) {
            console.error('❌ Error en loadReclutasRecientes:', error);
            throw error;
        }
    },

    // 📊 CARGAR ESTADÍSTICAS DETALLADAS
    async loadEstadisticasDetalladas() {
        try {
            const response = await fetch('/api/asesor/estadisticas-por-estado');
            const result = await response.json();

            if (result.success) {
                this.data.estadisticas = result.data;
            } else {
                throw new Error(result.message || 'Error al cargar estadísticas detalladas');
            }
        } catch (error) {
            console.error('❌ Error en loadEstadisticasDetalladas:', error);
            throw error;
        }
    },

    // 📊 ACTUALIZAR KPIs
    updateKPIs(data) {
        const updates = {
            'kpi-total-reclutas-asesor': data.total_reclutas || 0,
            'kpi-reclutas-activos-asesor': data.reclutas_activos || 0,
            'kpi-tasa-conversion-asesor': `${data.tasa_conversion || 0}%`,
            'kpi-progreso-objetivo': `${data.progreso_porcentaje || 0}%`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    },

    // 🥧 ACTUALIZAR DISTRIBUCIÓN
    updateDistribucion(data) {
        const total = data.total_reclutas || 1;

        const updates = {
            'asesor-activos': data.reclutas_activos || 0,
            'asesor-proceso': data.reclutas_proceso || 0,
            'asesor-rechazados': data.reclutas_rechazados || 0,
            'asesor-activos-pct': `${Math.round((data.reclutas_activos || 0) / total * 100)}%`,
            'asesor-proceso-pct': `${Math.round((data.reclutas_proceso || 0) / total * 100)}%`,
            'asesor-rechazados-pct': `${Math.round((data.reclutas_rechazados || 0) / total * 100)}%`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        this.renderDistribucionChart(data);
    },

    // 🎯 ACTUALIZAR OBJETIVOS
    updateObjetivos(data) {
        const porcentaje = data.progreso_porcentaje || 0;
        const reclutas_mes = data.progreso_mes_actual || 0;
        const objetivo = data.objetivo_mensual || 20;
        const faltantes = Math.max(0, objetivo - reclutas_mes);

        // Actualizar valores
        document.getElementById('progreso-porcentaje').textContent = `${Math.round(porcentaje)}%`;
        document.getElementById('reclutas-mes-actual').textContent = reclutas_mes;
        document.getElementById('objetivo-mensual-valor').textContent = objetivo;
        document.getElementById('reclutas-faltantes').textContent = faltantes;

        // Actualizar círculo de progreso
        const circle = document.getElementById('progress-circle');
        if (circle) {
            const circumference = 2 * Math.PI * 54; // radio = 54
            const offset = circumference - (porcentaje / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    },

    // 📊 RENDERIZAR GRÁFICO DE DISTRIBUCIÓN
    renderDistribucionChart(data) {
        const canvas = document.getElementById('distribucionAsesorChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.distribucion) {
            this.charts.distribucion.destroy();
        }

        this.charts.distribucion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Activos', 'En Proceso', 'Rechazados'],
                datasets: [{
                    data: [
                        data.reclutas_activos || 0,
                        data.reclutas_proceso || 0,
                        data.reclutas_rechazados || 0
                    ],
                    backgroundColor: [
                        this.config.colores.verde,
                        this.config.colores.amarillo,
                        this.config.colores.rojo
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    // 📈 RENDERIZAR GRÁFICO DE RENDIMIENTO
    renderRendimientoChart(data) {
        const canvas = document.getElementById('rendimientoAsesorChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (this.charts.rendimiento) {
            this.charts.rendimiento.destroy();
        }

        const labels = data.map(item => {
            const [year, month] = item.mes.split('-');
            return new Date(year, month - 1).toLocaleDateString('es-ES', {
                month: 'short',
                year: '2-digit'
            });
        });

        this.charts.rendimiento = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Reclutas',
                        data: data.map(item => item.total_reclutas),
                        borderColor: this.config.colores.azul,
                        backgroundColor: this.config.colores.azul + '20',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Reclutas Activos',
                        data: data.map(item => item.reclutas_activos),
                        borderColor: this.config.colores.verde,
                        backgroundColor: this.config.colores.verde + '20',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });
    },

    // 🕒 RENDERIZAR RECLUTAS RECIENTES
    renderReclutasRecientes(recientes) {
        const container = document.getElementById('reclutas-recientes-container');
        if (!container) return;

        if (recientes.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No tienes reclutas registrados aún.</p>
                </div>
            `;
            return;
        }

        const reclutasHTML = recientes.map(recluta => {
            const estadoClass = recluta.estado === 'Activo' ? 'activo' :
                               recluta.estado === 'En proceso' ? 'proceso' : 'rechazado';

            const diasTexto = recluta.dias_desde_registro === 0 ? 'Hoy' :
                             recluta.dias_desde_registro === 1 ? 'Ayer' :
                             `Hace ${recluta.dias_desde_registro} días`;

            return `
                <div class="recluta-reciente-card">
                    <div class="recluta-info">
                        <h5>${recluta.nombre}</h5>
                        <p>${recluta.puesto || 'Sin puesto definido'}</p>
                        <span class="folio">Folio: ${recluta.folio}</span>
                    </div>
                    <div class="recluta-meta">
                        <span class="estado-badge ${estadoClass}">${recluta.estado}</span>
                        <span class="tiempo">${diasTexto}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="recientes-grid">${reclutasHTML}</div>`;
    },

    // 🕒 ACTUALIZAR HORA DE ÚLTIMO REFRESH
    updateLastRefresh() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const element = document.getElementById('asesor-last-refresh');
        if (element) {
            element.textContent = `Actualizado: ${timeString}`;
        }
    },

    // ⚠️ MOSTRAR ERROR
    showError(message) {
        console.error('❌ Error en AsesorStats:', message);
        // Aquí podrías agregar notificaciones visuales de error
    },

    // 🔄 CONFIGURAR AUTO-REFRESH
    setupAutoRefresh() {
        if (this.config.refreshInterval > 0) {
            setInterval(() => {
                this.loadAllData();
            }, this.config.refreshInterval);
        }
    }
};

// Exponer el módulo globalmente
window.AsesorStats = AsesorStats;

// Auto-inicializar cuando se carga el script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AsesorStats.init();
    });
} else {
    AsesorStats.init();
}