/* ============================================================================ */
/* 🚀 MÉTRICAS ADMINISTRATIVAS V2.0 - JAVASCRIPT RENOVADO */
/* Archivo: static/js/metricas-admin-v2.js */
/* Versión: 2.0 - Navegación por tabs con datos unificados */
/* ============================================================================ */

/**
 * 🎯 CLASE PRINCIPAL PARA MÉTRICAS ADMIN V2
 */
class MetricasAdminV2 {
    constructor() {
        this.currentTab = 'resumen';
        this.dashboardData = null;
        this.isLoading = false;
        this.refreshInterval = null;
        this.charts = {};

        this.init();
    }

    /**
     * 🚀 INICIALIZACIÓN PRINCIPAL
     */
    init() {
        console.log('🎯 Iniciando Métricas Admin V2.0...');

        this.setupEventListeners();
        this.setupAutoRefresh();
        this.loadDashboardData();

        // Verificar si el CSS v2 está cargado
        this.ensureV2Styles();
    }

    /**
     * 🎛️ CONFIGURAR EVENT LISTENERS
     */
    setupEventListeners() {
        // 📊 Navegación por tabs
        document.querySelectorAll('.tab-button-v2').forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // 🔄 Refresh manual
        const refreshBtn = document.getElementById('refresh-metricas-v2');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadDashboardData(true);
            });
        }

        // 📥 Exportar datos
        const exportBtn = document.getElementById('export-metricas-v2');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // 🎛️ Filtros y controles específicos por tab
        this.setupTabSpecificListeners();
    }

    /**
     * 🎛️ CONFIGURAR LISTENERS ESPECÍFICOS POR TAB
     */
    setupTabSpecificListeners() {
        // TAB EQUIPOS: Filtros y vistas
        const filtroEquipos = document.getElementById('filtro-equipos-v2');
        const ordenarEquipos = document.getElementById('ordenar-equipos-v2');

        if (filtroEquipos) {
            filtroEquipos.addEventListener('change', () => this.filterEquipos());
        }
        if (ordenarEquipos) {
            ordenarEquipos.addEventListener('change', () => this.sortEquipos());
        }

        // Vista toggle (Cards vs Table)
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // TAB INDIVIDUAL: Búsqueda y filtros
        const buscarAsesor = document.getElementById('buscar-asesor-v2');
        const filtroPerformance = document.getElementById('filtro-performance-v2');

        if (buscarAsesor) {
            buscarAsesor.addEventListener('input', this.debounce(() => {
                this.searchAsesores();
            }, 300));
        }

        if (filtroPerformance) {
            filtroPerformance.addEventListener('change', () => this.filterAsesores());
        }

        // TAB TENDENCIAS: Período y exportación
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = e.currentTarget.getAttribute('data-period');
                this.switchPeriod(period);
            });
        });
    }

    /**
     * 🎛️ CAMBIAR TAB ACTIVO
     */
    switchTab(tabName) {
        if (this.currentTab === tabName) return;

        console.log(`🎛️ Cambiando a tab: ${tabName}`);

        // Actualizar botones de navegación
        document.querySelectorAll('.tab-button-v2').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Ocultar contenido anterior
        document.querySelectorAll('.tab-content-v2').forEach(content => {
            content.style.display = 'none';
        });

        // Mostrar contenido nuevo
        const newContent = document.getElementById(`tab-content-${tabName}`);
        if (newContent) {
            newContent.style.display = 'block';
            newContent.classList.add('active');
        }

        this.currentTab = tabName;

        // Cargar datos específicos del tab si es necesario
        this.loadTabSpecificData(tabName);

        // Actualizar breadcrumb
        this.updateBreadcrumb(tabName);
    }

    /**
     * 📊 CARGAR DATOS DEL DASHBOARD UNIFICADO
     */
    async loadDashboardData(forceRefresh = false) {
        if (this.isLoading && !forceRefresh) return;

        this.isLoading = true;
        this.showLoader();

        try {
            console.log('📡 Cargando dashboard unificado...');

            const response = await fetch('/admin/metricas/dashboard-unificado', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.dashboardData = await response.json();

            if (!this.dashboardData.success) {
                throw new Error(this.dashboardData.message || 'Error al cargar datos');
            }

            console.log('✅ Dashboard unificado cargado:', this.dashboardData);

            // Renderizar todos los tabs con los nuevos datos
            this.renderAllTabs();

            // Actualizar timestamp
            this.updateLastRefresh();

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showError('Error al cargar métricas: ' + error.message);
        } finally {
            this.isLoading = false;
            this.hideLoader();
        }
    }

    /**
     * 🎨 RENDERIZAR TODOS LOS TABS
     */
    renderAllTabs() {
        if (!this.dashboardData) return;

        console.log('🎨 Renderizando todos los tabs...');

        this.renderResumenTab();
        this.renderEquiposTab();
        this.renderIndividualTab();
        this.renderTendenciasTab();
    }

    /**
     * 📊 RENDERIZAR TAB RESUMEN
     */
    renderResumenTab() {
        const data = this.dashboardData;

        // KPIs Globales
        this.updateKPIs(data.global_kpis);

        // Distribución por estados
        this.updateDistribucion(data.global_kpis.distribucion_global);

        // Insights automáticos
        this.updateInsights(data.insights);

        console.log('✅ Tab Resumen renderizado');
    }

    /**
     * 👥 RENDERIZAR TAB EQUIPOS
     */
    renderEquiposTab() {
        const data = this.dashboardData;

        // Summary cards
        this.updateEquiposSummary(data.jerarquia.resumen);

        // Grid de equipos
        this.renderEquiposGrid(data.equipos);

        console.log('✅ Tab Equipos renderizado');
    }

    /**
     * 🎯 RENDERIZAR TAB INDIVIDUAL
     */
    renderIndividualTab() {
        const data = this.dashboardData;

        // Poblar filtro de equipos
        this.populateTeamFilter(data.jerarquia.gerentes);

        // Top performers y needs improvement
        this.renderPerformanceHighlights(data.asesores_individuales);

        // Grid de asesores
        this.renderAsesoresGrid(data.asesores_individuales);

        console.log('✅ Tab Individual renderizado');
    }

    /**
     * 📈 RENDERIZAR TAB TENDENCIAS
     */
    renderTendenciasTab() {
        const data = this.dashboardData;

        // Gráficos de tendencias
        this.renderTrendsCharts(data.tendencias);

        // Tabla de datos históricos
        this.renderHistoricalTable(data.tendencias.mensual);

        console.log('✅ Tab Tendencias renderizado');
    }

    /**
     * 📊 ACTUALIZAR KPIs GLOBALES
     */
    updateKPIs(globalKpis) {
        // Total Reclutas
        const totalElement = document.getElementById('kpi-total-reclutas');
        if (totalElement) {
            this.animateNumber(totalElement, globalKpis.total_reclutas);
        }

        // Tasa de Conversión
        const conversionElement = document.getElementById('kpi-conversion');
        if (conversionElement) {
            conversionElement.textContent = `${globalKpis.tasas.conversion}%`;
        }

        // Equipos Activos
        const teamsElement = document.getElementById('kpi-teams');
        if (teamsElement) {
            const equiposActivos = this.dashboardData.jerarquia.resumen.total_equipos_activos;
            this.animateNumber(teamsElement, equiposActivos);
        }

        // Performance Global
        const performanceElement = document.getElementById('kpi-performance');
        if (performanceElement) {
            performanceElement.textContent = `${globalKpis.performance_global.score}%`;
        }

        console.log('📊 KPIs actualizados');
    }

    /**
     * 📊 ACTUALIZAR DISTRIBUCIÓN
     */
    updateDistribucion(distribucion) {
        // Activos
        const activosCount = document.getElementById('resumen-activos');
        const activosPct = document.getElementById('resumen-activos-pct');
        if (activosCount) this.animateNumber(activosCount, distribucion.activos);
        if (activosPct) {
            const pct = this.dashboardData.global_kpis.tasas.conversion;
            activosPct.textContent = `${pct}%`;
        }

        // En Proceso
        const procesoCount = document.getElementById('resumen-proceso');
        const procesoPct = document.getElementById('resumen-proceso-pct');
        if (procesoCount) this.animateNumber(procesoCount, distribucion.en_proceso);
        if (procesoPct) {
            const pct = this.dashboardData.global_kpis.tasas.proceso;
            procesoPct.textContent = `${pct}%`;
        }

        // Rechazados
        const rechazadosCount = document.getElementById('resumen-rechazados');
        const rechazadosPct = document.getElementById('resumen-rechazados-pct');
        if (rechazadosCount) this.animateNumber(rechazadosCount, distribucion.rechazados);
        if (rechazadosPct) {
            const pct = this.dashboardData.global_kpis.tasas.rechazo;
            rechazadosPct.textContent = `${pct}%`;
        }

        console.log('📊 Distribución actualizada');
    }

    /**
     * 🔍 ACTUALIZAR INSIGHTS
     */
    updateInsights(insights) {
        // Alertas
        const alertasContent = document.getElementById('alertas-content');
        if (alertasContent) {
            alertasContent.innerHTML = this.renderInsightsList(insights.alertas, 'warning');
        }

        // Oportunidades
        const oportunidadesContent = document.getElementById('oportunidades-content');
        if (oportunidadesContent) {
            oportunidadesContent.innerHTML = this.renderInsightsList(insights.oportunidades, 'info');
        }

        // Destacados
        const destacadosContent = document.getElementById('destacados-content');
        if (destacadosContent) {
            destacadosContent.innerHTML = this.renderInsightsList(insights.destacados, 'success');
        }

        console.log('🔍 Insights actualizados');
    }

    /**
     * 📊 RENDERIZAR LISTA DE INSIGHTS
     */
    renderInsightsList(items, type) {
        if (!items || items.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>Todo en orden</p>
                </div>
            `;
        }

        const iconMap = {
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-lightbulb',
            success: 'fas fa-star'
        };

        return items.map(item => `
            <div class="insight-item ${type}">
                <div class="insight-icon">
                    <i class="${iconMap[type]}"></i>
                </div>
                <div class="insight-text">
                    <p>${item.mensaje}</p>
                    ${item.accion ? `<small>Acción: ${item.accion}</small>` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * 👥 ACTUALIZAR RESUMEN DE EQUIPOS
     */
    updateEquiposSummary(resumen) {
        const totalGerentes = document.getElementById('total-gerentes');
        const equiposActivos = document.getElementById('equipos-activos');
        const asesoresIndependientes = document.getElementById('asesores-independientes');

        if (totalGerentes) this.animateNumber(totalGerentes, resumen.total_gerentes);
        if (equiposActivos) this.animateNumber(equiposActivos, resumen.total_equipos_activos);
        if (asesoresIndependientes) this.animateNumber(asesoresIndependientes, resumen.total_asesores_independientes);
    }

    /**
     * 👥 RENDERIZAR GRID DE EQUIPOS
     */
    renderEquiposGrid(equipos) {
        const container = document.getElementById('equipos-container-v2');
        if (!container || !equipos) return;

        const html = equipos.map(equipo => `
            <div class="equipo-card-v2" data-gerente-id="${equipo.gerente.id}">
                <div class="equipo-header">
                    <div class="gerente-info">
                        <div class="gerente-avatar">
                            ${equipo.gerente.foto_url ?
                                `<img src="${equipo.gerente.foto_url}" alt="${equipo.gerente.nombre}">` :
                                `<div class="avatar-placeholder">${this.getInitials(equipo.gerente.nombre)}</div>`
                            }
                        </div>
                        <div class="gerente-data">
                            <h4>${equipo.gerente.nombre}</h4>
                            <p>${equipo.gerente.email}</p>
                            <span class="performance-badge ${this.getPerformanceClass(equipo.equipo_stats.tasa_exito)}">
                                ${equipo.equipo_stats.performance_level}
                            </span>
                        </div>
                    </div>
                    <div class="equipo-stats">
                        <div class="stat-item">
                            <span class="stat-number">${equipo.equipo_stats.tasa_exito}%</span>
                            <span class="stat-label">Éxito</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${equipo.equipo_stats.total_asesores}</span>
                            <span class="stat-label">Asesores</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${equipo.equipo_stats.total_reclutas}</span>
                            <span class="stat-label">Reclutas</span>
                        </div>
                    </div>
                </div>
                <div class="equipo-details">
                    ${equipo.top_asesor ? `
                        <div class="top-asesor">
                            <i class="fas fa-medal"></i>
                            <span>Top: ${equipo.top_asesor.nombre} (${equipo.top_asesor.tasa_exito}%)</span>
                        </div>
                    ` : ''}
                    <div class="tendencia">
                        <i class="fas fa-chart-line"></i>
                        <span>${equipo.tendencia}</span>
                    </div>
                </div>
                <div class="equipo-actions">
                    <button class="btn-details" onclick="metricasV2.viewEquipoDetails(${equipo.gerente.id})">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                    <button class="btn-manage" onclick="metricasV2.manageEquipo(${equipo.gerente.id})">
                        <i class="fas fa-cog"></i> Gestionar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * 🎯 RENDERIZAR HIGHLIGHTS DE PERFORMANCE
     */
    renderPerformanceHighlights(asesores) {
        // Top Performers (mejores 5)
        const topPerformers = asesores.slice(0, 5);
        const topContainer = document.getElementById('top-performers-v2');

        if (topContainer) {
            topContainer.innerHTML = topPerformers.map(asesor => `
                <div class="performer-item top">
                    <div class="performer-avatar">
                        ${asesor.foto_url ?
                            `<img src="${asesor.foto_url}" alt="${asesor.nombre}">` :
                            `<div class="avatar-placeholder">${this.getInitials(asesor.nombre)}</div>`
                        }
                    </div>
                    <div class="performer-info">
                        <h6>${asesor.nombre}</h6>
                        <p>${asesor.gerente_nombre || 'Independiente'}</p>
                        <div class="performance-score">${asesor.metricas.tasa_exito}%</div>
                    </div>
                </div>
            `).join('');
        }

        // Needs Improvement (peores 5)
        const needsImprovement = asesores.filter(a => a.metricas.tasa_exito < 50).slice(-5);
        const improvementContainer = document.getElementById('needs-improvement-v2');

        if (improvementContainer) {
            improvementContainer.innerHTML = needsImprovement.map(asesor => `
                <div class="performer-item improvement">
                    <div class="performer-avatar">
                        ${asesor.foto_url ?
                            `<img src="${asesor.foto_url}" alt="${asesor.nombre}">` :
                            `<div class="avatar-placeholder">${this.getInitials(asesor.nombre)}</div>`
                        }
                    </div>
                    <div class="performer-info">
                        <h6>${asesor.nombre}</h6>
                        <p>${asesor.gerente_nombre || 'Independiente'}</p>
                        <div class="performance-score low">${asesor.metricas.tasa_exito}%</div>
                    </div>
                </div>
            `).join('');
        }
    }

    /**
     * 🎯 RENDERIZAR GRID DE ASESORES
     */
    renderAsesoresGrid(asesores) {
        const container = document.getElementById('asesores-grid-v2');
        if (!container || !asesores) return;

        const html = asesores.map(asesor => `
            <div class="asesor-card-v2" data-asesor-id="${asesor.id}">
                <div class="asesor-header">
                    <div class="asesor-avatar">
                        ${asesor.foto_url ?
                            `<img src="${asesor.foto_url}" alt="${asesor.nombre}">` :
                            `<div class="avatar-placeholder">${this.getInitials(asesor.nombre)}</div>`
                        }
                    </div>
                    <div class="asesor-info">
                        <h4>${asesor.nombre}</h4>
                        <p>${asesor.email}</p>
                        <small>${asesor.gerente_nombre || 'Independiente'}</small>
                    </div>
                    <div class="performance-indicator ${this.getPerformanceClass(asesor.metricas.tasa_exito)}">
                        ${asesor.metricas.tasa_exito}%
                    </div>
                </div>
                <div class="asesor-metrics">
                    <div class="metric-item">
                        <span class="metric-value">${asesor.metricas.total}</span>
                        <span class="metric-label">Total</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${asesor.metricas.activos}</span>
                        <span class="metric-label">Activos</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${asesor.metricas.proceso}</span>
                        <span class="metric-label">Proceso</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-value">${asesor.metricas.rechazados}</span>
                        <span class="metric-label">Rechazados</span>
                    </div>
                </div>
                <div class="asesor-actions">
                    <button class="btn-details" onclick="metricasV2.viewAsesorDetails(${asesor.id})">
                        <i class="fas fa-eye"></i> Ver Detalles
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * 📈 RENDERIZAR GRÁFICOS DE TENDENCIAS
     */
    renderTrendsCharts(tendencias) {
        // Placeholder para Chart.js integration
        const chartContainer = document.getElementById('chart-tendencia-general');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="chart-placeholder-content">
                    <i class="fas fa-chart-line" style="font-size: 3rem; color: #e5e7eb; margin-bottom: 1rem;"></i>
                    <p style="color: #9ca3af;">Gráfico de tendencias se renderizará aquí</p>
                    <small style="color: #9ca3af;">Datos disponibles: ${tendencias.mensual.length} períodos</small>
                </div>
            `;
        }
    }

    /**
     * 📋 RENDERIZAR TABLA HISTÓRICA
     */
    renderHistoricalTable(monthlyData) {
        const tbody = document.querySelector('#historical-data-table tbody');
        if (!tbody || !monthlyData) return;

        const html = monthlyData.map(periodo => `
            <tr>
                <td>${periodo.periodo_nombre}</td>
                <td>${periodo.metricas.total}</td>
                <td>${periodo.metricas.activos}</td>
                <td>${periodo.metricas.proceso}</td>
                <td>${periodo.metricas.rechazados}</td>
                <td>${periodo.metricas.tasa_conversion}%</td>
                <td>
                    <span class="trend-indicator ${this.getTrendClass(periodo.metricas.tasa_conversion)}">
                        <i class="fas fa-arrow-up"></i> +2.1%
                    </span>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = html;
    }

    /**
     * 🔍 MÉTODOS DE FILTRADO Y BÚSQUEDA
     */
    filterEquipos() {
        const filtro = document.getElementById('filtro-equipos-v2')?.value;
        console.log('🔍 Filtrando equipos por:', filtro);
        // Implementar lógica de filtrado
    }

    sortEquipos() {
        const orden = document.getElementById('ordenar-equipos-v2')?.value;
        console.log('📊 Ordenando equipos por:', orden);
        // Implementar lógica de ordenamiento
    }

    searchAsesores() {
        const query = document.getElementById('buscar-asesor-v2')?.value;
        console.log('🔍 Buscando asesores:', query);
        // Implementar lógica de búsqueda
    }

    filterAsesores() {
        const filtro = document.getElementById('filtro-performance-v2')?.value;
        console.log('🔍 Filtrando asesores por performance:', filtro);
        // Implementar lógica de filtrado
    }

    switchView(view) {
        console.log('👀 Cambiando vista a:', view);
        // Implementar cambio de vista (cards vs table)
    }

    switchPeriod(period) {
        console.log('📅 Cambiando período a:', period);
        // Implementar cambio de período en tendencias
    }

    /**
     * 🎛️ MÉTODOS DE UTILIDAD
     */
    getInitials(name) {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '??';
    }

    getPerformanceClass(percentage) {
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'average';
        return 'needs-improvement';
    }

    getTrendClass(percentage) {
        return 'positive'; // Placeholder
    }

    animateNumber(element, targetValue) {
        if (!element) return;

        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    updateLastRefresh() {
        const element = document.getElementById('last-refresh-v2');
        if (element) {
            const now = new Date();
            element.textContent = `Actualizado: ${now.toLocaleTimeString()}`;
        }
    }

    updateBreadcrumb(tabName) {
        const breadcrumb = document.getElementById('metricas-breadcrumb');
        if (breadcrumb) {
            const tabNames = {
                'resumen': 'Resumen General',
                'equipos': 'Vista por Equipos',
                'individual': 'Análisis Individual',
                'tendencias': 'Tendencias & Reportes'
            };

            breadcrumb.innerHTML = `
                <nav class="breadcrumb-nav">
                    <span class="breadcrumb-item" onclick="metricasV2.switchTab('resumen')">
                        <i class="fas fa-home"></i> Dashboard
                    </span>
                    <i class="fas fa-chevron-right"></i>
                    <span class="breadcrumb-item active">
                        ${tabNames[tabName] || tabName}
                    </span>
                </nav>
            `;
            breadcrumb.style.display = 'block';
        }
    }

    showLoader() {
        const loader = document.getElementById('metricas-loader-v2');
        if (loader) {
            loader.style.display = 'flex';

            // Animar barra de progreso
            const progressFill = document.getElementById('progress-fill-v2');
            if (progressFill) {
                progressFill.style.width = '0%';
                setTimeout(() => progressFill.style.width = '100%', 100);
            }
        }
    }

    hideLoader() {
        const loader = document.getElementById('metricas-loader-v2');
        if (loader) {
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }

    showError(message) {
        console.error('❌ Error:', message);
        // Implementar notificación de error
        alert('Error: ' + message); // Temporal
    }

    ensureV2Styles() {
        // Verificar si los estilos v2 están cargados
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/static/css/metricas-admin-v2.css';
        link.onload = () => console.log('✅ Estilos V2 cargados');
        document.head.appendChild(link);
    }

    setupAutoRefresh() {
        // Auto-refresh cada 5 minutos
        this.refreshInterval = setInterval(() => {
            if (!this.isLoading) {
                console.log('🔄 Auto-refresh ejecutado');
                this.loadDashboardData();
            }
        }, 5 * 60 * 1000);
    }

    loadTabSpecificData(tabName) {
        // Cargar datos específicos si es necesario
        console.log(`📡 Cargando datos específicos para tab: ${tabName}`);
    }

    populateTeamFilter(gerentes) {
        const select = document.getElementById('filtro-equipo-v2');
        if (!select || !gerentes) return;

        // Mantener opciones existentes y agregar gerentes
        const gerentesOptions = gerentes.map(gerente =>
            `<option value="${gerente.id}">Equipo de ${gerente.nombre}</option>`
        ).join('');

        select.innerHTML = `
            <option value="todos">Todos los equipos</option>
            <option value="independientes">Asesores independientes</option>
            ${gerentesOptions}
        `;
    }

    exportData() {
        console.log('📥 Exportando datos...');
        // Implementar exportación
        window.open('/admin/metricas/exportar', '_blank');
    }

    viewEquipoDetails(gerenteId) {
        console.log('👁️ Ver detalles del equipo:', gerenteId);
        // Implementar vista detallada del equipo
    }

    manageEquipo(gerenteId) {
        console.log('⚙️ Gestionar equipo:', gerenteId);
        // Implementar gestión del equipo
    }

    viewAsesorDetails(asesorId) {
        console.log('👁️ Ver detalles del asesor:', asesorId);
        // Implementar vista detallada del asesor
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

/* ============================================================================ */
/* 🚀 INICIALIZACIÓN GLOBAL */
/* ============================================================================ */

let metricasV2;

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        metricasV2 = new MetricasAdminV2();
    });
} else {
    metricasV2 = new MetricasAdminV2();
}

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
    if (metricasV2) {
        metricasV2.destroy();
    }
});

console.log('📦 Métricas Admin V2.0 - Módulo cargado');