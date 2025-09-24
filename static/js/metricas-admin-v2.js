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
        this.userRole = null;
        this.userPermissions = {};
        this.filteredScope = {};

        // this.init(); // Initialization will be controlled externally
    }

    /**
     * 🚀 INICIALIZACIÓN PRINCIPAL
     */
    init() {
        console.log('🎯 Iniciando Métricas Admin V2.0...');

        this.setupEventListeners();
        // this.setupAutoRefresh(); // Moved to initializeMetricasAdminV2
        // this.loadDashboardData(); // Moved to initializeMetricasAdminV2

        // Verificar si el CSS v2 está cargado
        this.ensureV2Styles();
    }

    // ✅ NUEVA FUNCIÓN: Inicializar y cargar datos para usuarios autenticados
    async initializeMetricasAdminV2() {
        console.log('🚀 Inicializando y cargando datos de Metricas Admin V2...');
        this.init(); // Call the internal init to set up event listeners and styles
        await this.loadDashboardData(); // Load data
        this.setupAutoRefresh(); // Start auto-refresh after initial load
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
            filtroEquipos.addEventListener('change', () => this.filterEquipos()); // Placeholder
        }
        if (ordenarEquipos) {
            ordenarEquipos.addEventListener('change', () => this.sortEquipos()); // Placeholder
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
        const filtroEquipo = document.getElementById('filtro-equipo-v2');

        if (buscarAsesor) {
            buscarAsesor.addEventListener('input', this.debounce(() => this.applyAsesoresFilters(), 300));
        }
        if (filtroPerformance) {
            filtroPerformance.addEventListener('change', () => this.applyAsesoresFilters());
        }
        if (filtroEquipo) {
            filtroEquipo.addEventListener('change', () => this.applyAsesoresFilters());
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

            // 🔐 EXTRAER INFORMACIÓN DE ROL Y PERMISOS
            this.userRole = this.dashboardData.user_role || 'asesor';
            this.filteredScope = this.dashboardData.filtered_scope || {};

            console.log('✅ Dashboard unificado cargado:', this.dashboardData);
            console.log('🔐 Rol del usuario:', this.userRole);
            console.log('📊 Alcance filtrado:', this.filteredScope);

            // 🎨 ADAPTAR UI SEGÚN ROL
            this.adaptUIByRole();

            // Renderizar todos los tabs con los nuevos datos filtrados
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
     * 🔐 ADAPTAR UI SEGÚN ROL DEL USUARIO
     */
    adaptUIByRole() {
        console.log(`🔐 Adaptando UI para rol: ${this.userRole}`);

        // 🎛️ CONFIGURAR TABS VISIBLES SEGÚN ROL
        this.configureTabsByRole();

        // 🎨 PERSONALIZAR ELEMENTOS UI SEGÚN ROL
        this.personalizeUIElements();

        // 📊 CONFIGURAR CONTROLES DE EXPORTACIÓN
        this.configureExportControls();

        // 🎯 MOSTRAR INFORMACIÓN DE ALCANCE
        this.displayFilteredScope();
    }

    /**
     * 🎛️ CONFIGURAR TABS VISIBLES SEGÚN ROL
     */
    configureTabsByRole() {
        const tabs = {
            'resumen': document.getElementById('tab-resumen'),
            'equipos': document.getElementById('tab-equipos'),
            'individual': document.getElementById('tab-individual'),
            'tendencias': document.getElementById('tab-tendencias')
        };

        const tabContents = {
            'resumen': document.getElementById('tab-content-resumen'),
            'equipos': document.getElementById('tab-content-equipos'),
            'individual': document.getElementById('tab-content-individual'),
            'tendencias': document.getElementById('tab-content-tendencias')
        };

        // 👑 ADMINISTRADOR: Todos los tabs visibles
        if (this.userRole === 'admin') {
            Object.values(tabs).forEach(tab => {
                if (tab) {
                    tab.style.display = 'flex';
                    tab.classList.remove('disabled');
                }
            });
            return;
        }

        // 👔 GERENTE: Resumen, Equipos, Individual, Tendencias (filtrado)
        if (this.userRole === 'gerente') {
            // Todos los tabs visibles pero con datos filtrados
            Object.values(tabs).forEach(tab => {
                if (tab) {
                    tab.style.display = 'flex';
                    tab.classList.remove('disabled');
                }
            });

            // Actualizar textos para gerente
            if (tabs.equipos) {
                const equiposSpan = tabs.equipos.querySelector('span');
                if (equiposSpan) equiposSpan.textContent = 'Mi Equipo';
            }
            return;
        }

        // 📈 ASESOR: Solo tab Individual (vista personal)
        if (this.userRole === 'asesor') {
            // Ocultar tabs no relevantes para asesores
            ['equipos', 'tendencias'].forEach(tabName => {
                if (tabs[tabName]) {
                    tabs[tabName].style.display = 'none';
                }
                if (tabContents[tabName]) {
                    tabContents[tabName].style.display = 'none';
                }
            });

            // Asegurar que el tab Individual esté visible y activo
            if (tabs.individual) {
                tabs.individual.style.display = 'flex';
                tabs.individual.classList.remove('disabled');
            }

            // Actualizar texto del tab Individual
            if (tabs.individual) {
                const individualSpan = tabs.individual.querySelector('span');
                if (individualSpan) individualSpan.textContent = 'Mis Métricas';
            }

            // Cambiar al tab Individual si está en otro
            if (this.currentTab !== 'individual' && this.currentTab !== 'resumen') {
                this.switchTab('individual');
            }
        }
    }

    /**
     * 🎨 PERSONALIZAR ELEMENTOS UI SEGÚN ROL
     */
    personalizeUIElements() {
        // 📊 ACTUALIZAR TÍTULO PRINCIPAL
        const headerTitle = document.querySelector('.section-header-v2 h3');
        if (headerTitle) {
            const roleLabels = {
                'admin': 'Métricas Administrativas',
                'gerente': 'Panel de Gestión',
                'asesor': 'Mi Dashboard Personal'
            };
            headerTitle.innerHTML = `<i class="fas fa-chart-bar"></i> ${roleLabels[this.userRole] || 'Métricas'}`;
        }

        // 🔐 MOSTRAR BADGE DE ROL
        this.showRoleBadge();

        // 📝 PERSONALIZAR BREADCRUMB
        const breadcrumb = document.getElementById('breadcrumb-home');
        if (breadcrumb) {
            const roleHome = {
                'admin': 'Admin Dashboard',
                'gerente': 'Panel Gerencial',
                'asesor': 'Mi Dashboard'
            };
            breadcrumb.innerHTML = `<i class="fas fa-home"></i> ${roleHome[this.userRole] || 'Dashboard'}`;
        }
    }

    /**
     * 🏷️ MOSTRAR BADGE DE ROL
     */
    showRoleBadge() {
        const headerMeta = document.querySelector('.header-meta');
        if (!headerMeta) return;

        // Remover badge existente
        const existingBadge = headerMeta.querySelector('.role-badge');
        if (existingBadge) existingBadge.remove();

        // Crear nuevo badge
        const roleBadge = document.createElement('span');
        roleBadge.className = 'role-badge';

        const roleInfo = {
            'admin': { label: 'Administrador', color: '#dc3545' },
            'gerente': { label: 'Gerente', color: '#fd7e14' },
            'asesor': { label: 'Asesor', color: '#198754' }
        };

        const info = roleInfo[this.userRole] || { label: 'Usuario', color: '#6c757d' };
        roleBadge.textContent = info.label;
        roleBadge.style.backgroundColor = info.color;
        roleBadge.style.color = 'white';
        roleBadge.style.padding = '2px 8px';
        roleBadge.style.borderRadius = '4px';
        roleBadge.style.fontSize = '11px';
        roleBadge.style.fontWeight = '600';
        roleBadge.style.textTransform = 'uppercase';

        headerMeta.appendChild(roleBadge);
    }

    /**
     * 📊 CONFIGURAR CONTROLES DE EXPORTACIÓN
     */
    configureExportControls() {
        const exportBtn = document.getElementById('export-metricas-v2');
        const settingsBtn = document.getElementById('settings-metricas-v2');

        if (this.userRole === 'admin') {
            // Admin tiene acceso completo
            if (exportBtn) {
                exportBtn.style.display = 'flex';
                exportBtn.title = 'Exportar todas las métricas';
            }
            if (settingsBtn) {
                settingsBtn.style.display = 'flex';
            }
        } else if (this.userRole === 'gerente') {
            // Gerente puede exportar datos de su equipo
            if (exportBtn) {
                exportBtn.style.display = 'flex';
                exportBtn.title = 'Exportar métricas de mi equipo';
            }
            if (settingsBtn) {
                settingsBtn.style.display = 'none';
            }
        } else {
            // Asesor no puede exportar
            if (exportBtn) {
                exportBtn.style.display = 'none';
            }
            if (settingsBtn) {
                settingsBtn.style.display = 'none';
            }
        }
    }

    /**
     * 🎯 MOSTRAR INFORMACIÓN DE ALCANCE FILTRADO
     */
    displayFilteredScope() {
        const headerMeta = document.querySelector('.header-meta');
        if (!headerMeta || this.userRole === 'admin') return;

        // Crear indicador de alcance
        let scopeIndicator = headerMeta.querySelector('.scope-indicator');
        if (!scopeIndicator) {
            scopeIndicator = document.createElement('span');
            scopeIndicator.className = 'scope-indicator';
            scopeIndicator.style.fontSize = '12px';
            scopeIndicator.style.color = '#6c757d';
            scopeIndicator.style.marginLeft = '8px';
            headerMeta.appendChild(scopeIndicator);
        }

        const accessibleUsers = this.filteredScope.accessible_users || 0;
        const accessibleReclutas = this.filteredScope.accessible_reclutas || 0;

        if (this.userRole === 'gerente') {
            scopeIndicator.innerHTML = `<i class="fas fa-filter"></i> ${accessibleUsers} usuarios, ${accessibleReclutas} reclutas`;
        } else if (this.userRole === 'asesor') {
            scopeIndicator.innerHTML = `<i class="fas fa-user-check"></i> ${accessibleReclutas} reclutas propios`;
        }
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

        // Renderizar el gráfico de distribución
        this.renderDistribucionChart(distribucion);

        console.log('📊 Distribución actualizada');
    }

    /**
     * 📈 RENDERIZAR GRÁFICO DE DISTRIBUCIÓN (DONUT)
     */
    renderDistribucionChart(distribucion) {
        const chartId = 'distribucion';
        this.destroyChart(chartId);

        const ctx = document.getElementById('distribucionChartCanvas').getContext('2d');
        if (!ctx) return;

        this.charts[chartId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Activos', 'En Proceso', 'Rechazados'],
                datasets: [{
                    data: [distribucion.activos, distribucion.en_proceso, distribucion.rechazados],
                    backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#1F2937',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        padding: 10,
                        cornerRadius: 6,
                    }
                }
            }
        });
        console.log('📈 Gráfico de distribución renderizado');
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
            return (
                `<div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>Todo en orden</p>
                </div>`
            );
        }

        const iconMap = {
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-lightbulb',
            success: 'fas fa-star'
        };

        return items.map(item => (
            `<div class="insight-item ${type}">
                <div class="insight-icon">
                    <i class="${iconMap[type]}"></i>
                </div>
                <div class="insight-text">
                    <p>${item.mensaje}</p>
                    ${item.accion ? `<small>Acción: ${item.accion}</small>` : ''}
                </div>
            </div>`
        )).join('');
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

        const html = equipos.map(equipo => (
            `<div class="equipo-card-v2" data-gerente-id="${equipo.gerente.id}">
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
                    ${equipo.top_asesor ? (
                        `<div class="top-asesor">
                            <i class="fas fa-medal"></i>
                            <span>Top: ${equipo.top_asesor.nombre} (${equipo.top_asesor.tasa_exito}%)</span>
                        </div>`
                    ) : ''}
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
        `)).join('');

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
            topContainer.innerHTML = topPerformers.map(asesor => (
                `<div class="performer-item top">
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
                </div>`
            )).join('');
        }

        // Needs Improvement (peores 5)
        const needsImprovement = asesores.filter(a => a.metricas.tasa_exito < 50).slice(-5);
        const improvementContainer = document.getElementById('needs-improvement-v2');

        if (improvementContainer) {
            improvementContainer.innerHTML = needsImprovement.map(asesor => (
                `<div class="performer-item improvement">
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
                </div>`
            )).join('');
        }
    }

    /**
     * 🎯 RENDERIZAR GRID DE ASESORES
     */
    renderAsesoresGrid(asesores) {
        const container = document.getElementById('asesores-grid-v2');
        if (!container || !asesores) return;

        const html = asesores.map(asesor => (
            `<div class="asesor-card-v2" data-asesor-id="${asesor.id}">
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
        `)).join('');

        container.innerHTML = html;
    }

    /**
     * 📈 RENDERIZAR GRÁFICOS DE TENDENCIAS
     */
    renderTrendsCharts(tendencias) {
        const chartId = 'tendencias';
        this.destroyChart(chartId);

        const ctx = document.getElementById('tendenciaChartCanvas').getContext('2d');
        if (!ctx || !tendencias || !tendencias.mensual) return;

        const labels = tendencias.mensual.map(p => p.periodo_nombre);
        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Activos',
                    data: tendencias.mensual.map(p => p.metricas.activos),
                    backgroundColor: '#10B981',
                    borderRadius: 4,
                },
                {
                    label: 'En Proceso',
                    data: tendencias.mensual.map(p => p.metricas.proceso),
                    backgroundColor: '#F59E0B',
                    borderRadius: 4,
                },
                {
                    label: 'Rechazados',
                    data: tendencias.mensual.map(p => p.metricas.rechazados),
                    backgroundColor: '#EF4444',
                    borderRadius: 4,
                }
            ]
        };

        this.charts[chartId] = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                }
            }
        });
        console.log('📈 Gráfico de tendencias renderizado');
    }

    /**
     * 📋 RENDERIZAR TABLA HISTÓRICA
     */
    renderHistoricalTable(monthlyData) {
        const tbody = document.querySelector('#historical-data-table tbody');
        if (!tbody || !monthlyData) return;

        const html = monthlyData.map((periodo, index) => {
            const prevPeriodo = monthlyData[index - 1];
            const trend = prevPeriodo ? periodo.metricas.tasa_conversion - prevPeriodo.metricas.tasa_conversion : 0;
            const trendClass = this.getTrendClass(trend);
            const trendIcon = trend > 0.1 ? 'fa-arrow-up' : (trend < -0.1 ? 'fa-arrow-down' : 'fa-arrow-right');

            return (
            `<tr>
                <td>${periodo.periodo_nombre}</td>
                <td>${periodo.metricas.total}</td>
                <td>${periodo.metricas.activos}</td>
                <td>${periodo.metricas.proceso}</td>
                <td>${periodo.metricas.rechazados}</td>
                <td>${periodo.metricas.tasa_conversion}%</td>
                <td>
                    <span class="trend-indicator ${trendClass}">
                        <i class="fas ${trendIcon}"></i> ${trend.toFixed(1)}%
                    </span>
                </td>
            </tr>`
        )}).join('');

        tbody.innerHTML = html;
    }

    /**
     * 🔍 MÉTODOS DE FILTRADO Y BÚSQUEDA
     */
    applyAsesoresFilters() {
        if (!this.dashboardData || !this.dashboardData.asesores_individuales) return;

        const searchQuery = document.getElementById('buscar-asesor-v2')?.value.toLowerCase() || '';
        const performanceFilter = document.getElementById('filtro-performance-v2')?.value || 'todos';
        const teamFilter = document.getElementById('filtro-equipo-v2')?.value || 'todos';

        let filteredAsesores = this.dashboardData.asesores_individuales;

        // 1. Filtrar por búsqueda
        if (searchQuery) {
            filteredAsesores = filteredAsesores.filter(asesor =>
                (asesor.nombre && asesor.nombre.toLowerCase().includes(searchQuery)) ||
                (asesor.email && asesor.email.toLowerCase().includes(searchQuery))
            );
        }

        // 2. Filtrar por performance
        if (performanceFilter !== 'todos') {
            filteredAsesores = filteredAsesores.filter(asesor => {
                const performanceClass = this.getPerformanceClass(asesor.metricas.tasa_exito);
                return performanceClass === performanceFilter;
            });
        }

        // 3. Filtrar por equipo
        if (teamFilter !== 'todos') {
            if (teamFilter === 'independientes') {
                filteredAsesores = filteredAsesores.filter(asesor => !asesor.gerente_nombre);
            } else {
                const gerenteId = parseInt(teamFilter, 10);
                const gerente = this.dashboardData.jerarquia.gerentes.find(g => g.id === gerenteId);
                if (gerente) {
                    const equipoNombres = [gerente.nombre].concat(gerente.asesores.map(a => a.nombre));
                    filteredAsesores = filteredAsesores.filter(asesor => equipoNombres.includes(asesor.nombre));
                }
            }
        }

        this.renderAsesoresGrid(filteredAsesores);
    }

    switchView(view) {
        console.log('👀 Cambiando vista a:', view);
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.view-btn[data-view="${view}"]`).classList.add('active');

        if (view === 'table') {
            this.renderEquiposTable(this.dashboardData.equipos);
        } else {
            this.renderEquiposGrid(this.dashboardData.equipos);
        }
    }

    renderEquiposTable(equipos) {
        const container = document.getElementById('equipos-container-v2');
        if (!container || !equipos) return;

        const tableHTML = (
            `<div class="table-responsive-v2">
                <table class="data-table-v2 team-table">
                    <thead>
                        <tr>
                            <th>Gerente</th>
                            <th>Asesores</th>
                            <th>Total Reclutas</th>
                            <th>Tasa de Éxito</th>
                            <th>Nivel</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${equipos.map(equipo => (
                            `<tr>
                                <td>
                                    <div class="gerente-info-cell">
                                        <div class="gerente-avatar">
                                            ${equipo.gerente.foto_url ? `<img src="${equipo.gerente.foto_url}" alt="${equipo.gerente.nombre}">` : `<div class="avatar-placeholder">${this.getInitials(equipo.gerente.nombre)}</div>`}
                                        </div>
                                        <div>
                                            <strong>${equipo.gerente.nombre}</strong>
                                            <small>${equipo.gerente.email}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>${equipo.equipo_stats.total_asesores}</td>
                                <td>${equipo.equipo_stats.total_reclutas}</td>
                                <td>${equipo.equipo_stats.tasa_exito}%</td>
                                <td><span class="performance-badge ${this.getPerformanceClass(equipo.equipo_stats.tasa_exito)}">${equipo.equipo_stats.performance_level}</span></td>
                                <td>
                                    <div class="equipo-actions">
                                        <button class="btn-details" onclick="metricasV2.viewEquipoDetails(${equipo.gerente.id})"><i class="fas fa-eye"></i></button>
                                        <button class="btn-manage" onclick="metricasV2.manageEquipo(${equipo.gerente.id})"><i class="fas fa-cog"></i></button>
                                    </div>
                                </td>
                            </tr>`
                        )).join('')}
                    </tbody>
                </table>
            </div>
        `);
        container.innerHTML = tableHTML;
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

    getTrendClass(trendValue) {
        if (trendValue > 0.1) return 'positive';
        if (trendValue < -0.1) return 'negative';
        return 'neutral';
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

            breadcrumb.innerHTML = (
                `<nav class="breadcrumb-nav">
                    <span class="breadcrumb-item" onclick="metricasV2.switchTab('resumen')">
                        <i class="fas fa-home"></i> Dashboard
                    </span>
                    <i class="fas fa-chevron-right"></i>
                    <span class="breadcrumb-item active">
                        ${tabNames[tabName] || tabName}
                    </span>
                </nav>`
            );
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

        select.innerHTML = (
            `<option value="todos">Todos los equipos</option>
            <option value="independientes">Asesores independientes</option>
            ${gerentesOptions}
        `);
    }

    exportData() {
        console.log('📥 Exportando datos...');
        const exportBtn = document.getElementById('export-metricas-v2');
        if (!exportBtn) return;

        exportBtn.disabled = true;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';

        fetch('/admin/metricas/exportar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ formato: 'csv' })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor.');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'metricas_asesores.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            console.log('✅ Exportación completada.');
        })
        .catch(error => {
            console.error('❌ Error en la exportación:', error);
            this.showError('No se pudo completar la exportación.');
        })
        .finally(() => {
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Exportar';
        });
    }

    viewEquipoDetails(gerenteId) {
        console.log('👁️ Ver detalles del equipo:', gerenteId);
        if (!this.dashboardData || !this.dashboardData.jerarquia) return;

        const gerenteData = this.dashboardData.jerarquia.gerentes.find(g => g.id === gerenteId);
        if (!gerenteData) {
            this.showError('No se encontraron datos para este equipo.');
            return;
        }

        this.createEquipoDetailsModal(gerenteData);
    }

    createEquipoDetailsModal(gerenteData) {
        const existingModal = document.getElementById('equipo-details-modal');
        if (existingModal) existingModal.remove();

        const asesoresHTML = gerenteData.asesores.map(asesor => (
            `<div class="asesor-item-in-modal">
                <span>${asesor.nombre}</span>
                <span class="performance-badge ${this.getPerformanceClass(asesor.metricas.tasa_exito)}">${asesor.metricas.tasa_exito}%</span>
            </div>`
        )).join('') || '<p>Este gerente no tiene asesores asignados.</p>';

        const modalHTML = (
            `<div class="modal-overlay-v2" id="equipo-details-modal">
                <div class="modal-content-v2 large">
                    <div class="modal-header-v2">
                        <h3>Equipo de ${gerenteData.nombre}</h3>
                        <button class="close-btn-v2" id="close-equipo-modal">&times;</button>
                    </div>
                    <div class="modal-body-v2">
                        <h4>Rendimiento del Equipo</h4>
                        <div class="equipo-trend-chart">
                            <canvas id="equipoTrendChartCanvas"></canvas>
                        </div>
                        <h4>Miembros del Equipo (${gerenteData.asesores.length})</h4>
                        <div class="asesores-list-in-modal">
                            ${asesoresHTML}
                        </div>
                    </div>
                </div>
            </div>
        `);

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        this.renderEquipoTrendChart(gerenteData.asesores);

        document.getElementById('close-equipo-modal').addEventListener('click', () => this.closeEquipoDetailsModal());
        document.getElementById('equipo-details-modal').addEventListener('click', (e) => {
            if (e.target.id === 'equipo-details-modal') this.closeEquipoDetailsModal();
        });
    }

    closeEquipoDetailsModal() {
        const modal = document.getElementById('equipo-details-modal');
        if (modal) modal.remove();
    }

    renderEquipoTrendChart(asesores) {
        const ctx = document.getElementById('equipoTrendChartCanvas').getContext('2d');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: asesores.map(a => a.nombre),
                datasets: [{
                    label: 'Tasa de Éxito (%)',
                    data: asesores.map(a => a.metricas.tasa_exito),
                    backgroundColor: asesores.map(a => this.getPerformanceColor(a.metricas.tasa_exito)),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true, max: 100 }
                }
            }
        });
    }

    getPerformanceColor(percentage) {
        if (percentage >= 80) return 'rgba(16, 185, 129, 0.7)';
        if (percentage >= 60) return 'rgba(52, 211, 153, 0.7)';
        if (percentage >= 40) return 'rgba(245, 158, 11, 0.7)';
        return 'rgba(239, 68, 68, 0.7)';
    }

    manageEquipo(gerenteId) {
        console.log('⚙️ Gestionar equipo:', gerenteId);
        alert('La funcionalidad para gestionar equipos desde esta pantalla está en desarrollo.\n\nPor ahora, puedes gestionar la jerarquía desde la sección correspondiente.');
    }

    viewAsesorDetails(asesorId) {
        console.log('👁️ Ver detalles del asesor:', asesorId);
        const endpoint = `/admin/metricas/asesor/${asesorId}/detalle`;

        fetch(endpoint)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.createAsesorDetailsModal(data);
                } else {
                    this.showError(data.message || 'No se pudieron cargar los detalles.');
                }
            })
            .catch(error => {
                console.error('Error al cargar detalles del asesor:', error);
                this.showError('Error de conexión al cargar detalles.');
            });
    }

    createAsesorDetailsModal(data) {
        // Eliminar modal existente si lo hay
        const existingModal = document.getElementById('asesor-details-modal');
        if (existingModal) existingModal.remove();

        const asesor = data.asesor;
        const metricas = data.metricas;
        const tendencia = data.tendencia_mensual;

        const modalHTML = (
            `<div class="modal-overlay-v2" id="asesor-details-modal">
                <div class="modal-content-v2">
                    <div class="modal-header-v2">
                        <h3>Detalles de ${asesor.nombre}</h3>
                        <button class="close-btn-v2" id="close-asesor-modal">&times;</button>
                    </div>
                    <div class="modal-body-v2">
                        <div class="asesor-summary">
                            <p><strong>Email:</strong> ${asesor.email}</p>
                            <p><strong>Total Reclutas:</strong> ${metricas.total}</p>
                            <p><strong>Tasa de Éxito:</strong> ${metricas.tasa_exito}%</p>
                        </div>
                        <div class="asesor-trend-chart">
                            <h4>Tendencia Mensual</h4>
                            <canvas id="asesorTrendChartCanvas"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `);

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Renderizar el gráfico de tendencia del asesor
        this.renderAsesorTrendChart(tendencia);

        // Añadir event listeners para cerrar
        document.getElementById('close-asesor-modal').addEventListener('click', () => this.closeAsesorDetailsModal());
        document.getElementById('asesor-details-modal').addEventListener('click', (e) => {
            if (e.target.id === 'asesor-details-modal') {
                this.closeAsesorDetailsModal();
            }
        });
    }

    closeAsesorDetailsModal() {
        const modal = document.getElementById('asesor-details-modal');
        if (modal) modal.remove();
        this.destroyChart('asesorTrend'); // Destruir el gráfico al cerrar
    }

    renderAsesorTrendChart(tendencia) {
        const chartId = 'asesorTrend';
        this.destroyChart(chartId); // Destruir gráfico anterior

        const ctx = document.getElementById('asesorTrendChartCanvas').getContext('2d');
        if (!ctx) return;

        this.charts[chartId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: tendencia.map(t => t.mes_nombre),
                datasets: [{
                    label: 'Total Reclutas',
                    data: tendencia.map(t => t.total),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        // Destruir todos los gráficos al salir
        Object.keys(this.charts).forEach(chartId => {
            this.destroyChart(chartId);
        });
    }

    /**
     * 💥 DESTRUIR UN GRÁFICO EXISTENTE PARA EVITAR FUGAS DE MEMORIA
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
            console.log(`💥 Gráfico '${chartId}' destruido.`);
        }
    }
}

/* ============================================================================ */
/* 🚀 INICIALIZACIÓN GLOBAL */
/* ============================================================================ */

let metricasV2;

// ✅ NUEVA FUNCIÓN: Inicializar MetricasAdminV2 externamente
window.initializeMetricasAdminV2 = function() {
    if (!metricasV2) {
        metricasV2 = new MetricasAdminV2();
    }
    metricasV2.initializeMetricasAdminV2();
};

// ✅ NUEVA FUNCIÓN: Limpiar MetricasAdminV2 externamente
window.cleanupMetricasAdminV2 = function() {
    if (metricasV2) {
        metricasV2.destroy();
        metricasV2 = null; // Clear the instance
    }
};

// Eliminar inicialización automática en DOMContentLoaded
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//         metricasV2 = new MetricasAdminV2();
//     });
// } else {
//     metricasV2 = new MetricasAdminV2();
// }

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
    if (metricasV2) {
        metricasV2.destroy();
    }
});

console.log('📦 Métricas Admin V2.0 - Módulo cargado');
