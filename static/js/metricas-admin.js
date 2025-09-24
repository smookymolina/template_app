// ============================================================================
// 🔧 CORRECCIÓN FINAL - INICIALIZACIÓN DE MÉTRICAS ADMIN
// Archivo: static/js/metricas-admin.js (VERSIÓN CORREGIDA)
// ============================================================================

const MetricasAdmin = { 
    // 🎛️ CONFIGURACIÓN DEL MÓDULO
    config: {
        refreshInterval: 300000, // 5 minutos
        colores: {
            verde: '#10B981',
            amarillo: '#F59E0B',
            rojo: '#EF4444',
            excelente: '#059669',
            bueno: '#10B981',
            regular: '#F59E0B',
            mejora: '#EF4444'
        },
        animacionDuracion: 300,
        initialized: false  // ✅ NUEVO: Flag para evitar doble inicialización
    },
    
    asesoresData: [],

    // 🔄 INICIALIZAR MÓDULO
    init() {
        // ✅ VERIFICAR QUE NO SE INICIALICE MÚLTIPLES VECES
        if (this.config.initialized) {
            console.log('⚠️ MetricasAdmin ya está inicializado');
            return;
        }

        console.log('🎯 Inicializando Módulo de Métricas Admin...');
        
        // ✅ VERIFICAR QUE HAY USUARIO ANTES DE INICIALIZAR
        const currentUser = this.getCurrentUserSafe();
        if (!currentUser) {
            console.log('⚠️ No hay usuario autenticado, postergando inicialización');
            return;
        }

        if (!['admin'].includes(currentUser.rol)) {
            console.log(`⚠️ Usuario con rol ${currentUser.rol} no tiene acceso a métricas avanzadas`);
            return;
        }

        this.bindEvents();
        this.setupContainer();
        this.loadMetricas();
        this.setupAutoRefresh();

        // 🧪 MODO DESARROLLO: Cargar datos de demostración después de 3 segundos si no se cargaron datos reales
        setTimeout(() => {
            const contenedorEquipos = document.getElementById('equipos-jerarquia');
            if (contenedorEquipos && contenedorEquipos.innerHTML.includes('loading-placeholder')) {
                console.log('🧪 Modo desarrollo: Cargando datos de demostración');
                this.renderMetricasDefault();
            }
        }, 3000);

        this.config.initialized = true;
        console.log('✅ MetricasAdmin inicializado correctamente');
    },

    // ✅ NUEVO: Función segura para obtener usuario
    getCurrentUserSafe() {
        try {
            // 1. Intentar desde Auth.currentUser
            if (typeof Auth !== 'undefined' && Auth.currentUser) {
                return Auth.currentUser;
            }
            
            // 2. Intentar desde getCurrentUser global
            if (typeof getCurrentUser === 'function') {
                return getCurrentUser();
            }
            
            // 3. Intentar desde localStorage
            const userDataStr = localStorage.getItem('user_data');
            if (userDataStr) {
                return JSON.parse(userDataStr);
            }
            
            // 4. Intentar desde variable global currentGerente
            if (typeof currentGerente !== 'undefined' && currentGerente) {
                return currentGerente;
            }
            
            return null;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return null;
        }
    },

    // 🏗️ CONFIGURAR CONTENEDOR PARA TU ESTRUCTURA
    setupContainer() {
        const currentUser = this.getCurrentUserSafe();
        
        if (currentUser && ['admin', 'gerente'].includes(currentUser.rol)) {
            // Mostrar elementos según rol
            if (currentUser.rol === 'admin') {
                const adminElements = document.querySelectorAll('.admin-only');
                adminElements.forEach(el => {
                    if (el) el.style.display = 'block';
                });
                document.body.classList.add('admin-view');
                document.body.classList.remove('gerente-view', 'asesor-view');
            } else if (currentUser.rol === 'gerente') {
                const gerenteElements = document.querySelectorAll('.gerente-only, .admin-gerente-only');
                gerenteElements.forEach(el => {
                    if (el) el.style.display = 'block';
                });
                document.body.classList.add('gerente-view');
                document.body.classList.remove('admin-view', 'asesor-view');
            }
            
            console.log('👑 Configuración admin aplicada');
        } else {
            // Ocultar elementos admin y mostrar mensaje de asesor
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => {
                if (el) el.style.display = 'none';
            });
            
            const asesorMessage = document.querySelector('.asesor-only-message');
            if (asesorMessage) {
                asesorMessage.style.display = 'block';
            }
            
            document.body.classList.add('asesor-view');
            document.body.classList.remove('admin-view');
            console.log('👥 Configuración asesor aplicada');
        }
    },

    // 🎭 VINCULAR EVENTOS A TU HTML EXISTENTE
    bindEvents() {
        const refreshBtn = document.getElementById('refresh-metricas-btn');
        if (refreshBtn) {
            // Remover listeners previos
            refreshBtn.removeEventListener('click', this.refreshHandler);
            this.refreshHandler = () => this.loadMetricas(true);
            refreshBtn.addEventListener('click', this.refreshHandler);
        }

        const exportBtn = document.getElementById('export-metricas-btn');
        if (exportBtn) {
            exportBtn.removeEventListener('click', this.exportHandler);
            this.exportHandler = () => this.exportarMetricas();
            exportBtn.addEventListener('click', this.exportHandler);
        }

        const viewToggle = document.getElementById('metricas-view-toggle');
        if (viewToggle) {
            viewToggle.removeEventListener('change', this.toggleHandler);
            this.toggleHandler = (e) => this.toggleView(e.target.checked);
            viewToggle.addEventListener('change', this.toggleHandler);
        }

        // ===== NUEVOS EVENTOS PARA EQUIPOS =====

        // Filtros de equipos
        const filtroEquipos = document.getElementById('filtro-equipos');
        if (filtroEquipos) {
            filtroEquipos.removeEventListener('change', this.filtroEquiposHandler);
            this.filtroEquiposHandler = (e) => this.filtrarEquipos(e.target.value);
            filtroEquipos.addEventListener('change', this.filtroEquiposHandler);
        }

        const ordenarEquipos = document.getElementById('ordenar-equipos');
        if (ordenarEquipos) {
            ordenarEquipos.removeEventListener('change', this.ordenarEquiposHandler);
            this.ordenarEquiposHandler = (e) => this.ordenarEquipos(e.target.value);
            ordenarEquipos.addEventListener('change', this.ordenarEquiposHandler);
        }

        // Toggle entre vista jerárquica y comparativa
        const vistaJerarquica = document.getElementById('vista-jerarquica');
        const vistaComparativa = document.getElementById('vista-comparativa');

        if (vistaJerarquica && vistaComparativa) {
            vistaJerarquica.addEventListener('click', () => this.switchView('jerarquica'));
            vistaComparativa.addEventListener('click', () => this.switchView('comparativa'));
        }

        // Filtros legacy para asesores individuales
        const filtroPerformance = document.getElementById('filtro-performance');
        if (filtroPerformance) {
            filtroPerformance.removeEventListener('change', this.filtroHandler);
            this.filtroHandler = (e) => this.filtrarAsesores(e.target.value);
            filtroPerformance.addEventListener('change', this.filtroHandler);
        }

        const ordenarPor = document.getElementById('ordenar-por');
        if (ordenarPor) {
            ordenarPor.removeEventListener('change', this.ordenarHandler);
            this.ordenarHandler = (e) => this.ordenarAsesores(e.target.value);
            ordenarPor.addEventListener('change', this.ordenarHandler);
        }

        const timeFilters = document.querySelectorAll('.time-filter');
        timeFilters.forEach(button => {
            button.addEventListener('click', (e) => {
                const periodo = e.target.dataset.period;
                this.loadTendencias(periodo);

                // Update active button
                timeFilters.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    },

    // ✅ CARGAR MÉTRICAS CON VERIFICACIÓN DE USUARIO
    async loadMetricas(showLoader = false) {
        const currentUser = this.getCurrentUserSafe();
        
        if (!currentUser) {
            console.log('⚠️ No hay usuario autenticado para cargar métricas');
            return;
        }

        if (!['admin'].includes(currentUser.rol)) {
            console.log(`⚠️ Usuario con rol ${currentUser.rol} no tiene acceso a métricas avanzadas`);
            return;
        }

        if (showLoader) {
            this.showLoader();
        }

        // Determinar endpoint según rol
        let endpoint = '/admin/metricas/asesores'; // Default
        if (currentUser.rol === 'admin') {
            endpoint = '/api/metricas_avanzadas'; // 🚀 NUEVO ENDPOINT CENTRALIZADO
        } else if (currentUser.rol === 'gerente') {
            endpoint = '/admin/metricas/gerentes'; // Métricas específicas para gerentes
        }

        try {
            console.log(`📊 Cargando métricas desde: ${endpoint} para rol: ${currentUser.rol}`);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Respuesta no es JSON. Content-Type: ${contentType}`);
            }

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('No autenticado');
                }
                if (response.status === 403) {
                    throw new Error('Sin permisos para acceder a métricas administrativas');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📊 Datos recibidos:', data);
            
            if (data.success) {
                this.renderMetricas(data);
                this.updateLastRefresh();
                
                if (typeof showNotification !== 'undefined') {
                    showNotification('Métricas actualizadas correctamente', 'success');
                } else if (typeof showSuccess !== 'undefined') {
                    showSuccess('Métricas actualizadas correctamente');
                }
            } else {
                throw new Error(data.message || 'Error al cargar métricas');
            }

        } catch (error) {
            console.error('❌ Error al cargar métricas admin:', error);
            
            if (typeof showNotification !== 'undefined') {
                showNotification(`Error al cargar métricas: ${error.message}`, 'error');
            } else if (typeof showError !== 'undefined') {
                showError('Error al cargar métricas: ' + error.message);
            }
            
            this.renderMetricasDefault();
            
        } finally {
            this.hideLoader();
        }
    },

    // ✅ DATOS POR DEFECTO MEJORADOS CON DATOS DE PRUEBA
    renderMetricasDefault() {
        console.log('📊 Mostrando datos por defecto debido a error');

        const defaultData = {
            success: true,
            gerentes_equipos: [
                {
                    id: 1,
                    nombre: "María García",
                    email: "maria.garcia@empresa.com",
                    foto_perfil: "/static/images/profile-placeholder.png",
                    metricas_consolidadas: {
                        total: 15,
                        verdes: 8,
                        amarillos: 4,
                        rojos: 3,
                        tasa_exito: 53.3
                    },
                    equipo_detalle: [
                        {
                            id: 2,
                            nombre: "Carlos López",
                            email: "carlos.lopez@empresa.com",
                            total: 8,
                            verdes: 5,
                            amarillos: 2,
                            rojos: 1,
                            tasa_exito: 62.5
                        },
                        {
                            id: 3,
                            nombre: "Ana Martínez",
                            email: "ana.martinez@empresa.com",
                            total: 7,
                            verdes: 3,
                            amarillos: 2,
                            rojos: 2,
                            tasa_exito: 42.9
                        }
                    ]
                },
                {
                    id: 4,
                    nombre: "Pedro Rodríguez",
                    email: "pedro.rodriguez@empresa.com",
                    foto_perfil: "/static/images/profile-placeholder.png",
                    metricas_consolidadas: {
                        total: 12,
                        verdes: 9,
                        amarillos: 2,
                        rojos: 1,
                        tasa_exito: 75.0
                    },
                    equipo_detalle: [
                        {
                            id: 5,
                            nombre: "Laura Sánchez",
                            email: "laura.sanchez@empresa.com",
                            total: 6,
                            verdes: 4,
                            amarillos: 1,
                            rojos: 1,
                            tasa_exito: 66.7
                        }
                    ]
                }
            ],
            asesores_independientes: [
                {
                    id: 6,
                    nombre: "Roberto Torres",
                    email: "roberto.torres@empresa.com",
                    total: 10,
                    verdes: 6,
                    amarillos: 3,
                    rojos: 1,
                    tasa_exito: 60.0
                }
            ],
            resumen_global: {
                total_reclutas: 37,
                activos: 23,
                en_proceso: 9,
                rechazados: 5,
                tasa_exito: 62.2
            }
        };

        console.log('📊 Renderizando datos de demostración:', defaultData);
        this.renderMetricas(defaultData);
    },

    // ⚡ Generar datos globales por defecto
    generateDefaultGlobal() {
        return {
            total_reclutas: 0,
            activos: 0,
            en_proceso: 0,
            rechazados: 0,
            tasa_exito: 0,
            distribucion: {
                verdes: 0,
                amarillos: 0,
                rojos: 0
            }
        };
    },

    // ✅ RENDERIZAR MÉTRICAS EN TU ESTRUCTURA EXISTENTE
    renderMetricas(data) {
        console.log('🎨 Renderizando métricas:', data);

        const currentUser = this.getCurrentUserSafe();

        // Renderizar según el formato de datos y rol del usuario
        if (currentUser?.rol === 'admin' && data.global_kpis) {
            // 🚀 RUTA DE RENDERIZADO PARA EL NUEVO ENDPOINT CENTRALIZADO
            this.renderResumenGlobal(data.global_kpis);
            this.renderGerentesConFotos(data.gerentes);
            this.renderAsesoresMetricas(data.metricas_asesores);
            this.renderTablaDetallada(data.metricas_asesores);
            this.renderTopPerformers(data.insights.top_performers);
            this.renderNeedsImprovement(data.insights.needs_improvement);
            this.renderGraficoDistribucion(data.global_kpis.distribucion_global);
            this.renderGraficoTendencia(data.tendencia);
            this.updateKPIs(data.global_kpis);

        } else if (currentUser?.rol === 'admin' && data.gerentes_equipos) {
            // Formato de equipos para admin - LEGACY
            this.renderMetricasEquipos(data);
        } else if (currentUser?.rol === 'gerente' && data.gerentes_ranking) {
            // Formato específico para gerentes
            this.renderMetricasGerentes(data);
        } else if (data.metricas_asesores) {
            // Formato legacy para asesores
            this.renderMetricasAsesores(data);
        }

        // NUEVO: Renderizar también la vista de asesores individuales para admin
        if (currentUser?.rol === 'admin' && data.metricas_asesores) {
            this.renderAsesoresMetricas(data.metricas_asesores);
            this.renderTablaDetallada(data.metricas_asesores);
        }

        this.updateKPIs(data);
        this.loadTendencias(); // Cargar tendencias iniciales
    },

    // ✅ NUEVO: Renderizar métricas de equipos para admin
    renderMetricasEquipos(data) {
        console.log('🏢 Renderizando métricas de equipos jerárquicas');

        // Renderizar insights
        this.renderInsightsEquipos(data);

        // Renderizar gerentes con sus equipos
        if (data.gerentes_equipos) {
            this.renderJerarquiaGerentes(data.gerentes_equipos);
        }

        // Renderizar asesores independientes
        if (data.asesores_independientes) {
            this.renderAsesoresIndependientes(data.asesores_independientes);
        }

        // Crear métricas globales consolidadas
        const globalData = this.consolidateGlobalMetrics(data);
        this.renderResumenGlobal(globalData);
    },

    renderGerentesConFotos(gerentes) {
        const container = document.querySelector('#equipos-jerarquia .gerentes-grid-container');
        if (!container) {
            console.error('Contenedor para gerentes no encontrado.');
            return;
        }

        if (!gerentes || gerentes.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-user-tie"></i>
                    <h3>No hay gerentes registrados</h3>
                    <p>No se encontraron gerentes activos en el sistema.</p>
                </div>
            `;
            return;
        }

        const gerentesHTML = gerentes.map(gerente => {
            const metricas = gerente.metricas || {};
            const tasaExito = metricas.tasa_exito_equipo || 0;
            
            let performanceClass = 'regular';
            if (tasaExito >= 75) {
                performanceClass = 'excelente';
            } else if (tasaExito >= 50) {
                performanceClass = 'bueno';
            }

            const avatarFallback = `<div class="gerente-avatar-fallback">${(gerente.nombre || 'G').charAt(0).toUpperCase()}</div>`;
            const fotoHTML = gerente.foto_url
                ? `<img src="${gerente.foto_url}" alt="Foto de ${gerente.nombre}" class="gerente-foto" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex'/>${avatarFallback}`
                : avatarFallback;

            return `
                <div class="gerente-card-display ${performanceClass}">
                    <div class="gerente-card-header">
                        <div class="gerente-avatar-container">
                            ${fotoHTML}
                        </div>
                        <div class="gerente-info">
                            <h4 class="gerente-nombre">${gerente.nombre}</h4>
                            <p class="gerente-email">${gerente.email}</p>
                        </div>
                    </div>
                    <div class="gerente-card-body">
                        <div class="gerente-kpi">
                            <span class="kpi-value">${tasaExito.toFixed(1)}%</span>
                            <span class="kpi-label">Tasa de Éxito (Equipo)</span>
                        </div>
                        <div class="gerente-kpi">
                            <span class="kpi-value">${metricas.total_reclutas_equipo || 0}</span>
                            <span class="kpi-label">Reclutas (Equipo)</span>
                        </div>
                        <div class="gerente-kpi">
                            <span class="kpi-value">${gerente.total_asesores || 0}</span>
                            <span class="kpi-label">Asesores</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = gerentesHTML;
    },

    // ✅ NUEVO: Renderizar métricas específicas para gerentes
    renderMetricasGerentes(data) {
        console.log('🎨 Renderizando métricas específicas para gerentes');

        if (data.gerentes_ranking) {
            this.renderRankingGerentes(data.gerentes_ranking);
        }

        if (data.insights_gerentes) {
            this.renderInsightsGerentes(data.insights_gerentes);
        }
    },

    // ✅ Renderizar métricas legacy de asesores
    renderMetricasAsesores(data) {
        console.log('🎨 Renderizando métricas legacy de asesores');

        this.asesoresData = data.metricas_asesores || [];

        if (data.metricas_globales) {
            this.renderResumenGlobal(data.metricas_globales);
        }

        if (data.metricas_asesores) {
            this.renderAsesoresMetricas(data.metricas_asesores);
            this.renderTablaDetallada(data.metricas_asesores);
        }

        if (data.insights) {
            if (data.insights.top_performers) {
                this.renderTopPerformers(data.insights.top_performers);
            }
            if (data.insights.needs_improvement) {
                this.renderNeedsImprovement(data.insights.needs_improvement);
            }
        }

        if (data.metricas_globales && data.metricas_globales.distribucion_global) {
            this.renderGraficoDistribucion(data.metricas_globales.distribucion_global);
        }
    },

    // ✅ RESTO DE FUNCIONES (sin cambios - copiar del anterior)
    renderResumenGlobal(globales) {
        const container = document.getElementById('resumen-global');
        if (!container) return;

        const total_gerentes = globales.total_gerentes || 0;
        const total_asesores = globales.total_asesores || 0;
        const total_reclutas = globales.total_reclutas || 0;
        const tasa_exito_global = globales.tasa_exito_global || 0;

        container.innerHTML = `
            <div class="metricas-grid-global">
                <div class="metrica-global-card">
                    <div class="metrica-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${total_gerentes}</div>
                        <div class="metrica-label">Gerentes</div>
                    </div>
                </div>
                <div class="metrica-global-card">
                    <div class="metrica-icon">
                        <i class="fas fa-users-cog"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${total_asesores}</div>
                        <div class="metrica-label">Asesores Activos</div>
                    </div>
                </div>
                <div class="metrica-global-card">
                    <div class="metrica-icon" style="background: linear-gradient(135deg, #22c55e, #15803d);">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${total_reclutas}</div>
                        <div class="metrica-label">Total Reclutas</div>
                    </div>
                </div>
                <div class="metrica-global-card">
                    <div class="metrica-icon" style="background: linear-gradient(135deg, #f97316, #c2410c);">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${tasa_exito_global}%</div>
                        <div class="metrica-label">Tasa de Éxito Global</div>
                    </div>
                </div>
            </div>
        `;
    },

    renderAsesoresMetricas(asesores) {
        const container = document.getElementById('asesores-metricas');
        if (!container) return;

        if (!asesores || asesores.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-users-slash"></i>
                    <h3>No hay asesores registrados</h3>
                    <p>No se encontraron asesores con reclutas asignados</p>
                </div>
            `;
            return;
        }

        const asesoresHTML = asesores.map((asesor, index) => {
            const nombre = asesor.nombre || asesor.email || 'Usuario sin nombre';
            const total_reclutas = asesor.total_reclutas || 0;
            const estados = asesor.estados || { verdes: 0, amarillos: 0, rojos: 0 };
            const performance = asesor.performance || { 
                nivel: 'Sin datos', 
                class: 'neutral', 
                score: 0 
            };
            const tasas = asesor.tasas || { exito: 0, proceso: 0, rechazo: 0 };

            return `
                <div class="asesor-metrica-card ${performance.class}" data-asesor-id="${asesor.id}">
                    <div class="asesor-header">
                        <div class="asesor-info">
                            <div class="asesor-avatar">
                                ${nombre.charAt(0).toUpperCase()}
                                ${index < 3 ? `<div class="ranking-badge">${index + 1}</div>` : ''}
                            </div>
                            <div>
                                <div class="asesor-nombre">${nombre}</div>
                                <div class="asesor-email">${asesor.email || ''}</div>
                            </div>
                        </div>
                        <div class="performance-badge ${performance.class}">
                            ${performance.nivel}
                        </div>
                    </div>
                    
                    <div class="asesor-score">
                        <span class="score-valor">${performance.score}%</span>
                        <span class="score-label">Tasa de Éxito</span>
                    </div>
                    
                    <div class="asesor-stats">
                        <div class="stat-item total">
                            <span class="stat-numero">${total_reclutas}</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item verde">
                            <span class="stat-numero">${estados.verdes}</span>
                            <span class="stat-label">Activos</span>
                            <span class="stat-porcentaje">${tasas.exito}%</span>
                        </div>
                        <div class="stat-item amarillo">
                            <span class="stat-numero">${estados.amarillos}</span>
                            <span class="stat-label">Proceso</span>
                            <span class="stat-porcentaje">${tasas.proceso}%</span>
                        </div>
                        <div class="stat-item rojo">
                            <span class="stat-numero">${estados.rojos}</span>
                            <span class="stat-label">Rechazados</span>
                            <span class="stat-porcentaje">${tasas.rechazo}%</span>
                        </div>
                    </div>
                    
                    <div class="asesor-progress">
                        <div class="progress-bar">
                            <div class="progress-fill verde" style="width: ${tasas.exito}%"></div>
                            <div class="progress-fill amarillo" style="width: ${tasas.proceso}%"></div>
                            <div class="progress-fill rojo" style="width: ${tasas.rechazo}%"></div>
                        </div>
                    </div>
                    
                    <div class="asesor-actions">
                        <button class="btn-detalle" onclick="MetricasAdmin.verDetalleAsesor(${asesor.id})">
                            <i class="fas fa-chart-line"></i> Ver Detalle
                        </button>
                        ${performance.class === 'needs-improvement' ? 
                            `<button class="btn-contactar" onclick="MetricasAdmin.planMejora(${asesor.id})">
                                <i class="fas fa-clipboard-list"></i> Plan Mejora
                            </button>` : ''
                        }
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="asesores-grid">${asesoresHTML}</div>`;
    },

    renderTopPerformers(topPerformers) {
        const container = document.getElementById('top-performers');
        if (!container) return;

        if (!topPerformers || topPerformers.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-trophy"></i>
                    <p>No hay datos suficientes para mostrar top performers</p>
                </div>
            `;
            return;
        }

        const performersHTML = topPerformers.map((asesor, index) => {
            const medalIcon = index === 0 ? 'fa-trophy' : index === 1 ? 'fa-medal' : 'fa-award';
            const medalClass = index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze';
            
            return `
                <div class="performer-item ${medalClass}">
                    <div class="performer-medal">
                        <i class="fas ${medalIcon}"></i>
                        <span class="performer-rank">#${index + 1}</span>
                    </div>
                    <div class="performer-info">
                        <h5>${asesor.nombre || asesor.email}</h5>
                        <p>${asesor.performance.score}% de éxito</p>
                        <small>${asesor.total_reclutas} reclutas</small>
                    </div>
                    <div class="performance-badge ${asesor.performance.class}">
                        ${asesor.performance.nivel}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = performersHTML;
    },

    renderNeedsImprovement(needsImprovement) {
        const container = document.getElementById('needs-improvement');
        if (!container) return;

        if (!needsImprovement || needsImprovement.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-check-circle"></i>
                    <p>Todos los asesores están dentro del rango esperado</p>
                </div>
            `;
            return;
        }

        const improvementHTML = needsImprovement.map(asesor => `
            <div class="improvement-item">
                <div class="improvement-alert">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="improvement-info">
                    <h5>${asesor.nombre || asesor.email}</h5>
                    <p>${asesor.performance.score}% de éxito</p>
                    <small>${asesor.total_reclutas} reclutas gestionados</small>
                </div>
                <div class="improvement-actions">
                    <button class="btn-contactar" onclick="MetricasAdmin.planMejora(${asesor.id})">
                        <i class="fas fa-clipboard-list"></i> Plan Mejora
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = improvementHTML;
    },

    renderTablaDetallada(asesores) {
        const tbody = document.querySelector('#tabla-asesores-detalle tbody');
        if (!tbody) return;

        if (!asesores || asesores.length === 0) {
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="9">
                        <div class="loading-placeholder">
                            <i class="fas fa-table"></i>
                            <p>No hay datos de asesores para mostrar</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const filas = asesores.map((asesor, index) => {
            const nombre = asesor.nombre || asesor.email || 'Usuario sin nombre';
            const estados = asesor.estados || { verdes: 0, amarillos: 0, rojos: 0 };
            const performance = asesor.performance || { nivel: 'N/A', class: 'neutral', score: 0 };

            return `
                <tr class="asesor-row" data-asesor-id="${asesor.id}">
                    <td class="ranking-cell">#${index + 1}</td>
                    <td class="asesor-cell">
                        <div class="asesor-info-mini">
                            <div class="asesor-avatar-mini">${nombre.charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="nombre">${nombre}</div>
                                <div class="email">${asesor.email || ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="total-cell">${asesor.total_reclutas || 0}</td>
                    <td class="verde-cell">${estados.verdes}</td>
                    <td class="amarillo-cell">${estados.amarillos}</td>
                    <td class="rojo-cell">${estados.rojos}</td>
                    <td class="tasa-cell">${performance.score}%</td>
                    <td class="performance-cell">
                        <span class="performance-badge ${performance.class}">
                            ${performance.nivel}
                        </span>
                    </td>
                    <td class="acciones-cell">
                        <button class="btn-mini" onclick="MetricasAdmin.verDetalleAsesor(${asesor.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-mini" onclick="MetricasAdmin.contactarAsesor(${asesor.id})">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = filas;
    },

    renderGraficoDistribucion(distribucion) {
        const canvas = document.getElementById('grafico-distribucion');
        if (!canvas) return;

        const total = distribucion.verdes + distribucion.amarillos + distribucion.rojos;
        
        if (total === 0) {
            canvas.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-chart-pie"></i>
                    <p>Sin datos para mostrar</p>
                </div>
            `;
            return;
        }

        const porcentajes = {
            verdes: ((distribucion.verdes / total) * 100).toFixed(1),
            amarillos: ((distribucion.amarillos / total) * 100).toFixed(1),
            rojos: ((distribucion.rojos / total) * 100).toFixed(1)
        };

        canvas.innerHTML = `
            <div class="chart-visual">
                <div class="chart-segment verde" style="flex: ${porcentajes.verdes}">
                    <span class="segment-value">${porcentajes.verdes}%</span>
                    <span class="segment-label">Activos</span>
                </div>
                <div class="chart-segment amarillo" style="flex: ${porcentajes.amarillos}">
                    <span class="segment-value">${porcentajes.amarillos}%</span>
                    <span class="segment-label">Proceso</span>
                </div>
                <div class="chart-segment rojo" style="flex: ${porcentajes.rojos}">
                    <span class="segment-value">${porcentajes.rojos}%</span>
                    <span class="segment-label">Rechazados</span>
                </div>
            </div>
        `;
    },

    updateKPIs(data) {
        let globales = null;

        // Extraer métricas globales según la estructura de datos recibida
        if (data.metricas_globales) {
            // Formato legacy de asesores
            globales = data.metricas_globales;
        } else if (data.gerentes_equipos) {
            // Formato de equipos - calcular globales agregando todos los datos
            globales = this.calculateGlobalMetricsFromEquipos(data.gerentes_equipos, data.asesores_independientes);
        } else if (data.gerentes_ranking) {
            // Formato de gerentes - calcular globales del ranking
            globales = this.calculateGlobalMetricsFromGerentes(data.gerentes_ranking);
        }

        if (globales) {
            const kpiConversion = document.getElementById('kpi-conversion');
            if (kpiConversion) {
                const conversion = globales.promedio_sistema?.exito || globales.conversion_rate || 0;
                kpiConversion.textContent = `${Math.round(conversion)}%`;
            }

            const kpiTiempo = document.getElementById('kpi-tiempo-promedio');
            if (kpiTiempo) {
                const promedio = Math.round(globales.total_reclutas / Math.max(globales.total_asesores, 1)) || 0;
                kpiTiempo.textContent = `${promedio} avg`;
            }

            const kpiSatisfaccion = document.getElementById('kpi-satisfaccion');
            if (kpiSatisfaccion) {
                let satisfaccion = 0;
                if (globales.promedio_sistema) {
                    satisfaccion = Math.round((globales.promedio_sistema.exito + globales.promedio_sistema.proceso) / 2);
                } else {
                    satisfaccion = Math.round((globales.conversion_rate || 0 + globales.proceso_rate || 0) / 2);
                }
                kpiSatisfaccion.textContent = `${satisfaccion}%`;
            }

            const kpiProductividad = document.getElementById('kpi-productividad');
            if (kpiProductividad) {
                const productividad = Math.round(globales.total_reclutas / Math.max(globales.total_asesores, 1)) || 0;
                kpiProductividad.textContent = `${productividad}`;
            }
        }
    },

    // ✅ NUEVO: Calcular métricas globales desde datos de equipos
    calculateGlobalMetricsFromEquipos(gerentes_equipos, asesores_independientes) {
        let totalReclutas = 0;
        let totalVerdes = 0;
        let totalAmarillos = 0;
        let totalRojos = 0;
        let totalAsesores = 0;

        // Procesar gerentes y sus equipos
        if (gerentes_equipos) {
            gerentes_equipos.forEach(gerente => {
                // Métricas propias del gerente
                totalReclutas += gerente.metricas_propias?.total || 0;
                totalVerdes += gerente.metricas_propias?.verdes || 0;
                totalAmarillos += gerente.metricas_propias?.amarillos || 0;
                totalRojos += gerente.metricas_propias?.rojos || 0;
                totalAsesores += 1; // El gerente cuenta como asesor

                // Métricas del equipo
                if (gerente.equipo_metricas) {
                    gerente.equipo_metricas.forEach(asesor => {
                        totalReclutas += asesor.total || 0;
                        totalVerdes += asesor.verdes || 0;
                        totalAmarillos += asesor.amarillos || 0;
                        totalRojos += asesor.rojos || 0;
                        totalAsesores += 1;
                    });
                }
            });
        }

        // Procesar asesores independientes
        if (asesores_independientes) {
            asesores_independientes.forEach(asesor => {
                totalReclutas += asesor.total || 0;
                totalVerdes += asesor.verdes || 0;
                totalAmarillos += asesor.amarillos || 0;
                totalRojos += asesor.rojos || 0;
                totalAsesores += 1;
            });
        }

        const conversion_rate = totalReclutas > 0 ? (totalVerdes / totalReclutas) * 100 : 0;
        const proceso_rate = totalReclutas > 0 ? (totalAmarillos / totalReclutas) * 100 : 0;
        const rechazo_rate = totalReclutas > 0 ? (totalRojos / totalReclutas) * 100 : 0;

        return {
            total_reclutas: totalReclutas,
            total_asesores: totalAsesores,
            conversion_rate: conversion_rate,
            proceso_rate: proceso_rate,
            rechazo_rate: rechazo_rate,
            distribucion_global: { verdes: totalVerdes, amarillos: totalAmarillos, rojos: totalRojos },
            promedio_sistema: { exito: conversion_rate, proceso: proceso_rate, rechazo: rechazo_rate }
        };
    },

    // ✅ NUEVO: Calcular métricas globales desde ranking de gerentes
    calculateGlobalMetricsFromGerentes(gerentes_ranking) {
        let totalReclutas = 0;
        let totalVerdes = 0;
        let totalAmarillos = 0;
        let totalRojos = 0;
        let totalAsesores = gerentes_ranking.length;

        gerentes_ranking.forEach(gerente => {
            const metricas = gerente.metricas_consolidadas || {};
            totalReclutas += metricas.total || 0;
            totalVerdes += metricas.verdes || 0;
            totalAmarillos += metricas.amarillos || 0;
            totalRojos += metricas.rojos || 0;
        });

        const conversion_rate = totalReclutas > 0 ? (totalVerdes / totalReclutas) * 100 : 0;
        const proceso_rate = totalReclutas > 0 ? (totalAmarillos / totalReclutas) * 100 : 0;
        const rechazo_rate = totalReclutas > 0 ? (totalRojos / totalReclutas) * 100 : 0;

        return {
            total_reclutas: totalReclutas,
            total_asesores: totalAsesores,
            conversion_rate: conversion_rate,
            proceso_rate: proceso_rate,
            rechazo_rate: rechazo_rate,
            distribucion_global: { verdes: totalVerdes, amarillos: totalAmarillos, rojos: totalRojos },
            promedio_sistema: { exito: conversion_rate, proceso: proceso_rate, rechazo: rechazo_rate }
        };
    },

    // 🎛️ FUNCIONES DE INTERFAZ
    async verDetalleAsesor(asesorId) {
        console.log('📋 Ver detalle del asesor:', asesorId);

        try {
            // Mostrar modal
            const modal = document.getElementById('modal-detalle-asesor');
            if (!modal) {
                console.error('❌ Modal no encontrado');
                return;
            }

            modal.style.display = 'flex';

            // Cargar datos del asesor
            const response = await fetch(`/api/admin/asesor-detalle/${asesorId}`);
            const data = await response.json();

            if (data.success) {
                this.renderAsesorDetalle(data, modal);
                if (typeof showNotification !== 'undefined') {
                    showNotification('Detalle del asesor cargado', 'success');
                }
            } else {
                throw new Error(data.message || 'Error al cargar detalle');
            }

        } catch (error) {
            console.error('❌ Error al cargar detalle del asesor:', error);
            if (typeof showNotification !== 'undefined') {
                showNotification('Error al cargar detalle: ' + error.message, 'error');
            }
        }
    },

    renderAsesorDetalle(data, modal) {
        const content = modal.querySelector('#detalle-asesor-content');
        const asesor = data.asesor;
        const stats = data.estadisticas;

        content.innerHTML = `
            <div class="asesor-detalle-header">
                <div class="asesor-avatar-large">
                    ${asesor.foto_url ?
                        `<img src="${asesor.foto_url}" alt="${asesor.nombre}">` :
                        `<span>${asesor.nombre.charAt(0).toUpperCase()}</span>`
                    }
                </div>
                <div class="asesor-info-large">
                    <h3>${asesor.nombre}</h3>
                    <p>${asesor.email}</p>
                    <span class="badge ${stats.performance_class}">${stats.performance_class}</span>
                </div>
            </div>

            <div class="metricas-detalle-grid">
                <div class="metrica-card">
                    <h4>Total Reclutas</h4>
                    <div class="metrica-valor">${stats.total_reclutas}</div>
                </div>
                <div class="metrica-card verde">
                    <h4>Activos</h4>
                    <div class="metrica-valor">${stats.estados.verdes}</div>
                </div>
                <div class="metrica-card amarillo">
                    <h4>En Proceso</h4>
                    <div class="metrica-valor">${stats.estados.amarillos}</div>
                </div>
                <div class="metrica-card rojo">
                    <h4>Rechazados</h4>
                    <div class="metrica-valor">${stats.estados.rojos}</div>
                </div>
            </div>

            <div class="tasa-exito-section">
                <h4>Tasa de Éxito: ${stats.tasa_exito}%</h4>
                <div class="progress-bar-large">
                    <div class="progress-fill-large" style="width: ${stats.tasa_exito}%"></div>
                </div>
            </div>

            ${data.tendencia_mensual ? `
                <div class="tendencia-section">
                    <h4>Tendencia Últimos 6 Meses</h4>
                    <div class="mini-chart">
                        ${data.tendencia_mensual.map(mes => `
                            <div class="mini-bar" style="height: ${(mes.total / Math.max(...data.tendencia_mensual.map(m => m.total)) * 100)}%">
                                <span class="bar-label">${mes.mes}</span>
                                <span class="bar-value">${mes.total}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${data.reclutas_recientes ? `
                <div class="reclutas-recientes">
                    <h4>Reclutas Recientes</h4>
                    <div class="reclutas-list">
                        ${data.reclutas_recientes.slice(0, 5).map(recluta => `
                            <div class="recluta-item">
                                <span class="recluta-nombre">${recluta.nombre}</span>
                                <span class="badge ${recluta.estado.toLowerCase().replace(' ', '-')}">${recluta.estado}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        // Actualizar título del modal
        modal.querySelector('#modal-asesor-nombre').textContent = `Detalle de ${asesor.nombre}`;
    },

    planMejora(asesorId) {
        console.log('Plan de mejora para asesor:', asesorId);
        if (typeof showNotification !== 'undefined') {
            showNotification('Funcionalidad de plan de mejora en desarrollo', 'info');
        }
    },

    contactarAsesor(asesorId) {
        console.log('Contactar asesor:', asesorId);
        if (typeof showNotification !== 'undefined') {
            showNotification('Abriendo herramienta de contacto...', 'info');
        }
    },

    filtrarAsesores(filtro) {
        const asesores = document.querySelectorAll('.asesor-metrica-card');
        asesores.forEach(asesor => {
            if (filtro === 'todos' || asesor.classList.contains(filtro)) {
                asesor.style.display = 'block';
            } else {
                asesor.style.display = 'none';
            }
        });
    },

    ordenarAsesores(criterio) {
        console.log('Ordenando asesores por:', criterio);
        if (!this.asesoresData || this.asesoresData.length === 0) {
            return;
        }

        let asesoresOrdenados = [...this.asesoresData]; // Create a copy to sort

        switch (criterio) {
            case 'performance':
                asesoresOrdenados.sort((a, b) => (b.performance?.score || 0) - (a.performance?.score || 0));
                break;
            case 'total':
                asesoresOrdenados.sort((a, b) => (b.total_reclutas || 0) - (a.total_reclutas || 0));
                break;
            case 'nombre':
                asesoresOrdenados.sort((a, b) => {
                    const nombreA = a.nombre || a.email || '';
                    const nombreB = b.nombre || b.email || '';
                    return nombreA.localeCompare(nombreB);
                });
                break;
        }

        // Re-render the views with the sorted data
        this.renderAsesoresMetricas(asesoresOrdenados);
        this.renderTablaDetallada(asesoresOrdenados);
    },

    async loadTendencias(periodo = 'mensual') {
        try {
            const response = await fetch(`/admin/metricas/tendencias?periodo=${periodo}`);
            const data = await response.json();

            if (data.success) {
                this.renderGraficoTendencia(data.tendencia);
            } else {
                console.error('Error al cargar tendencias:', data.message);
            }
        } catch (error) {
            console.error('Error en fetch de tendencias:', error);
        }
    },

    renderGraficoTendencia(tendencia) {
        const container = document.getElementById('grafico-tendencia');
        if (!container) return;

        if (!tendencia || tendencia.length === 0) {
            container.innerHTML = `<div class="loading-placeholder"><p>No hay datos de tendencia.</p></div>`;
            return;
        }

        const maxTotal = Math.max(...tendencia.map(t => t.total), 1);

        const barsHTML = tendencia.map(t => {
            const total = t.total || 0;
            const verdes = (t.verdes || 0) / total * 100;
            const amarillos = (t.amarillos || 0) / total * 100;
            const rojos = (t.rojos || 0) / total * 100;
            const height = (total / maxTotal) * 100;

            return `
                <div class="bar-chart-bar-container">
                    <div class="bar-chart-bar" style="height: ${height}%;">
                        <div class="bar-segment verde" style="height: ${verdes}%;"></div>
                        <div class="bar-segment amarillo" style="height: ${amarillos}%;"></div>
                        <div class="bar-segment rojo" style="height: ${rojos}%;"></div>
                    </div>
                    <div class="bar-chart-label">${t.periodo_nombre}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `<div class="bar-chart-container">${barsHTML}</div>`;
    },

    toggleView(detallada) {
        const container = document.getElementById('estadisticas-section');
        if (container) {
            if (detallada) {
                container.classList.add('vista-detallada');
            } else {
                container.classList.remove('vista-detallada');
            }
        }
    },

    async exportarMetricas() {
        try {
            if (typeof showNotification !== 'undefined') {
                showNotification('Iniciando exportación...', 'info');
            }
            
            setTimeout(() => {
                if (typeof showNotification !== 'undefined') {
                    showNotification('Exportación completada', 'success');
                }
            }, 2000);
        } catch (error) {
            console.error('Error en exportación:', error);
            Notifications.error('Error en exportación: ' + error.message);
        }
    },

    setupAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        this.autoRefreshInterval = setInterval(() => {
            const currentUser = this.getCurrentUserSafe();
            if (currentUser && ['admin', 'gerente'].includes(currentUser.rol)) {
                this.loadMetricas(false);
            }
        }, this.config.refreshInterval);
    },

    updateLastRefresh() {
        const timestamp = document.getElementById('last-refresh');
        if (timestamp) {
            timestamp.textContent = `Actualizado: ${new Date().toLocaleTimeString()}`;
        }
    },

    showLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'flex';
    },

    hideLoader() {
        const loader = document.getElementById('metricas-loader');
        if (loader) loader.style.display = 'none';
    },

    // ✅ NUEVO: Limpiar configuración al hacer logout
    cleanup() {
        console.log('🧹 Limpiando MetricasAdmin...');
        
        this.config.initialized = false;
        
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        // Remover event listeners
        if (this.refreshHandler) {
            const refreshBtn = document.getElementById('refresh-metricas-btn');
            if (refreshBtn) refreshBtn.removeEventListener('click', this.refreshHandler);
        }
        
        if (this.exportHandler) {
            const exportBtn = document.getElementById('export-metricas-btn');
            if (exportBtn) exportBtn.removeEventListener('click', this.exportHandler);
        }
        
        // Limpiar contenedores
        const containers = [
            'resumen-global',
            'asesores-metricas', 
            'top-performers',
            'needs-improvement',
            'grafico-distribucion'
        ];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '';
            }
        });
        
        console.log('✅ MetricasAdmin limpiado');
    }
};

// ✅ FUNCIONES GLOBALES PARA INICIALIZACIÓN CONTROLADA
window.MetricasAdmin = MetricasAdmin;

// ✅ NUEVA FUNCIÓN: Inicializar métricas solo después del login
window.initializeMetricasAdmin = function() {
    console.log('🎯 Función de inicialización de métricas llamada');
    
    const currentUser = MetricasAdmin.getCurrentUserSafe();
    
    if (!currentUser) {
        console.log('⚠️ No se puede inicializar métricas: no hay usuario');
        return false;
    }
    
    if (!['admin', 'gerente'].includes(currentUser.rol)) {
        console.log('⚠️ Usuario no es admin ni gerente, no inicializando métricas avanzadas');
        MetricasAdmin.setupContainer(); // Solo configurar visibilidad
        return false;
    }
    
    // Verificar que estamos en la sección correcta
    const estadisticasSection = document.getElementById('estadisticas-section');
    if (!estadisticasSection) {
        console.log('⚠️ Sección de estadísticas no encontrada');
        return false;
    }
    
    console.log('✅ Inicializando métricas admin...');
    MetricasAdmin.init();
    return true;
};

// ✅ NUEVA FUNCIÓN: Limpiar métricas al hacer logout
window.cleanupMetricasAdmin = function() {
    console.log('🧹 Función de limpieza de métricas llamada');
    MetricasAdmin.cleanup();
};

// ✅ INICIALIZACIÓN SEGURA - Solo si hay elementos DOM
// Eliminado: document.addEventListener('DOMContentLoaded', ...)
// La inicialización ahora es orquestada por main.js

// ✅ FUNCIÓN DE DEBUG MEJORADA
window.debugMetricas = function() {
    console.log('🔍 === DEBUG MÉTRICAS (Inicialización Corregida) ===');
    
    const currentUser = MetricasAdmin.getCurrentUserSafe();
    console.log('👤 Usuario actual:', currentUser);
    console.log('🎯 MetricasAdmin inicializado:', MetricasAdmin.config.initialized);
    console.log('📍 Sección estadísticas existe:', !!document.getElementById('estadisticas-section'));
    console.log('📦 Contenedores encontrados:', {
        'resumen-global': !!document.getElementById('resumen-global'),
        'asesores-metricas': !!document.getElementById('asesores-metricas'),
        'top-performers': !!document.getElementById('top-performers'),
        'needs-improvement': !!document.getElementById('needs-improvement'),
        'grafico-distribucion': !!document.getElementById('grafico-distribucion'),
        'tabla-asesores-detalle': !!document.getElementById('tabla-asesores-detalle'),
        'refresh-btn': !!document.getElementById('refresh-metricas-btn'),
        'export-btn': !!document.getElementById('export-metricas-btn')
    });
    
    console.log('🎨 Clases del body:', document.body.className);
    console.log('👁️ Elementos admin-only visibles:', document.querySelectorAll('.admin-only[style*="block"]').length);
    console.log('👁️ Elementos admin-only totales:', document.querySelectorAll('.admin-only').length);
    
    // Test manual de inicialización
    console.log('🧪 Probando inicialización manual...');
    if (currentUser && ['admin', 'gerente'].includes(currentUser.rol)) {
        const resultado = window.initializeMetricasAdmin();
        console.log('✅ Resultado de inicialización manual:', resultado);
    } else {
        console.log('⚠️ No se puede probar: usuario no es admin o no existe');
    }
    
    // Test de endpoint
    console.log('🌐 Probando endpoint...');
    fetch('/admin/metricas/asesores')
        .then(response => {
            console.log('📡 Status:', response.status);
            console.log('📡 Content-Type:', response.headers.get('content-type'));
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        })
        .then(data => {
            console.log('📊 Data recibida:', data);
            if (data.success) {
                console.log('✅ Endpoint funciona correctamente');
                console.log('📈 Métricas disponibles:', {
                    asesores: data.metricas_asesores?.length || 0,
                    total_reclutas: data.metricas_globales?.total_reclutas || 0,
                    top_performers: data.insights?.top_performers?.length || 0
                });
            } else {
                console.log('⚠️ Endpoint responde pero con error:', data.message);
            }
        })
        .catch(error => {
            console.error('❌ Error en endpoint:', error);
        });
};

// ✅ NUEVAS FUNCIONES PARA GERENTES
MetricasAdmin.renderGerentesSection = function(gerentes) {
    console.log('🎨 Renderizando sección de gerentes:', gerentes.length);

    const container = document.getElementById('asesores-metricas') || this.createGerentesContainer();
    if (!container) return;

    container.innerHTML = '<h3>📊 Métricas por Equipos de Gerentes</h3>';

    gerentes.forEach(gerente => {
        const gerenteCard = document.createElement('div');
        gerenteCard.className = 'gerente-card metrics-card';
        gerenteCard.innerHTML = `
            <div class="gerente-header">
                <h4>👑 ${gerente.nombre}</h4>
                <span class="rol-badge gerente">Gerente</span>
            </div>
            <div class="metricas-split">
                <div class="metricas-propias">
                    <h5>📈 Métricas Propias</h5>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-number">${gerente.metricas_propias.total}</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item verde">
                            <span class="stat-number">${gerente.metricas_propias.verdes}</span>
                            <span class="stat-label">Activos</span>
                        </div>
                        <div class="stat-item amarillo">
                            <span class="stat-number">${gerente.metricas_propias.amarillos}</span>
                            <span class="stat-label">En Proceso</span>
                        </div>
                        <div class="stat-item rojo">
                            <span class="stat-number">${gerente.metricas_propias.rojos}</span>
                            <span class="stat-label">Rechazados</span>
                        </div>
                    </div>
                </div>
                <div class="metricas-equipo">
                    <h5>👥 Métricas de Equipo (${gerente.metricas_equipo.total_asesores} asesores)</h5>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-number">${gerente.metricas_equipo.total}</span>
                            <span class="stat-label">Total Equipo</span>
                        </div>
                        <div class="stat-item verde">
                            <span class="stat-number">${gerente.metricas_equipo.verdes}</span>
                            <span class="stat-label">Activos</span>
                        </div>
                        <div class="stat-item amarillo">
                            <span class="stat-number">${gerente.metricas_equipo.amarillos}</span>
                            <span class="stat-label">En Proceso</span>
                        </div>
                        <div class="stat-item rojo">
                            <span class="stat-number">${gerente.metricas_equipo.rojos}</span>
                            <span class="stat-label">Rechazados</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="metricas-consolidadas">
                <h5>🎯 Resultado Consolidado</h5>
                <div class="kpi-consolidado">
                    <div class="kpi-main">
                        <span class="kpi-number">${gerente.metricas_consolidadas.total}</span>
                        <span class="kpi-label">Total Consolidado</span>
                    </div>
                    <div class="kpi-tasa">
                        <span class="kpi-number">${gerente.metricas_consolidadas.tasa_exito.toFixed(1)}%</span>
                        <span class="kpi-label">Tasa de Éxito</span>
                    </div>
                </div>
            </div>
            ${gerente.equipo_detalle.length > 0 ? `
                <div class="equipo-detalle">
                    <h5>👥 Detalle del Equipo</h5>
                    <div class="asesores-list">
                        ${gerente.equipo_detalle.map(asesor => `
                            <div class="asesor-mini">
                                <span class="asesor-nombre">${asesor.nombre}</span>
                                <span class="asesor-stats">${asesor.total} reclutas | ${asesor.tasa_exito.toFixed(1)}% éxito</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        container.appendChild(gerenteCard);
    });
};

// ✅ NUEVO: Renderizar asesores independientes (sin gerente)
MetricasAdmin.renderAsesoresIndependientes = function(asesores) {
    console.log('🎨 Renderizando asesores independientes:', asesores.length);

    if (!asesores || asesores.length === 0) {
        console.log('ℹ️ No hay asesores independientes para mostrar');
        return;
    }

    const container = document.getElementById('asesores-metricas') || this.createGerentesContainer();
    if (!container) return;

    // Agregar sección de asesores independientes
    const independientesSection = document.createElement('div');
    independientesSection.className = 'asesores-independientes-section';
    independientesSection.innerHTML = '<h3>🏴 Asesores Independientes</h3>';

    asesores.forEach(asesor => {
        const asesorCard = document.createElement('div');
        asesorCard.className = 'asesor-card metrics-card';
        asesorCard.innerHTML = `
            <div class="asesor-header">
                <h4>👤 ${asesor.nombre || asesor.email}</h4>
                <span class="rol-badge asesor">Asesor</span>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-number">${asesor.total || 0}</span>
                    <span class="stat-label">Total Reclutas</span>
                </div>
                <div class="stat-item verde">
                    <span class="stat-number">${asesor.verdes || 0}</span>
                    <span class="stat-label">Activos</span>
                </div>
                <div class="stat-item amarillo">
                    <span class="stat-number">${asesor.amarillos || 0}</span>
                    <span class="stat-label">En Proceso</span>
                </div>
                <div class="stat-item rojo">
                    <span class="stat-number">${asesor.rojos || 0}</span>
                    <span class="stat-label">Rechazados</span>
                </div>
            </div>
            <div class="performance-indicator">
                <div class="performance-level ${asesor.performance?.class || 'neutral'}">
                    <span class="nivel-text">${asesor.performance?.nivel || 'Evaluando'}</span>
                    <span class="score-text">Score: ${asesor.performance?.score || 0}%</span>
                </div>
            </div>
        `;

        independientesSection.appendChild(asesorCard);
    });

    container.appendChild(independientesSection);
};

MetricasAdmin.renderRankingGerentes = function(gerentes) {
    console.log('🏆 Renderizando ranking de gerentes:', gerentes.length);

    const container = document.getElementById('top-performers') || this.createRankingContainer();
    if (!container) return;

    container.innerHTML = '<h3>🏆 Ranking de Gerentes por Performance</h3>';

    gerentes.forEach((gerente, index) => {
        const rankingCard = document.createElement('div');
        rankingCard.className = `ranking-card gerente-ranking position-${index + 1}`;
        rankingCard.innerHTML = `
            <div class="ranking-position">
                <span class="position-number">#${index + 1}</span>
                ${index === 0 ? '<span class="crown">👑</span>' : ''}
            </div>
            <div class="gerente-info">
                <h4>${gerente.nombre}</h4>
                <span class="gerente-email">${gerente.email}</span>
                <span class="team-size">👥 ${gerente.total_asesores} asesores</span>
            </div>
            <div class="performance-metrics">
                <div class="metric-consolidado">
                    <span class="metric-value">${gerente.consolidado.total}</span>
                    <span class="metric-label">Total Reclutas</span>
                </div>
                <div class="metric-consolidado">
                    <span class="metric-value">${gerente.consolidado.tasa_exito}%</span>
                    <span class="metric-label">Tasa Éxito</span>
                </div>
                <div class="metric-liderazgo">
                    <span class="metric-value">${gerente.kpis_liderazgo.eficiencia_equipo}%</span>
                    <span class="metric-label">Eficiencia Equipo</span>
                </div>
            </div>
            <div class="liderazgo-badge" style="background-color: ${gerente.kpis_liderazgo.color}">
                <span class="nivel-text">${gerente.kpis_liderazgo.nivel}</span>
                <span class="score-text">Score: ${gerente.kpis_liderazgo.score_liderazgo}%</span>
            </div>
        `;

        container.appendChild(rankingCard);
    });
};

MetricasAdmin.renderInsightsGerentes = function(insights) {
    console.log('💡 Renderizando insights de gerentes:', insights);

    const container = document.getElementById('insights-container') || this.createInsightsContainer();
    if (!container) return;

    container.innerHTML = `
        <h3>💡 Insights de Gestión</h3>
        <div class="insights-grid">
            <div class="insight-card highlight">
                <h4>🌟 Top Gerente</h4>
                <p>${insights.top_gerente ? insights.top_gerente.nombre : 'Sin datos'}</p>
                ${insights.top_gerente ? `<span class="insight-detail">Score: ${insights.top_gerente.kpis_liderazgo.score_liderazgo}%</span>` : ''}
            </div>
            <div class="insight-card success">
                <h4>✅ Gerentes Excepcionales</h4>
                <p>${insights.gerentes_excelentes} de ${insights.total_gerentes}</p>
                <span class="insight-detail">${((insights.gerentes_excelentes / insights.total_gerentes) * 100).toFixed(1)}% del equipo</span>
            </div>
            <div class="insight-card warning">
                <h4>⚠️ Necesitan Apoyo</h4>
                <p>${insights.gerentes_necesitan_apoyo} gerentes</p>
                <span class="insight-detail">Requieren atención especial</span>
            </div>
            <div class="insight-card info">
                <h4>📊 Eficiencia Promedio</h4>
                <p>${insights.promedio_eficiencia.toFixed(1)}%</p>
                <span class="insight-detail">Promedio del sistema</span>
            </div>
        </div>
    `;
};

MetricasAdmin.consolidateGlobalMetrics = function(data) {
    console.log('🔄 Consolidando métricas globales desde equipos');

    let totalReclutas = 0;
    let totalVerdes = 0;
    let totalAmarillos = 0;
    let totalRojos = 0;
    let totalAsesores = 0;

    // Contar desde gerentes
    if (data.gerentes_equipos) {
        data.gerentes_equipos.forEach(gerente => {
            totalReclutas += gerente.metricas_consolidadas.total;
            totalVerdes += gerente.metricas_consolidadas.verdes;
            totalAmarillos += gerente.metricas_consolidadas.amarillos || 0;
            totalRojos += gerente.metricas_consolidadas.rojos || 0;
            totalAsesores += gerente.metricas_equipo.total_asesores;
        });
    }

    // Contar asesores independientes
    if (data.asesores_independientes) {
        data.asesores_independientes.forEach(asesor => {
            totalReclutas += asesor.total;
            totalVerdes += asesor.verdes;
            totalAmarillos += asesor.amarillos;
            totalRojos += asesor.rojos;
            totalAsesores += 1;
        });
    }

    return {
        total_asesores: totalAsesores,
        total_reclutas: totalReclutas,
        distribucion_global: {
            verdes: totalVerdes,
            amarillos: totalAmarillos,
            rojos: totalRojos
        },
        promedio_sistema: {
            exito: totalReclutas > 0 ? (totalVerdes / totalReclutas * 100) : 0,
            proceso: totalReclutas > 0 ? (totalAmarillos / totalReclutas * 100) : 0,
            rechazo: totalReclutas > 0 ? (totalRojos / totalReclutas * 100) : 0
        }
    };
};

// Funciones auxiliares para crear contenedores
MetricasAdmin.createGerentesContainer = function() {
    const container = document.createElement('div');
    container.id = 'gerentes-metricas';
    container.className = 'metricas-section';

    const parentContainer = document.getElementById('metricas-admin-container') || document.body;
    parentContainer.appendChild(container);
    return container;
};

MetricasAdmin.createRankingContainer = function() {
    const container = document.createElement('div');
    container.id = 'ranking-gerentes';
    container.className = 'metricas-section';

    const parentContainer = document.getElementById('metricas-admin-container') || document.body;
    parentContainer.appendChild(container);
    return container;
};

MetricasAdmin.createInsightsContainer = function() {
    const container = document.createElement('div');
    container.id = 'insights-gerentes';
    container.className = 'metricas-section';

    const parentContainer = document.getElementById('metricas-admin-container') || document.body;
    parentContainer.appendChild(container);
    return container;
};

// ===== NUEVAS FUNCIONES PARA GESTIÓN DE EQUIPOS =====

// 🔄 Cambiar entre vista jerárquica y comparativa
MetricasAdmin.switchView = function(vista) {
    console.log(`🔄 Cambiando a vista: ${vista}`);

    // Actualizar botones
    const botones = document.querySelectorAll('.btn-toggle');
    botones.forEach(btn => btn.classList.remove('active'));

    const botonActivo = document.getElementById(`vista-${vista}`);
    if (botonActivo) {
        botonActivo.classList.add('active');
    }

    // Actualizar contenido
    const contenidos = document.querySelectorAll('.vista-content');
    contenidos.forEach(content => content.classList.remove('active'));

    const contenidoActivo = document.getElementById(`vista-${vista}-content`);
    if (contenidoActivo) {
        contenidoActivo.classList.add('active');
    }

    // Recargar datos si es necesario
    if (vista === 'comparativa') {
        this.loadComparativaEquipos();
    } else {
        this.loadJerarquiaEquipos();
    }
};

// 📊 Cargar datos para vista jerárquica
MetricasAdmin.loadJerarquiaEquipos = async function() {
    console.log('🏢 Cargando datos jerárquicos de equipos...');

    try {
        const container = document.getElementById('equipos-jerarquia');
        if (!container) return;

        // Mostrar loader
        container.innerHTML = '<div class="loading-placeholder"><i class="fas fa-sitemap fa-spin"></i><p>Cargando estructura jerárquica...</p></div>';

        // Obtener datos del endpoint
        const response = await fetch('/api/admin/metricas/equipos?vista=jerarquica');
        const data = await response.json();

        if (data.success) {
            this.renderJerarquiaCompleta(data, container);
        } else {
            throw new Error(data.message || 'Error al cargar datos jerárquicos');
        }

    } catch (error) {
        console.error('❌ Error al cargar vista jerárquica:', error);
        const container = document.getElementById('equipos-jerarquia');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar estructura jerárquica</p>
                    <button onclick="MetricasAdmin.loadJerarquiaEquipos()" class="btn-retry">Reintentar</button>
                </div>
            `;
        }
    }
};

// 📈 Cargar datos para vista comparativa
MetricasAdmin.loadComparativaEquipos = async function() {
    console.log('📊 Cargando datos comparativos de equipos...');

    try {
        const container = document.getElementById('equipos-comparativa');
        if (!container) return;

        // Mostrar loader
        container.innerHTML = '<div class="loading-placeholder"><i class="fas fa-chart-bar fa-spin"></i><p>Generando comparativas...</p></div>';

        // Obtener datos del endpoint
        const response = await fetch('/api/admin/metricas/equipos?vista=comparativa');
        const data = await response.json();

        if (data.success) {
            this.renderComparativaCompleta(data, container);
        } else {
            throw new Error(data.message || 'Error al cargar datos comparativos');
        }

    } catch (error) {
        console.error('❌ Error al cargar vista comparativa:', error);
        const container = document.getElementById('equipos-comparativa');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar vista comparativa</p>
                    <button onclick="MetricasAdmin.loadComparativaEquipos()" class="btn-retry">Reintentar</button>
                </div>
            `;
        }
    }
};

// 🏗️ Renderizar vista jerárquica completa
MetricasAdmin.renderJerarquiaCompleta = function(data, container) {
    console.log('🏗️ Renderizando jerarquía completa');

    let html = '<div class="gerentes-grid-container">';

    // Renderizar equipos de gerentes
    if (data.equipos && data.equipos.length > 0) {
        data.equipos.forEach(equipo => {
            html += this.createGerenteCard(equipo);
        });
    }

    html += '</div>';

    // Agregar sección de asesores independientes si existen
    if (data.asesores_independientes && data.asesores_independientes.length > 0) {
        html += `
            <div class="independientes-section">
                <h4 class="subsection-title">
                    <i class="fas fa-user-tie"></i> Asesores Independientes
                </h4>
                <div class="independientes-grid">
                    ${data.asesores_independientes.map(asesor => this.createIndependienteCard(asesor)).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
};

// 📊 Renderizar vista comparativa completa
MetricasAdmin.renderComparativaCompleta = function(data, container) {
    console.log('📊 Renderizando comparativa completa');

    let html = `
        <div class="comparativa-header">
            <h4>Rendimiento por Equipos</h4>
            <div class="comparativa-controls">
                <select id="comparativa-metrica" class="form-select">
                    <option value="tasa_exito">Tasa de Éxito</option>
                    <option value="total_reclutas">Total Reclutas</option>
                    <option value="equipo_size">Tamaño del Equipo</option>
                </select>
            </div>
        </div>

        <div class="comparativa-chart-container">
            <div class="chart-bars">
    `;

    if (data.equipos && data.equipos.length > 0) {
        // Ordenar por tasa de éxito para la comparativa
        const equiposOrdenados = [...data.equipos].sort((a, b) => b.tasa_exito - a.tasa_exito);

        equiposOrdenados.forEach((equipo, index) => {
            const altura = Math.max((equipo.tasa_exito / 100) * 200, 20); // Mínimo 20px

            html += `
                <div class="chart-bar-item">
                    <div class="chart-bar" style="height: ${altura}px; background: ${this.getPerformanceColor(equipo.tasa_exito)}">
                        <span class="bar-value">${equipo.tasa_exito}%</span>
                    </div>
                    <div class="bar-info">
                        <div class="bar-label">${equipo.gerente.nombre}</div>
                        <div class="bar-details">
                            <span>${equipo.total_reclutas} reclutas</span>
                            <span>${equipo.equipo_size} asesores</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `
            </div>
        </div>

        <div class="comparativa-table">
            <table class="table-comparativa">
                <thead>
                    <tr>
                        <th>Ranking</th>
                        <th>Gerente</th>
                        <th>Equipo</th>
                        <th>Total Reclutas</th>
                        <th>Tasa Éxito</th>
                        <th>Performance</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (data.equipos && data.equipos.length > 0) {
        const equiposOrdenados = [...data.equipos].sort((a, b) => b.tasa_exito - a.tasa_exito);

        equiposOrdenados.forEach((equipo, index) => {
            const performanceClass = this.getPerformanceClass(equipo.tasa_exito);

            html += `
                <tr class="comparativa-row">
                    <td><span class="ranking-badge">#${index + 1}</span></td>
                    <td>
                        <div class="gerente-info">
                            <strong>${equipo.gerente.nombre}</strong>
                            <small>${equipo.gerente.email}</small>
                        </div>
                    </td>
                    <td>${equipo.equipo_size} asesores</td>
                    <td>${equipo.total_reclutas}</td>
                    <td><span class="tasa-badge ${performanceClass}">${equipo.tasa_exito}%</span></td>
                    <td><span class="performance-badge ${performanceClass}">${performanceClass}</span></td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>
    `;

    container.innerHTML = html;

    // Agregar event listener para cambio de métrica
    const metricaSelect = container.querySelector('#comparativa-metrica');
    if (metricaSelect) {
        metricaSelect.addEventListener('change', (e) => {
            this.updateComparativaChart(data.equipos, e.target.value);
        });
    }
};

// 🎨 Crear tarjeta de gerente para vista jerárquica
MetricasAdmin.createGerenteCard = function(equipo) {
    const performanceClass = this.getPerformanceClass(equipo.tasa_exito);
    const performanceColor = this.getPerformanceColor(equipo.tasa_exito);

    return `
        <div class="gerente-card ${performanceClass}">
            <div class="gerente-header">
                <div class="gerente-avatar">
                    ${equipo.gerente.foto_url ?
                        `<img src="${equipo.gerente.foto_url}" alt="${equipo.gerente.nombre}">` :
                        `<span>${equipo.gerente.nombre.charAt(0)}</span>`
                    }
                </div>
                <div class="gerente-info">
                    <h4>${equipo.gerente.nombre}</h4>
                    <p>${equipo.gerente.email}</p>
                    <span class="performance-badge ${performanceClass}">${performanceClass}</span>
                </div>
                <div class="gerente-stats">
                    <div class="stat-item">
                        <span class="stat-value">${equipo.tasa_exito}%</span>
                        <span class="stat-label">Éxito</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${equipo.equipo_size}</span>
                        <span class="stat-label">Asesores</span>
                    </div>
                </div>
            </div>

            <div class="equipo-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${equipo.tasa_exito}%; background: ${performanceColor}"></div>
                </div>
                <small>${equipo.total_reclutas} reclutas totales</small>
            </div>

            ${equipo.asesores && equipo.asesores.length > 0 ? `
                <div class="asesores-equipo">
                    <h5>Asesores del Equipo:</h5>
                    <div class="asesores-mini-grid">
                        ${equipo.asesores.map(asesor => `
                            <div class="asesor-mini-card">
                                <span class="asesor-nombre">${asesor.nombre}</span>
                                <span class="asesor-tasa">${asesor.tasa_exito}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="gerente-actions">
                <button class="btn-detalle" onclick="MetricasAdmin.verDetalleGerente(${equipo.gerente.id})">
                    <i class="fas fa-chart-line"></i> Ver Detalle
                </button>
                <button class="btn-contactar" onclick="MetricasAdmin.contactarGerente(${equipo.gerente.id})">
                    <i class="fas fa-envelope"></i> Contactar
                </button>
            </div>
        </div>
    `;
};

// 👤 Crear tarjeta de asesor independiente
MetricasAdmin.createIndependienteCard = function(asesor) {
    const performanceClass = this.getPerformanceClass(asesor.tasa_exito);

    return `
        <div class="independiente-card ${performanceClass}">
            <div class="asesor-header">
                <div class="asesor-avatar">
                    <span>${asesor.nombre.charAt(0)}</span>
                </div>
                <div class="asesor-info">
                    <h5>${asesor.nombre}</h5>
                    <p>${asesor.email}</p>
                </div>
            </div>
            <div class="asesor-metrics">
                <span class="metric-value">${asesor.total_reclutas}</span>
                <span class="metric-label">Reclutas</span>
                <span class="performance-badge ${performanceClass}">${asesor.tasa_exito}%</span>
            </div>
            <button class="btn-mini" onclick="MetricasAdmin.verDetalleAsesor(${asesor.id})">
                Ver Detalle
            </button>
        </div>
    `;
};

// 🎨 Funciones auxiliares para colores y clases
MetricasAdmin.getPerformanceClass = function(tasa) {
    if (tasa >= 70) return 'excellent';
    if (tasa >= 50) return 'good';
    if (tasa >= 30) return 'average';
    return 'needs-improvement';
};

MetricasAdmin.getPerformanceColor = function(tasa) {
    if (tasa >= 70) return '#059669';
    if (tasa >= 50) return '#10B981';
    if (tasa >= 30) return '#F59E0B';
    return '#EF4444';
};

// 🏢 Renderizar vista jerárquica de equipos (mejorada)
MetricasAdmin.renderMetricasEquipos = function(data) {
    console.log('🏢 Renderizando métricas de equipos jerárquicas');

    // Renderizar insights
    this.renderInsightsEquipos(data);

    // Renderizar gerentes con sus equipos
    if (data.gerentes_equipos) {
        this.renderJerarquiaGerentes(data.gerentes_equipos);
    }

    // Renderizar asesores independientes
    if (data.asesores_independientes) {
        this.renderAsesoresIndependientes(data.asesores_independientes);
    }

    // Crear métricas globales consolidadas
    const globalData = this.consolidateGlobalMetrics(data);
    this.renderResumenGlobal(globalData);
};

// 🎯 Renderizar insights de equipos
MetricasAdmin.renderInsightsEquipos = function(data) {
    console.log('🎯 Renderizando insights de equipos');

    const equiposOverview = document.getElementById('equipos-overview');
    if (equiposOverview && data.gerentes_equipos) {
        const totalGerentes = data.gerentes_equipos.length;
        const totalAsesores = data.gerentes_equipos.reduce((sum, g) => sum + (g.equipo_detalle?.length || 0), 0);
        const totalIndependientes = data.asesores_independientes?.length || 0;

        equiposOverview.innerHTML = `
            <div class="equipos-overview-stats">
                <div class="overview-stat">
                    <span class="stat-number">${totalGerentes}</span>
                    <span class="stat-label">Gerentes</span>
                </div>
                <div class="overview-stat">
                    <span class="stat-number">${totalAsesores}</span>
                    <span class="stat-label">Asesores en Equipos</span>
                </div>
                <div class="overview-stat">
                    <span class="stat-number">${totalIndependientes}</span>
                    <span class="stat-label">Independientes</span>
                </div>
            </div>
        `;
    }

    // Top Gerentes
    const topGerentes = document.getElementById('top-gerentes');
    if (topGerentes && data.gerentes_equipos) {
        const gerentesSorted = [...data.gerentes_equipos].sort((a, b) =>
            (b.metricas_consolidadas?.tasa_exito || 0) - (a.metricas_consolidadas?.tasa_exito || 0)
        );

        const topHTML = gerentesSorted.slice(0, 3).map((gerente, index) => {
            const medallas = ['🥇', '🥈', '🥉'];
            return `
                <div class="top-gerente-item">
                    <span class="gerente-medalla">${medallas[index]}</span>
                    <div class="gerente-info-mini">
                        <span class="gerente-nombre">${gerente.nombre}</span>
                        <span class="gerente-tasa">${(gerente.metricas_consolidadas?.tasa_exito || 0).toFixed(1)}%</span>
                    </div>
                </div>
            `;
        }).join('');

        topGerentes.innerHTML = topHTML;
    }

    // Equipos que necesitan apoyo
    const equiposApoyo = document.getElementById('equipos-necesitan-apoyo');
    if (equiposApoyo && data.gerentes_equipos) {
        const equiposNecesitanApoyo = data.gerentes_equipos.filter(g =>
            (g.metricas_consolidadas?.tasa_exito || 0) < 40
        );

        if (equiposNecesitanApoyo.length > 0) {
            const apoyoHTML = equiposNecesitanApoyo.map(gerente => `
                <div class="equipo-apoyo-item">
                    <span class="apoyo-icon">⚠️</span>
                    <div class="apoyo-info">
                        <span class="apoyo-nombre">${gerente.nombre}</span>
                        <span class="apoyo-tasa">${(gerente.metricas_consolidadas?.tasa_exito || 0).toFixed(1)}%</span>
                    </div>
                </div>
            `).join('');

            equiposApoyo.innerHTML = apoyoHTML;
        } else {
            equiposApoyo.innerHTML = `
                <div class="no-apoyo-needed">
                    <span class="success-icon">✅</span>
                    <span>Todos los equipos están funcionando bien</span>
                </div>
            `;
        }
    }

    // Asesores independientes overview
    const asesorIndepOverview = document.getElementById('asesores-independientes-overview');
    if (asesorIndepOverview && data.asesores_independientes) {
        const totalIndep = data.asesores_independientes.length;
        const promedioExito = totalIndep > 0 ?
            data.asesores_independientes.reduce((sum, a) => sum + (a.tasa_exito || 0), 0) / totalIndep : 0;

        asesorIndepOverview.innerHTML = `
            <div class="independientes-overview">
                <div class="indep-stat">
                    <span class="stat-number">${totalIndep}</span>
                    <span class="stat-label">Total</span>
                </div>
                <div class="indep-stat">
                    <span class="stat-number">${promedioExito.toFixed(1)}%</span>
                    <span class="stat-label">Promedio Éxito</span>
                </div>
            </div>
        `;
    }
};

// 🏢 Renderizar jerarquía de gerentes con equipos
MetricasAdmin.renderJerarquiaGerentes = function(gerentes) {
    console.log('🏢 Renderizando jerarquía de gerentes');

    const container = document.getElementById('equipos-jerarquia');
    if (!container) return;

    if (!gerentes || gerentes.length === 0) {
        container.innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-users-slash"></i>
                <h3>No hay gerentes registrados</h3>
                <p>No se encontraron gerentes con equipos asignados</p>
            </div>
        `;
        return;
    }

    const gerentesHTML = gerentes.map(gerente => {
        const consolidadas = gerente.metricas_consolidadas || {};
        const equipoDetalle = gerente.equipo_detalle || [];

        // Determinar clase de performance
        const tasaExito = consolidadas.tasa_exito || 0;
        let performanceClass = 'regular';
        let performanceLabel = 'Regular';

        if (tasaExito >= 80) {
            performanceClass = 'excepcional';
            performanceLabel = 'Excepcional';
        } else if (tasaExito >= 60) {
            performanceClass = 'bueno';
            performanceLabel = 'Bueno';
        } else if (tasaExito < 40) {
            performanceClass = 'necesita-apoyo';
            performanceLabel = 'Necesita Apoyo';
        }

        return `
            <div class="gerente-equipo-card">
                <!-- Encabezado del Gerente -->
                <div class="gerente-equipo-header">
                    <div class="gerente-avatar-section">
                        <div class="gerente-avatar-container">
                            ${gerente.foto_perfil ? `
                                <img src="${gerente.foto_perfil}"
                                     alt="${gerente.nombre}"
                                     class="gerente-foto-perfil"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                                <div class="gerente-avatar gerente-avatar-fallback" style="display: none;">
                                    ${gerente.nombre.charAt(0).toUpperCase()}
                                </div>
                            ` : `
                                <div class="gerente-avatar">
                                    ${gerente.nombre.charAt(0).toUpperCase()}
                                </div>
                            `}
                            <span class="crown-icon">👑</span>
                        </div>
                        <div class="gerente-info">
                            <h4>${gerente.nombre}</h4>
                            <div class="email">${gerente.email}</div>
                        </div>
                    </div>

                    <div class="equipo-size-badge">
                        <i class="fas fa-users"></i>
                        ${equipoDetalle.length} Asesores
                    </div>

                    <div class="gerente-performance-badge ${performanceClass}">
                        <i class="fas fa-star"></i>
                        ${performanceLabel}
                    </div>
                </div>

                <!-- Métricas Consolidadas -->
                <div class="gerente-metricas-consolidadas">
                    <div class="metrica-gerente-item total">
                        <span class="metrica-gerente-valor">${consolidadas.total || 0}</span>
                        <span class="metrica-gerente-label">Total Reclutas</span>
                    </div>
                    <div class="metrica-gerente-item">
                        <span class="metrica-gerente-valor">${consolidadas.verdes || 0}</span>
                        <span class="metrica-gerente-label">Activos</span>
                    </div>
                    <div class="metrica-gerente-item">
                        <span class="metrica-gerente-valor">${consolidadas.amarillos || 0}</span>
                        <span class="metrica-gerente-label">En Proceso</span>
                    </div>
                    <div class="metrica-gerente-item tasa-exito">
                        <span class="metrica-gerente-valor">${tasaExito.toFixed(1)}%</span>
                        <span class="metrica-gerente-label">Tasa de Éxito</span>
                    </div>
                </div>

                <!-- Equipo del Gerente -->
                ${equipoDetalle.length > 0 ? `
                    <div class="equipo-section">
                        <h5><i class="fas fa-users"></i> Equipo de Asesores</h5>
                        <div class="asesores-grid-compacto">
                            ${equipoDetalle.map(asesor => {
                                const asesorTasaExito = asesor.tasa_exito || 0;
                                let asesorPerformanceClass = 'average';

                                if (asesorTasaExito >= 70) asesorPerformanceClass = 'excellent';
                                else if (asesorTasaExito >= 50) asesorPerformanceClass = 'good';
                                else if (asesorTasaExito < 30) asesorPerformanceClass = 'needs-improvement';

                                return `
                                    <div class="asesor-equipo-card">
                                        <div class="asesor-equipo-header">
                                            <div class="asesor-equipo-info">
                                                <div class="asesor-equipo-avatar">
                                                    ${asesor.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div class="asesor-equipo-details">
                                                    <h6>${asesor.nombre}</h6>
                                                    <div class="email">${asesor.email || ''}</div>
                                                </div>
                                            </div>
                                            <div class="asesor-performance-mini ${asesorPerformanceClass}">
                                                ${asesorTasaExito.toFixed(1)}%
                                            </div>
                                        </div>

                                        <div class="asesor-equipo-stats">
                                            <div class="asesor-stat-mini total">
                                                <span class="asesor-stat-number">${asesor.total || 0}</span>
                                                <span class="asesor-stat-label">Total</span>
                                            </div>
                                            <div class="asesor-stat-mini verde">
                                                <span class="asesor-stat-number">${asesor.verdes || 0}</span>
                                                <span class="asesor-stat-label">Activos</span>
                                            </div>
                                            <div class="asesor-stat-mini amarillo">
                                                <span class="asesor-stat-number">${asesor.amarillos || 0}</span>
                                                <span class="asesor-stat-label">Proceso</span>
                                            </div>
                                            <div class="asesor-stat-mini rojo">
                                                <span class="asesor-stat-number">${asesor.rojos || 0}</span>
                                                <span class="asesor-stat-label">Rechazados</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="equipo-section">
                        <h5><i class="fas fa-info-circle"></i> Sin Equipo Asignado</h5>
                        <p>Este gerente trabaja de forma independiente</p>
                    </div>
                `}
            </div>
        `;
    }).join('');

    container.innerHTML = gerentesHTML;
};

// 🎯 Filtrar equipos
MetricasAdmin.filtrarEquipos = function(filtro) {
    console.log('🎯 Filtrando equipos por:', filtro);

    const gerenteCards = document.querySelectorAll('.gerente-equipo-card');
    const asesorCards = document.querySelectorAll('.asesor-independiente-card');

    gerenteCards.forEach(card => {
        let mostrar = true;

        switch(filtro) {
            case 'gerentes':
                mostrar = true;
                break;
            case 'independientes':
                mostrar = false;
                break;
            case 'top-performance':
                const badge = card.querySelector('.gerente-performance-badge');
                mostrar = badge && (badge.classList.contains('excepcional') || badge.classList.contains('bueno'));
                break;
            case 'todos':
            default:
                mostrar = true;
                break;
        }

        card.style.display = mostrar ? 'block' : 'none';
    });

    const independientesSection = document.querySelector('.asesores-independientes-section');
    if (independientesSection) {
        switch(filtro) {
            case 'independientes':
            case 'todos':
                independientesSection.style.display = 'block';
                break;
            default:
                independientesSection.style.display = 'none';
                break;
        }
    }
};

// ⬆️ Ordenar equipos
MetricasAdmin.ordenarEquipos = function(criterio) {
    console.log('⬆️ Ordenando equipos por:', criterio);

    // Esta función se implementaría reordenando los datos y re-renderizando
    // Por ahora, simplemente recargar las métricas
    this.loadMetricas(false);
};

// 📊 Cargar vista comparativa de equipos
MetricasAdmin.loadComparativaEquipos = function() {
    console.log('📊 Cargando vista comparativa de equipos');

    const container = document.getElementById('equipos-comparativa');
    if (!container) return;

    // Placeholder para la vista comparativa
    container.innerHTML = `
        <div class="equipos-chart-container">
            <h5>Comparativa de Rendimiento por Equipos</h5>
            <div class="equipos-bars-grid">
                <div class="loading-placeholder">
                    <i class="fas fa-chart-bar fa-spin"></i>
                    <p>Generando comparativa de equipos...</p>
                </div>
            </div>
        </div>
    `;
};

// 🏢 Cargar vista jerárquica de equipos
MetricasAdmin.loadJerarquiaEquipos = function() {
    console.log('🏢 Cargando vista jerárquica de equipos');

    // Esta función reutiliza loadMetricas existente
    this.loadMetricas(false);
};

// 🎯 Renderizar asesores independientes
MetricasAdmin.renderAsesoresIndependientes = function(asesores) {
    console.log('🎯 Renderizando asesores independientes');

    // Verificar si ya existe la sección
    let independientesSection = document.querySelector('.asesores-independientes-section');

    if (!independientesSection && asesores && asesores.length > 0) {
        // Crear la sección si no existe
        const container = document.getElementById('equipos-jerarquia');
        if (container) {
            independientesSection = document.createElement('div');
            independientesSection.className = 'asesores-independientes-section';
            container.appendChild(independientesSection);
        }
    }

    if (!independientesSection) return;

    if (!asesores || asesores.length === 0) {
        independientesSection.innerHTML = `
            <h3><i class="fas fa-user-tie"></i> Asesores Independientes</h3>
            <div class="no-data-message">
                <i class="fas fa-info-circle"></i>
                <p>No hay asesores trabajando de forma independiente</p>
            </div>
        `;
        return;
    }

    const asesorIndependienteHTML = asesores.map(asesor => {
        const tasaExito = asesor.tasa_exito || 0;
        let performanceClass = 'average';

        if (tasaExito >= 70) performanceClass = 'excellent';
        else if (tasaExito >= 50) performanceClass = 'good';
        else if (tasaExito < 30) performanceClass = 'needs-improvement';

        return `
            <div class="asesor-independiente-card">
                <div class="asesor-equipo-header">
                    <div class="asesor-equipo-info">
                        <div class="asesor-equipo-avatar">
                            ${asesor.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div class="asesor-equipo-details">
                            <h6>${asesor.nombre}</h6>
                            <div class="email">${asesor.email || ''}</div>
                        </div>
                    </div>
                    <div class="asesor-performance-mini ${performanceClass}">
                        ${tasaExito.toFixed(1)}%
                    </div>
                </div>

                <div class="asesor-equipo-stats">
                    <div class="asesor-stat-mini total">
                        <span class="asesor-stat-number">${asesor.total || 0}</span>
                        <span class="asesor-stat-label">Total</span>
                    </div>
                    <div class="asesor-stat-mini verde">
                        <span class="asesor-stat-number">${asesor.verdes || 0}</span>
                        <span class="asesor-stat-label">Activos</span>
                    </div>
                    <div class="asesor-stat-mini amarillo">
                        <span class="asesor-stat-number">${asesor.amarillos || 0}</span>
                        <span class="asesor-stat-label">Proceso</span>
                    </div>
                    <div class="asesor-stat-mini rojo">
                        <span class="asesor-stat-number">${asesor.rojos || 0}</span>
                        <span class="asesor-stat-label">Rechazados</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    independientesSection.innerHTML = `
        <h3><i class="fas fa-user-tie"></i> Asesores Independientes (${asesores.length})</h3>
        <div class="asesores-independientes-grid">
            ${asesorIndependienteHTML}
        </div>
    `;
};

// ⚡ Función para consolidar métricas globales de diferentes fuentes
MetricasAdmin.consolidateGlobalMetrics = function(data) {
    console.log('⚡ Consolidando métricas globales');

    let totalReclutas = 0;
    let totalActivos = 0;
    let totalProceso = 0;
    let totalRechazados = 0;

    // Sumar desde gerentes y equipos
    if (data.gerentes_equipos) {
        data.gerentes_equipos.forEach(gerente => {
            const metricas = gerente.metricas_consolidadas || {};
            totalReclutas += metricas.total || 0;
            totalActivos += metricas.verdes || 0;
            totalProceso += metricas.amarillos || 0;
            totalRechazados += metricas.rojos || 0;
        });
    }

    // Sumar desde asesores independientes
    if (data.asesores_independientes) {
        data.asesores_independientes.forEach(asesor => {
            totalReclutas += asesor.total || 0;
            totalActivos += asesor.verdes || 0;
            totalProceso += asesor.amarillos || 0;
            totalRechazados += asesor.rojos || 0;
        });
    }

    const tasaExito = totalReclutas > 0 ? ((totalActivos / totalReclutas) * 100) : 0;

    return {
        total_reclutas: totalReclutas,
        activos: totalActivos,
        en_proceso: totalProceso,
        rechazados: totalRechazados,
        tasa_exito: tasaExito,
        distribucion: {
            verdes: totalActivos,
            amarillos: totalProceso,
            rojos: totalRechazados
        }
    };
};

// 📥 NUEVA FUNCIONALIDAD: EXPORTAR MÉTRICAS
MetricasAdmin.exportarMetricas = async function() {
    console.log('📥 Iniciando exportación de métricas...');

    try {
        // Mostrar modal de opciones de exportación
        const exportModal = this.createExportModal();
        document.body.appendChild(exportModal);

        // Manejar la selección del usuario
        const exportForm = exportModal.querySelector('#export-form');
        exportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formato = exportModal.querySelector('input[name="formato"]:checked').value;
            const incluir = {
                equipos: exportModal.querySelector('#incluir-equipos').checked,
                asesores: exportModal.querySelector('#incluir-asesores').checked,
                independientes: exportModal.querySelector('#incluir-independientes').checked
            };

            exportModal.remove();
            await this.ejecutarExportacion(formato, incluir);
        });

        // Cerrar modal
        exportModal.querySelector('.close-modal').addEventListener('click', () => {
            exportModal.remove();
        });

    } catch (error) {
        console.error('❌ Error al exportar métricas:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error al exportar métricas: ' + error.message, 'error');
        }
    }
};

// 🎨 Crear modal de exportación
MetricasAdmin.createExportModal = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-download"></i> Exportar Métricas</h3>
                <span class="close-modal">&times;</span>
            </div>

            <form id="export-form" class="modal-body">
                <div class="export-options">
                    <h4>Formato de Exportación</h4>
                    <div class="formato-opciones">
                        <label class="radio-option">
                            <input type="radio" name="formato" value="excel" checked>
                            <span class="radio-custom"></span>
                            <i class="fas fa-file-excel"></i> Excel (.xlsx)
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="formato" value="csv">
                            <span class="radio-custom"></span>
                            <i class="fas fa-file-csv"></i> CSV (.csv)
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="formato" value="pdf">
                            <span class="radio-custom"></span>
                            <i class="fas fa-file-pdf"></i> PDF (.pdf)
                        </label>
                    </div>

                    <h4>Datos a Incluir</h4>
                    <div class="incluir-opciones">
                        <label class="checkbox-option">
                            <input type="checkbox" id="incluir-equipos" checked>
                            <span class="checkbox-custom"></span>
                            Gerentes y Equipos
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="incluir-asesores" checked>
                            <span class="checkbox-custom"></span>
                            Métricas de Asesores
                        </label>
                        <label class="checkbox-option">
                            <input type="checkbox" id="incluir-independientes" checked>
                            <span class="checkbox-custom"></span>
                            Asesores Independientes
                        </label>
                    </div>
                </div>
            </form>

            <div class="modal-footer">
                <button type="button" class="btn-secondary close-modal">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="submit" form="export-form" class="btn-primary">
                    <i class="fas fa-download"></i> Exportar
                </button>
            </div>
        </div>
    `;

    return modal;
};

// ⚡ Ejecutar exportación
MetricasAdmin.ejecutarExportacion = async function(formato, incluir) {
    console.log(`📥 Exportando en formato ${formato}:`, incluir);

    try {
        // Mostrar loader
        this.showLoader();

        const response = await fetch('/api/admin/exportar-metricas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                formato: formato,
                incluir: incluir
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        // Determinar si es JSON o archivo
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            // Respuesta JSON con error o datos
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Error en la exportación');
            }

            // Si viene URL de descarga
            if (data.download_url) {
                window.open(data.download_url, '_blank');
            }
        } else {
            // Respuesta de archivo directo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Crear enlace de descarga
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Determinar nombre del archivo
            const fechaHora = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
            const extension = formato === 'excel' ? 'xlsx' : formato;
            a.download = `metricas_equipos_${fechaHora}.${extension}`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }

        if (typeof showNotification !== 'undefined') {
            showNotification('Métricas exportadas correctamente', 'success');
        }

    } catch (error) {
        console.error('❌ Error al ejecutar exportación:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error al exportar métricas: ' + error.message, 'error');
        }
    } finally {
        this.hideLoader();
    }
};

// ✅ FUNCIONES DE TESTING PARA VERIFICAR INTEGRACIÓN COMPLETA
window.testMetricasGerentes = async function() {
    console.group('🧪 TEST: Métricas de Gerentes');

    try {
        // 1. Verificar usuario actual
        const currentUser = MetricasAdmin.getCurrentUserSafe();
        console.log('👤 Usuario actual:', currentUser);

        if (!currentUser) {
            console.error('❌ No hay usuario autenticado');
            console.groupEnd();
            return false;
        }

        // 2. Test endpoint de equipos (admin)
        console.log('🔍 Testing endpoint /admin/metricas/equipos');
        try {
            const equiposResponse = await fetch('/admin/metricas/equipos');
            const equiposData = await equiposResponse.json();
            console.log('📊 Datos de equipos:', equiposData);

            if (equiposData.success) {
                console.log('✅ Endpoint equipos funciona correctamente');
                console.log(`📈 Gerentes encontrados: ${equiposData.gerentes_equipos?.length || 0}`);
                console.log(`📈 Asesores independientes: ${equiposData.asesores_independientes?.length || 0}`);
            } else {
                console.warn('⚠️ Endpoint equipos responde con error:', equiposData.message);
            }
        } catch (error) {
            console.error('❌ Error en endpoint equipos:', error);
        }

        // 3. Test endpoint de gerentes (gerente)
        console.log('🔍 Testing endpoint /admin/metricas/gerentes');
        try {
            const gerentesResponse = await fetch('/admin/metricas/gerentes');
            const gerentesData = await gerentesResponse.json();
            console.log('📊 Datos de gerentes:', gerentesData);

            if (gerentesData.success) {
                console.log('✅ Endpoint gerentes funciona correctamente');
                console.log(`🏆 Gerentes en ranking: ${gerentesData.gerentes_ranking?.length || 0}`);
                console.log(`💡 Insights disponibles:`, gerentesData.insights_gerentes);
            } else {
                console.warn('⚠️ Endpoint gerentes responde con error:', gerentesData.message);
            }
        } catch (error) {
            console.error('❌ Error en endpoint gerentes:', error);
        }

        // 4. Test de renderizado
        console.log('🎨 Testing funciones de renderizado...');

        if (typeof MetricasAdmin.renderGerentesSection === 'function') {
            console.log('✅ MetricasAdmin.renderGerentesSection disponible');
        } else {
            console.error('❌ MetricasAdmin.renderGerentesSection NO disponible');
        }

        if (typeof MetricasAdmin.renderRankingGerentes === 'function') {
            console.log('✅ MetricasAdmin.renderRankingGerentes disponible');
        } else {
            console.error('❌ MetricasAdmin.renderRankingGerentes NO disponible');
        }

        // 5. Test de inicialización según rol
        console.log(`🔐 Testing inicialización para rol: ${currentUser.rol}`);
        MetricasAdmin.setupContainer();

        const bodyClasses = document.body.className;
        console.log('📋 Clases del body:', bodyClasses);

        if (['admin', 'gerente'].includes(currentUser.rol)) {
            if (bodyClasses.includes('admin-view')) {
                console.log('✅ Clase admin-view aplicada correctamente');
            } else {
                console.warn('⚠️ Clase admin-view NO aplicada');
            }
        } else if (currentUser.rol === 'gerente') {
            if (bodyClasses.includes('gerente-view')) {
                console.log('✅ Clase gerente-view aplicada correctamente');
            } else {
                console.warn('⚠️ Clase gerente-view NO aplicada');
            }
        }

        // 6. Test de loadMetricas
        console.log('📡 Testing carga de métricas...');
        try {
            await MetricasAdmin.loadMetricas(true);
            console.log('✅ Carga de métricas completada');
        } catch (error) {
            console.error('❌ Error en carga de métricas:', error);
        }

        console.log('🎉 Test completado exitosamente');
        console.groupEnd();
        return true;

    } catch (error) {
        console.error('❌ Error durante el test:', error);
        console.groupEnd();
        return false;
    }
};

// ✅ FUNCIÓN PARA SIMULAR DATOS DE GERENTES
window.simulateGerenteMetrics = function() {
    console.log('🎭 Simulando datos de métricas para gerentes...');

    const mockGerentesData = {
        success: true,
        gerentes_ranking: [
            {
                id: 1,
                nombre: "Ana García",
                email: "ana.garcia@empresa.com",
                total_asesores: 3,
                metricas_propias: { total: 15, verdes: 12, amarillos: 2, rojos: 1 },
                metricas_equipo: { total: 45, verdes: 35, amarillos: 8, rojos: 2 },
                consolidado: { total: 60, verdes: 47, tasa_exito: 78.3 },
                kpis_liderazgo: {
                    eficiencia_equipo: 77.8,
                    nivel: "Excepcional",
                    color: "#059669",
                    score_liderazgo: 78.05
                }
            },
            {
                id: 2,
                nombre: "Carlos López",
                email: "carlos.lopez@empresa.com",
                total_asesores: 2,
                metricas_propias: { total: 8, verdes: 5, amarillos: 2, rojos: 1 },
                metricas_equipo: { total: 25, verdes: 15, amarillos: 7, rojos: 3 },
                consolidado: { total: 33, verdes: 20, tasa_exito: 60.6 },
                kpis_liderazgo: {
                    eficiencia_equipo: 60.0,
                    nivel: "Bueno",
                    color: "#10B981",
                    score_liderazgo: 60.3
                }
            }
        ],
        insights_gerentes: {
            top_gerente: null,
            total_gerentes: 2,
            gerentes_excelentes: 1,
            gerentes_necesitan_apoyo: 0,
            promedio_eficiencia: 68.9
        }
    };

    // Establecer el top gerente
    mockGerentesData.insights_gerentes.top_gerente = mockGerentesData.gerentes_ranking[0];

    console.log('📊 Datos simulados:', mockGerentesData);

    // Renderizar datos simulados
    if (typeof MetricasAdmin.renderRankingGerentes === 'function') {
        MetricasAdmin.renderRankingGerentes(mockGerentesData.gerentes_ranking);
        console.log('✅ Ranking renderizado');
    }

    if (typeof MetricasAdmin.renderInsightsGerentes === 'function') {
        MetricasAdmin.renderInsightsGerentes(mockGerentesData.insights_gerentes);
        console.log('✅ Insights renderizados');
    }

    return mockGerentesData;
};

// ✅ FUNCIÓN PARA VERIFICAR PERMISOS
window.checkGerentePermissions = function() {
    console.group('🔐 Verificando Permisos de Gerentes');

    const currentUser = MetricasAdmin.getCurrentUserSafe();
    if (!currentUser) {
        console.error('❌ No hay usuario para verificar permisos');
        console.groupEnd();
        return;
    }

    console.log('👤 Usuario:', currentUser.nombre, 'Rol:', currentUser.rol);

    // Verificar Auth functions
    if (typeof Auth !== 'undefined') {
        console.log('🔍 Verificando funciones Auth:');
        console.log('  - Auth.isAdmin():', Auth.isAdmin());
        console.log('  - Auth.isGerente():', Auth.isGerente());
        console.log('  - Auth.isAsesor():', Auth.isAsesor());
        console.log('  - Auth.isGerenteOrAdmin():', Auth.isGerenteOrAdmin());
        console.log('  - Auth.hasPermission("ver_metricas_globales"):', Auth.hasPermission('ver_metricas_globales'));
    } else {
        console.warn('⚠️ Auth no está disponible');
    }

    // Verificar elementos de UI
    console.log('🎨 Verificando elementos de UI:');
    const adminElements = document.querySelectorAll('.admin-only');
    const gerenteElements = document.querySelectorAll('.gerente-only');
    const adminGerenteElements = document.querySelectorAll('.admin-gerente-only');

    console.log(`  - Elementos .admin-only: ${adminElements.length}`);
    console.log(`  - Elementos .gerente-only: ${gerenteElements.length}`);
    console.log(`  - Elementos .admin-gerente-only: ${adminGerenteElements.length}`);

    // Verificar visibilidad según rol
    let visibleAdminElements = 0;
    let visibleGerenteElements = 0;

    adminElements.forEach(el => {
        if (el.style.display !== 'none') visibleAdminElements++;
    });

    gerenteElements.forEach(el => {
        if (el.style.display !== 'none') visibleGerenteElements++;
    });

    console.log(`  - Elementos admin visibles: ${visibleAdminElements}`);
    console.log(`  - Elementos gerente visibles: ${visibleGerenteElements}`);

    console.groupEnd();
};

// ✅ FUNCIÓN DE DEBUG PARA KPIs
window.debugKPIs = function() {
    console.log('🔍 === DEBUG KPIs ===');

    const kpiElements = {
        'kpi-conversion': document.getElementById('kpi-conversion'),
        'kpi-tiempo-promedio': document.getElementById('kpi-tiempo-promedio'),
        'kpi-satisfaccion': document.getElementById('kpi-satisfaccion'),
        'kpi-productividad': document.getElementById('kpi-productividad')
    };

    console.log('📊 Elementos KPI encontrados:');
    Object.entries(kpiElements).forEach(([name, element]) => {
        if (element) {
            console.log(`✅ ${name}: "${element.textContent}" (visible: ${element.style.display !== 'none'})`);
        } else {
            console.log(`❌ ${name}: No encontrado`);
        }
    });

    // Test manual de updateKPIs con datos simulados
    const testData = {
        gerentes_equipos: [
            {
                metricas_propias: { total: 10, verdes: 7, amarillos: 2, rojos: 1 },
                equipo_metricas: [
                    { total: 8, verdes: 5, amarillos: 2, rojos: 1 },
                    { total: 12, verdes: 8, amarillos: 3, rojos: 1 }
                ]
            }
        ],
        asesores_independientes: [
            { total: 6, verdes: 4, amarillos: 1, rojos: 1 }
        ]
    };

    console.log('🧪 Probando updateKPIs con datos simulados...');
    MetricasAdmin.updateKPIs(testData);

    console.log('📊 Valores después del test:');
    Object.entries(kpiElements).forEach(([name, element]) => {
        if (element) {
            console.log(`📈 ${name}: "${element.textContent}"`);
        }
    });

    console.log('🎉 Debug KPIs completado');
};

// ===== FUNCIONES GLOBALES DE TESTING Y DEMOSTRACIÓN =====

// 🧪 Función global para mostrar datos de demostración
window.mostrarDemostracion = function() {
    console.log('🎭 Activando modo demostración de métricas...');
    if (window.MetricasAdmin) {
        MetricasAdmin.renderMetricasDefault();
        console.log('✅ Datos de demostración cargados');
    } else {
        console.error('❌ MetricasAdmin no está disponible');
    }
};

// 🔄 Función global para recargar métricas
window.recargarMetricas = function() {
    console.log('🔄 Recargando métricas...');
    if (window.MetricasAdmin) {
        MetricasAdmin.loadMetricas(true);
    } else {
        console.error('❌ MetricasAdmin no está disponible');
    }
};

// 📥 Función global para probar exportación
window.probarExportacion = function() {
    console.log('📥 Probando función de exportación...');
    if (window.MetricasAdmin) {
        MetricasAdmin.exportarMetricas();
    } else {
        console.error('❌ MetricasAdmin no está disponible');
    }
};

// 🎯 Función global para cambiar vista
window.cambiarVista = function(vista = 'jerarquica') {
    console.log(`🎯 Cambiando a vista: ${vista}`);
    if (window.MetricasAdmin) {
        MetricasAdmin.switchView(vista);
    } else {
        console.error('❌ MetricasAdmin no está disponible');
    }
};

// 🔍 Función global para diagnóstico completo
window.diagnosticoCompleto = function() {
    console.group('🔍 DIAGNÓSTICO COMPLETO DE MÉTRICAS');

    console.log('1. Estado de MetricasAdmin:', !!window.MetricasAdmin);
    console.log('2. Usuario actual:', MetricasAdmin?.getCurrentUserSafe());
    console.log('3. Elementos DOM importantes:');
    console.log('   - equipos-jerarquia:', !!document.getElementById('equipos-jerarquia'));
    console.log('   - export-metricas-btn:', !!document.getElementById('export-metricas-btn'));
    console.log('   - vista-jerarquica:', !!document.getElementById('vista-jerarquica'));
    console.log('   - vista-comparativa:', !!document.getElementById('vista-comparativa'));

    // Probar datos de demostración
    console.log('4. Probando datos de demostración...');
    mostrarDemostracion();

    console.groupEnd();
};

// 📋 FUNCIONES FALTANTES PARA TOGGLES Y EXPORTACIÓN DE TABLA
MetricasAdmin.toggleAllDetails = function() {
    const tabla = document.getElementById('tabla-asesores-detalle');
    const toggleBtn = document.getElementById('toggle-all-details');

    if (!tabla || !toggleBtn) {
        console.warn('⚠️ Elementos de tabla no encontrados');
        return;
    }

    const filas = tabla.querySelectorAll('tbody tr:not(.loading-row)');
    const isExpanded = toggleBtn.classList.contains('expanded');

    filas.forEach(fila => {
        const detalleRow = fila.nextElementSibling;
        if (detalleRow && detalleRow.classList.contains('detalle-row')) {
            if (isExpanded) {
                detalleRow.style.display = 'none';
                fila.classList.remove('expanded');
            } else {
                detalleRow.style.display = 'table-row';
                fila.classList.add('expanded');
            }
        }
    });

    // Cambiar estado del botón
    if (isExpanded) {
        toggleBtn.classList.remove('expanded');
        toggleBtn.innerHTML = '<i class="fas fa-expand-alt"></i> Expandir Todo';
    } else {
        toggleBtn.classList.add('expanded');
        toggleBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Contraer Todo';
    }

    console.log(`📋 ${isExpanded ? 'Contraído' : 'Expandido'} detalle de ${filas.length} filas`);
};

MetricasAdmin.exportarTabla = async function() {
    console.log('📊 Exportando tabla de asesores...');

    try {
        // Verificar si hay datos cargados
        if (!this.asesoresData || this.asesoresData.length === 0) {
            throw new Error('No hay datos de asesores para exportar');
        }

        // Preparar datos para exportación
        const datosExport = {
            formato: 'excel',
            incluir: {
                asesores: true,
                equipos: false,
                independientes: true
            },
            tipo: 'tabla_detallada',
            datos: this.asesoresData
        };

        // Llamar al endpoint de exportación
        const response = await fetch('/api/admin/exportar-metricas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify(datosExport)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        // Descargar archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.style.display = 'none';
        a.href = url;
        a.download = `tabla_asesores_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.xlsx`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (typeof showNotification !== 'undefined') {
            showNotification('Tabla exportada exitosamente', 'success');
        }

    } catch (error) {
        console.error('❌ Error al exportar tabla:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error al exportar tabla: ' + error.message, 'error');
        }
    }
};

MetricasAdmin.exportarAsesorDetail = async function() {
    console.log('📊 Exportando detalle de asesor específico...');

    const modal = document.getElementById('modal-detalle-asesor');
    if (!modal || modal.style.display === 'none') {
        console.warn('⚠️ No hay detalle de asesor abierto para exportar');
        return;
    }

    // Extraer ID del asesor del modal
    const asesorTitle = modal.querySelector('#modal-asesor-nombre').textContent;
    const asesorMatch = asesorTitle.match(/Detalle de (.+)/);

    if (!asesorMatch) {
        console.warn('⚠️ No se pudo identificar el asesor actual');
        return;
    }

    try {
        // Buscar datos del asesor actual
        const asesorNombre = asesorMatch[1];
        const asesorData = this.asesoresData?.find(a => a.nombre === asesorNombre);

        if (!asesorData) {
            throw new Error('No se encontraron datos del asesor');
        }

        // Crear datos para exportación individual
        const exportData = {
            formato: 'excel',
            tipo: 'asesor_individual',
            asesor: asesorData,
            incluir_tendencia: true,
            incluir_reclutas: true
        };

        const response = await fetch('/api/admin/exportar-metricas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin',
            body: JSON.stringify(exportData)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        // Descargar archivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.style.display = 'none';
        a.href = url;
        a.download = `detalle_${asesorNombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (typeof showNotification !== 'undefined') {
            showNotification(`Detalle de ${asesorNombre} exportado exitosamente`, 'success');
        }

    } catch (error) {
        console.error('❌ Error al exportar detalle del asesor:', error);
        if (typeof showNotification !== 'undefined') {
            showNotification('Error al exportar detalle: ' + error.message, 'error');
        }
    }
};

// 🎛️ AGREGAR EVENT LISTENERS PARA LOS BOTONES FALTANTES
document.addEventListener('DOMContentLoaded', function() {
    // Toggle all details
    const toggleAllBtn = document.getElementById('toggle-all-details');
    if (toggleAllBtn) {
        toggleAllBtn.addEventListener('click', () => MetricasAdmin.toggleAllDetails());
    }

    // Export table
    const exportTableBtn = document.getElementById('export-table');
    if (exportTableBtn) {
        exportTableBtn.addEventListener('click', () => MetricasAdmin.exportarTabla());
    }

    // Export asesor detail
    const exportAsesorBtn = document.getElementById('export-asesor-detail');
    if (exportAsesorBtn) {
        exportAsesorBtn.addEventListener('click', () => MetricasAdmin.exportarAsesorDetail());
    }

    // Cerrar modales
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
});

console.log('🧪 Funciones de testing cargadas:');
console.log('   - window.testMetricasGerentes() - Test completo de métricas');
console.log('   - window.simulateGerenteMetrics() - Simular datos de gerentes');
console.log('   - window.debugKPIs() - Verificar actualización de KPIs');
console.log('   - window.mostrarDemostracion() - Cargar datos de demostración');
console.log('   - window.recargarMetricas() - Recargar métricas desde servidor');
console.log('   - window.probarExportacion() - Probar funcionalidad de exportación');
console.log('   - window.cambiarVista(vista) - Cambiar entre vista jerárquica/comparativa');
console.log('   - window.diagnosticoCompleto() - Diagnóstico completo del sistema');
console.log('   - window.checkGerentePermissions() - Verificar permisos');
// 🛡️ MANEJO DE ERRORES Y VALIDACIONES MEJORADO
MetricasAdmin.validateUserPermissions = function() {
    const user = this.getCurrentUserSafe();
    if (!user) {
        throw new Error('Usuario no autenticado');
    }

    if (user.rol !== 'admin' && user.rol !== 'gerente') {
        throw new Error('Permisos insuficientes para acceder a métricas avanzadas');
    }

    return true;
};

MetricasAdmin.handleApiError = function(error, context = 'operación') {
    console.error(`❌ Error en ${context}:`, error);

    let message = 'Error inesperado';
    let severity = 'error';

    if (error.name === 'NetworkError' || !navigator.onLine) {
        message = 'Error de conexión. Revisa tu conexión a internet.';
        severity = 'warning';
    } else if (error.status === 401) {
        message = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        severity = 'error';
        // Redirigir a login después de mostrar el mensaje
        setTimeout(() => {
            window.location.href = '/login';
        }, 3000);
    } else if (error.status === 403) {
        message = 'No tienes permisos para realizar esta acción.';
        severity = 'warning';
    } else if (error.status === 404) {
        message = 'Recurso no encontrado. Verifica que existe.';
        severity = 'warning';
    } else if (error.status === 429) {
        message = 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.';
        severity = 'warning';
    } else if (error.status >= 500) {
        message = 'Error del servidor. El equipo técnico ha sido notificado.';
        severity = 'error';
    } else if (error.message) {
        message = error.message;
    }

    // Mostrar notificación si está disponible
    if (typeof showNotification !== 'undefined') {
        showNotification(message, severity);
    }

    // Log estructurado para debugging
    console.error('Error Details:', {
        context,
        status: error.status,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        user: this.getCurrentUserSafe()?.email || 'unknown'
    });

    return { message, severity, handled: true };
};

MetricasAdmin.retryWithBackoff = async function(operation, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // No reintentar en errores de permisos o cliente
            if (error.status >= 400 && error.status < 500) {
                throw error;
            }

            if (attempt === maxRetries) {
                break;
            }

            const delay = initialDelay * Math.pow(2, attempt - 1);
            console.warn(`⚠️ Reintento ${attempt}/${maxRetries} en ${delay}ms:`, error.message);

            if (typeof showNotification !== 'undefined') {
                showNotification(`Reintentando... (${attempt}/${maxRetries})`, 'info');
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

MetricasAdmin.safeApiCall = async function(apiFunction, context, showLoading = true) {
    try {
        // Validar permisos primero
        this.validateUserPermissions();

        // Mostrar loader si se requiere
        if (showLoading) {
            this.showLoader();
        }

        // Ejecutar la función con reintentos
        const result = await this.retryWithBackoff(apiFunction);

        return result;
    } catch (error) {
        this.handleApiError(error, context);
        throw error;
    } finally {
        if (showLoading) {
            this.hideLoader();
        }
    }
};

// 🔧 Versiones mejoradas de funciones principales con manejo de errores
MetricasAdmin.loadMetricasAvanzadasSafe = async function() {
    const apiCall = async () => {
        const response = await fetch('/api/metricas_avanzadas', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }

        return await response.json();
    };

    try {
        const data = await this.safeApiCall(apiCall, 'carga de métricas avanzadas');

        if (data.success) {
            this.renderAllMetricas(data);
            this.updateLastRefresh();
            return data;
        } else {
            throw new Error(data.message || 'Error en la respuesta del servidor');
        }
    } catch (error) {
        // Mostrar datos por defecto en caso de error
        console.warn('⚠️ Cargando datos por defecto debido a error:', error.message);
        this.renderMetricasDefault();
        return null;
    }
};

MetricasAdmin.exportarMetricasSafe = async function() {
    const modal = this.createExportModal();
    document.body.appendChild(modal);

    return new Promise((resolve, reject) => {
        const exportForm = modal.querySelector('#export-form');

        exportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            try {
                const formato = modal.querySelector('input[name="formato"]:checked')?.value;
                const incluir = {
                    equipos: modal.querySelector('#incluir-equipos')?.checked || false,
                    asesores: modal.querySelector('#incluir-asesores')?.checked || false,
                    independientes: modal.querySelector('#incluir-independientes')?.checked || false
                };

                // Validaciones
                if (!formato) {
                    throw new Error('Selecciona un formato de exportación');
                }

                if (!incluir.equipos && !incluir.asesores && !incluir.independientes) {
                    throw new Error('Selecciona al menos una sección para exportar');
                }

                modal.remove();

                const apiCall = async () => {
                    const response = await fetch('/api/admin/exportar-metricas', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin',
                        body: JSON.stringify({ formato, incluir })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                        error.status = response.status;
                        throw error;
                    }

                    return response;
                };

                const response = await this.safeApiCall(apiCall, 'exportación de métricas');

                // Descargar archivo
                const blob = await response.blob();
                if (blob.size === 0) {
                    throw new Error('El archivo exportado está vacío');
                }

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `metricas_admin_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.${formato === 'excel' ? 'xlsx' : formato}`;

                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                if (typeof showNotification !== 'undefined') {
                    showNotification('Métricas exportadas exitosamente', 'success');
                }

                resolve(true);

            } catch (error) {
                this.handleApiError(error, 'exportación de métricas');
                reject(error);
            }
        });

        // Cerrar modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
            resolve(false);
        });
    });
};

// 🔒 Función para validar datos antes de renderizar
MetricasAdmin.validateMetricsData = function(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        errors.push('Los datos de métricas no son válidos');
        return errors;
    }

    // Validar KPIs globales
    if (data.global_kpis) {
        const kpis = data.global_kpis;
        if (typeof kpis.total_reclutas !== 'number' || kpis.total_reclutas < 0) {
            errors.push('Total de reclutas inválido');
        }
        if (typeof kpis.tasa_exito_global !== 'number' || kpis.tasa_exito_global < 0 || kpis.tasa_exito_global > 100) {
            errors.push('Tasa de éxito global inválida');
        }
    }

    // Validar datos de asesores
    if (data.metricas_asesores && Array.isArray(data.metricas_asesores)) {
        data.metricas_asesores.forEach((asesor, index) => {
            if (!asesor.nombre || !asesor.email) {
                errors.push(`Asesor ${index + 1}: faltan datos básicos`);
            }
            if (typeof asesor.total_reclutas !== 'number' || asesor.total_reclutas < 0) {
                errors.push(`Asesor ${asesor.nombre || index + 1}: total de reclutas inválido`);
            }
        });
    }

    // Validar datos de gerentes
    if (data.gerentes && Array.isArray(data.gerentes)) {
        data.gerentes.forEach((gerente, index) => {
            if (!gerente.nombre || !gerente.email) {
                errors.push(`Gerente ${index + 1}: faltan datos básicos`);
            }
        });
    }

    return errors;
};

// 🚨 Sistema de monitoreo de rendimiento
MetricasAdmin.performanceMonitor = {
    startTime: null,
    metrics: {},

    start: function(operation) {
        this.startTime = performance.now();
        this.metrics[operation] = { startTime: this.startTime };
    },

    end: function(operation) {
        if (!this.metrics[operation]) return;

        const endTime = performance.now();
        const duration = endTime - this.metrics[operation].startTime;
        this.metrics[operation].duration = duration;

        console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);

        // Alertar si la operación toma demasiado tiempo
        if (duration > 5000) {
            console.warn(`⚠️ Operación lenta detectada: ${operation} tomó ${duration.toFixed(2)}ms`);
        }

        return duration;
    },

    getReport: function() {
        return Object.entries(this.metrics).map(([operation, data]) => ({
            operation,
            duration: data.duration || 'En progreso',
            status: data.duration ? 'Completado' : 'En progreso'
        }));
    }
};

// 📊 Función principal mejorada con todas las validaciones
MetricasAdmin.loadMetricasWithValidation = async function(forceReload = false) {
    this.performanceMonitor.start('loadMetricas');

    try {
        // Verificar permisos
        this.validateUserPermissions();

        // Verificar conexión
        if (!navigator.onLine) {
            throw new Error('Sin conexión a internet');
        }

        // Cargar desde caché si no se fuerza la recarga
        if (!forceReload && this.cachedData && this.isCacheValid()) {
            console.log('📦 Usando datos en caché');
            this.renderAllMetricas(this.cachedData);
            this.performanceMonitor.end('loadMetricas');
            return this.cachedData;
        }

        // Cargar datos del servidor
        const data = await this.loadMetricasAvanzadasSafe();

        if (data) {
            // Validar datos
            const validationErrors = this.validateMetricsData(data);
            if (validationErrors.length > 0) {
                console.warn('⚠️ Errores de validación:', validationErrors);
                if (typeof showNotification !== 'undefined') {
                    showNotification('Algunos datos pueden no estar completos', 'warning');
                }
            }

            // Guardar en caché
            this.cachedData = data;
            this.cacheTimestamp = Date.now();
        }

        this.performanceMonitor.end('loadMetricas');
        return data;

    } catch (error) {
        this.performanceMonitor.end('loadMetricas');
        this.handleApiError(error, 'carga de métricas');
        return null;
    }
};

// 🔄 Sistema de caché mejorado
MetricasAdmin.cacheTimestamp = null;
MetricasAdmin.cachedData = null;
MetricasAdmin.CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

MetricasAdmin.isCacheValid = function() {
    return this.cacheTimestamp &&
           (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION;
};

MetricasAdmin.clearCache = function() {
    this.cachedData = null;
    this.cacheTimestamp = null;
    console.log('🗑️ Caché limpiado');
};

console.log('✅ NUEVAS FUNCIONES AGREGADAS:');
console.log('   - MetricasAdmin.toggleAllDetails() - Toggle expansión de tabla');
console.log('   - MetricasAdmin.exportarTabla() - Exportar tabla completa');
console.log('   - MetricasAdmin.exportarAsesorDetail() - Exportar detalle de asesor');
console.log('🛡️ FUNCIONES DE SEGURIDAD Y VALIDACIÓN:');
console.log('   - MetricasAdmin.validateUserPermissions() - Validar permisos de usuario');
console.log('   - MetricasAdmin.handleApiError() - Manejo robusto de errores');
console.log('   - MetricasAdmin.retryWithBackoff() - Sistema de reintentos');
console.log('   - MetricasAdmin.safeApiCall() - Llamadas API seguras');
console.log('   - MetricasAdmin.loadMetricasWithValidation() - Carga con validación completa');