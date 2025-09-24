// ============================================================================
// 🎯 MÓDULO DE ESTADÍSTICAS ESPECÍFICO PARA GERENTES
// Archivo: static/js/gerente-stats.js
// ============================================================================

const GerenteStats = {
    // 🎛️ CONFIGURACIÓN DEL MÓDULO
    config: {
        refreshInterval: 300000, // 5 minutos
        initialized: false,
        colores: {
            verde: '#10B981',
            amarillo: '#F59E0B',
            rojo: '#EF4444',
            azul: '#3B82F6',
            morado: '#8B5CF6'
        }
    },

    data: {
        resumen: null,
        asesores: [],
        rendimiento: []
    },

    charts: {
        rendimiento: null,
        distribucion: null
    },

    // 🔄 INICIALIZAR MÓDULO
    init() {
        if (this.config.initialized) {
            console.log('⚠️ GerenteStats ya está inicializado');
            return;
        }

        console.log('🎯 Inicializando Módulo de Estadísticas para Gerente...');

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

        // Reemplazar todo el contenido con el diseño específico para gerentes
        estadisticasSection.innerHTML = this.getGerenteStatsTemplate();

        console.log('✅ Contenido de estadísticas reemplazado para gerente');
    },

    // 🎨 TEMPLATE HTML PARA ESTADÍSTICAS DE GERENTE
    getGerenteStatsTemplate() {
        return `
            <!-- 📊 HEADER PARA GERENTES -->
            <div class="section-header-v2">
                <div class="header-content-v2">
                    <h3><i class="fas fa-chart-line"></i> Estadísticas de tu Equipo</h3>
                    <div class="header-meta">
                        <span id="gerente-last-refresh" class="last-update">Actualizado: --:--</span>
                        <span class="version-badge">Gerente v1.0</span>
                    </div>
                </div>
                <div class="header-actions-v2">
                    <button id="refresh-gerente-stats" class="btn-icon-v2" title="Actualizar datos">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <!-- 🔄 LOADER -->
            <div id="gerente-stats-loader" class="loader-overlay-v2" style="display: none;">
                <div class="loader-content-v2">
                    <div class="spinner-v2"></div>
                    <p class="loader-text">Cargando estadísticas de tu equipo...</p>
                </div>
            </div>

            <!-- 📊 KPIs PRINCIPALES -->
            <div class="kpis-global-section">
                <div class="kpis-grid-v2">
                    <div class="kpi-card-v2 total-asesores">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-total-asesores">--</div>
                            <div class="kpi-label">Mis Asesores</div>
                        </div>
                    </div>

                    <div class="kpi-card-v2 total-reclutas">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-total-reclutas">--</div>
                            <div class="kpi-label">Total Reclutas</div>
                        </div>
                    </div>

                    <div class="kpi-card-v2 conversion-rate">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-tasa-conversion">--%</div>
                            <div class="kpi-label">Tasa de Conversión</div>
                        </div>
                    </div>

                    <div class="kpi-card-v2 activos">
                        <div class="kpi-icon-v2">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="kpi-content-v2">
                            <div class="kpi-number" id="kpi-reclutas-activos">--</div>
                            <div class="kpi-label">Reclutas Activos</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 📊 DISTRIBUCIÓN POR ESTADOS -->
            <div class="distribucion-section">
                <h4 class="section-title-v2">
                    <i class="fas fa-chart-pie"></i> Distribución de Reclutas
                </h4>
                <div class="distribucion-grid">
                    <div class="chart-container-v2" id="chart-distribucion-gerente">
                        <canvas id="distribucionGerenteChart"></canvas>
                    </div>
                    <div class="distribucion-stats">
                        <div class="estado-stat verde">
                            <div class="estado-icon"><i class="fas fa-check-circle"></i></div>
                            <div class="estado-data">
                                <span class="estado-count" id="gerente-activos">--</span>
                                <span class="estado-label">Activos</span>
                                <span class="estado-percentage" id="gerente-activos-pct">--%</span>
                            </div>
                        </div>
                        <div class="estado-stat amarillo">
                            <div class="estado-icon"><i class="fas fa-clock"></i></div>
                            <div class="estado-data">
                                <span class="estado-count" id="gerente-proceso">--</span>
                                <span class="estado-label">En Proceso</span>
                                <span class="estado-percentage" id="gerente-proceso-pct">--%</span>
                            </div>
                        </div>
                        <div class="estado-stat rojo">
                            <div class="estado-icon"><i class="fas fa-times-circle"></i></div>
                            <div class="estado-data">
                                <span class="estado-count" id="gerente-rechazados">--</span>
                                <span class="estado-label">Rechazados</span>
                                <span class="estado-percentage" id="gerente-rechazados-pct">--%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 👥 MIS ASESORES -->
            <div class="equipos-section">
                <h4 class="section-title-v2">
                    <i class="fas fa-users-cog"></i> Mis Asesores
                </h4>
                <div id="asesores-gerente-container" class="asesores-display-container">
                    <div class="loading-placeholder">
                        <i class="fas fa-users fa-spin"></i>
                        <p>Cargando información de tus asesores...</p>
                    </div>
                </div>
            </div>

            <!-- 📈 RENDIMIENTO MENSUAL -->
            <div class="chart-section">
                <h4 class="section-title-v2">
                    <i class="fas fa-chart-bar"></i> Rendimiento Mensual del Equipo
                </h4>
                <div class="chart-container-v2" id="chart-rendimiento-gerente">
                    <canvas id="rendimientoGerenteChart"></canvas>
                </div>
            </div>
        `;
    },

    // 🔗 VINCULAR EVENTOS
    bindEvents() {
        // Botón de refresh
        const refreshBtn = document.getElementById('refresh-gerente-stats');
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
                this.loadResumenEquipo(),
                this.loadMisAsesores(),
                this.loadRendimientoMensual()
            ]);

            this.updateLastRefresh();
        } catch (error) {
            console.error('❌ Error cargando datos del gerente:', error);
            this.showError('Error al cargar las estadísticas');
        } finally {
            this.hideLoader();
        }
    },

    // 🔄 MOSTRAR/OCULTAR LOADER
    showLoader() {
        const loader = document.getElementById('gerente-stats-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader() {
        const loader = document.getElementById('gerente-stats-loader');
        if (loader) loader.style.display = 'none';
    },

    // 🏢 CARGAR RESUMEN DEL EQUIPO
    async loadResumenEquipo() {
        try {
            const response = await fetch('/api/gerente/resumen-equipo');
            const result = await response.json();

            if (result.success) {
                this.data.resumen = result.data;
                this.updateKPIs(result.data);
                this.updateDistribucion(result.data);
            } else {
                throw new Error(result.message || 'Error al cargar resumen');
            }
        } catch (error) {
            console.error('❌ Error en loadResumenEquipo:', error);
            throw error;
        }
    },

    // 👥 CARGAR MIS ASESORES
    async loadMisAsesores() {
        try {
            const response = await fetch('/api/gerente/mis-asesores');
            const result = await response.json();

            if (result.success) {
                this.data.asesores = result.data;
                this.renderAsesores(result.data);
            } else {
                throw new Error(result.message || 'Error al cargar asesores');
            }
        } catch (error) {
            console.error('❌ Error en loadMisAsesores:', error);
            throw error;
        }
    },

    // 📈 CARGAR RENDIMIENTO MENSUAL
    async loadRendimientoMensual() {
        try {
            const response = await fetch('/api/gerente/rendimiento-mensual');
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

    // 📊 ACTUALIZAR KPIs
    updateKPIs(data) {
        const updates = {
            'kpi-total-asesores': data.total_asesores || 0,
            'kpi-total-reclutas': data.total_reclutas || 0,
            'kpi-reclutas-activos': data.reclutas_activos || 0,
            'kpi-tasa-conversion': `${data.tasa_conversion || 0}%`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    },

    // 🥧 ACTUALIZAR DISTRIBUCIÓN
    updateDistribucion(data) {
        const total = data.total_reclutas || 1; // Evitar división por cero

        const updates = {
            'gerente-activos': data.reclutas_activos || 0,
            'gerente-proceso': data.reclutas_proceso || 0,
            'gerente-rechazados': data.reclutas_rechazados || 0,
            'gerente-activos-pct': `${Math.round((data.reclutas_activos || 0) / total * 100)}%`,
            'gerente-proceso-pct': `${Math.round((data.reclutas_proceso || 0) / total * 100)}%`,
            'gerente-rechazados-pct': `${Math.round((data.reclutas_rechazados || 0) / total * 100)}%`
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Generar gráfico de distribución
        this.renderDistribucionChart(data);
    },

    // 👨‍💼 RENDERIZAR ASESORES
    renderAsesores(asesores) {
        const container = document.getElementById('asesores-gerente-container');
        if (!container) return;

        if (asesores.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="fas fa-info-circle"></i>
                    <p>No tienes asesores asignados actualmente.</p>
                </div>
            `;
            return;
        }

        const asesoresHTML = asesores.map(asesor => {
            const iniciales = `${asesor.nombre.charAt(0)}${asesor.apellido.charAt(0)}`;
            const conversionClass = asesor.tasa_conversion >= 70 ? 'excelente' :
                                   asesor.tasa_conversion >= 50 ? 'bueno' :
                                   asesor.tasa_conversion >= 30 ? 'regular' : 'necesita-mejora';

            return `
                <div class="asesor-card-v2">
                    <div class="asesor-header-v2">
                        <div class="asesor-avatar-v2">${iniciales}</div>
                        <div class="asesor-info-v2">
                            <h5>${asesor.nombre} ${asesor.apellido}</h5>
                            <p>${asesor.email}</p>
                        </div>
                        <div class="asesor-conversion-v2">
                            <span class="conversion-badge-v2 ${conversionClass}">
                                ${asesor.tasa_conversion}%
                            </span>
                        </div>
                    </div>
                    <div class="asesor-stats-v2">
                        <div class="stat-row-v2">
                            <div class="stat-item-v2">
                                <span class="stat-value-v2">${asesor.total_reclutas}</span>
                                <span class="stat-label-v2">Total</span>
                            </div>
                            <div class="stat-item-v2">
                                <span class="stat-value-v2">${asesor.reclutas_activos}</span>
                                <span class="stat-label-v2">Activos</span>
                            </div>
                            <div class="stat-item-v2">
                                <span class="stat-value-v2">${asesor.reclutas_proceso}</span>
                                <span class="stat-label-v2">Proceso</span>
                            </div>
                            <div class="stat-item-v2">
                                <span class="stat-value-v2">${asesor.reclutas_rechazados}</span>
                                <span class="stat-label-v2">Rechazados</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="asesores-grid-v2">${asesoresHTML}</div>`;
    },

    // 📊 RENDERIZAR GRÁFICO DE DISTRIBUCIÓN
    renderDistribucionChart(data) {
        const canvas = document.getElementById('distribucionGerenteChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destruir gráfico existente
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
        const canvas = document.getElementById('rendimientoGerenteChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destruir gráfico existente
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

    // 🕒 ACTUALIZAR HORA DE ÚLTIMO REFRESH
    updateLastRefresh() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const element = document.getElementById('gerente-last-refresh');
        if (element) {
            element.textContent = `Actualizado: ${timeString}`;
        }
    },

    // ⚠️ MOSTRAR ERROR
    showError(message) {
        console.error('❌ Error en GerenteStats:', message);
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
window.GerenteStats = GerenteStats;

// Auto-inicializar cuando se carga el script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GerenteStats.init();
    });
} else {
    GerenteStats.init();
}