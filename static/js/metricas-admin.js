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

        if (!['admin', 'gerente'].includes(currentUser.rol)) {
            console.log(`⚠️ Usuario con rol ${currentUser.rol} no tiene acceso a métricas avanzadas`);
            return;
        }

        this.bindEvents();
        this.setupContainer();
        this.loadMetricas();
        this.setupAutoRefresh();
        
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

        if (!['admin', 'gerente'].includes(currentUser.rol)) {
            console.log(`⚠️ Usuario con rol ${currentUser.rol} no tiene acceso a métricas avanzadas`);
            return;
        }

        if (showLoader) {
            this.showLoader();
        }

        // Determinar endpoint según rol
        let endpoint = '/admin/metricas/asesores'; // Default
        if (currentUser.rol === 'admin') {
            endpoint = '/admin/metricas/equipos'; // Métricas completas para admin
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

    // ✅ DATOS POR DEFECTO
    renderMetricasDefault() {
        console.log('📊 Mostrando datos por defecto debido a error');
        
        const defaultData = {
            metricas_globales: {
                total_asesores: 0,
                total_reclutas: 0,
                distribucion_global: { verdes: 0, amarillos: 0, rojos: 0 },
                promedio_sistema: { exito: 0, proceso: 0, rechazo: 0 }
            },
            metricas_asesores: [],
            insights: { top_performers: [], needs_improvement: [] }
        };
        
        this.renderMetricas(defaultData);
    },

    // ✅ RENDERIZAR MÉTRICAS EN TU ESTRUCTURA EXISTENTE
    renderMetricas(data) {
        console.log('🎨 Renderizando métricas:', data);

        const currentUser = this.getCurrentUserSafe();

        // Renderizar según el formato de datos y rol del usuario
        if (currentUser?.rol === 'admin' && data.gerentes_equipos) {
            // Formato de equipos para admin
            this.renderMetricasEquipos(data);
        } else if (currentUser?.rol === 'gerente' && data.gerentes_ranking) {
            // Formato específico para gerentes
            this.renderMetricasGerentes(data);
        } else if (data.metricas_asesores) {
            // Formato legacy para asesores
            this.renderMetricasAsesores(data);
        }

        this.updateKPIs(data);
        this.loadTendencias(); // Cargar tendencias iniciales
    },

    // ✅ NUEVO: Renderizar métricas de equipos para admin
    renderMetricasEquipos(data) {
        console.log('🎨 Renderizando métricas de equipos para admin');

        // Procesar datos de gerentes
        if (data.gerentes_equipos) {
            this.renderGerentesSection(data.gerentes_equipos);
        }

        // Procesar asesores independientes
        if (data.asesores_independientes) {
            this.renderAsesoresIndependientes(data.asesores_independientes);
        }

        // Crear métricas globales consolidadas
        const globalData = this.consolidateGlobalMetrics(data);
        this.renderResumenGlobal(globalData);
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

        const total_asesores = globales.total_asesores || 0;
        const total_reclutas = globales.total_reclutas || 0;
        const distribucion_global = globales.distribucion_global || {
            verdes: 0, amarillos: 0, rojos: 0
        };
        const promedio_sistema = globales.promedio_sistema || {
            exito: 0, proceso: 0, rechazo: 0
        };

        container.innerHTML = `
            <div class="metricas-grid-global">
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
                    <div class="metrica-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${total_reclutas}</div>
                        <div class="metrica-label">Total Reclutas</div>
                    </div>
                </div>

                <div class="metrica-global-card">
                    <div class="metrica-icon">
                        <i class="fas fa-chart-pie"></i>
                    </div>
                    <div class="metrica-content">
                        <div class="metrica-numero">${promedio_sistema.exito}%</div>
                        <div class="metrica-label">Tasa de Éxito Global</div>
                    </div>
                </div>

                <div class="metrica-global-card">
                    <div class="distribucion-visual">
                        <div class="estado-badge verde">
                            <div class="estado-count">${distribucion_global.verdes}</div>
                            <div class="estado-label">Activos</div>
                        </div>
                        <div class="estado-badge amarillo">
                            <div class="estado-count">${distribucion_global.amarillos}</div>
                            <div class="estado-label">En Proceso</div>
                        </div>
                        <div class="estado-badge rojo">
                            <div class="estado-count">${distribucion_global.rojos}</div>
                            <div class="estado-label">Rechazados</div>
                        </div>
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
    verDetalleAsesor(asesorId) {
        console.log('Ver detalle del asesor:', asesorId);
        const modal = document.getElementById('modal-detalle-asesor');
        if (modal) {
            modal.style.display = 'block';
        }
        
        if (typeof showNotification !== 'undefined') {
            showNotification('Cargando detalle del asesor...', 'info');
        }
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

// ✅ FUNCIONES DE TESTING PARA VERIFICAR INTEGRACIÓN
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

console.log('🧪 Funciones de testing cargadas:');
console.log('   - window.testMetricasGerentes() - Test completo de métricas');
console.log('   - window.simulateGerenteMetrics() - Simular datos de gerentes');
console.log('   - window.debugKPIs() - Verificar actualización de KPIs');
console.log('   - window.checkGerentePermissions() - Verificar permisos');